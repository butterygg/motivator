use std::sync::Arc;

use ethers::{
    contract::LogMeta,
    providers::{Middleware, Provider, Ws},
    types::{I256, U256, U64},
};

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

use crate::types::*;
use crate::utils::*;
use eyre::Result;

async fn write_open_long(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::OpenLongFilter,
    meta: LogMeta,
) -> Result<()> {
    tracing::debug!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time_str=%timestamp_to_string(event.maturity_time),
        maturity_time=?event.maturity_time,
        base_amount=%event.base_amount/U256::exp10(18),
        bond_amount=%event.bond_amount/U256::exp10(18),
        "OpenLong",
    );

    let key = PositionKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let opening = PositionDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        base_amount: I256::from_raw(event.base_amount),
        bond_amount: I256::from_raw(event.bond_amount),
    };
    let long: Long = vec![opening];
    events
        .longs
        .entry(key)
        .and_modify(|existing| existing.push(opening))
        .or_insert(long);

    Ok(())
}

async fn write_close_long(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::CloseLongFilter,
    meta: LogMeta,
) -> Result<()> {
    tracing::debug!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        base_amount=%event.base_amount/U256::exp10(18),
        bond_amount=%event.bond_amount/U256::exp10(18),
        "CloseLong"
    );

    let key = PositionKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let key_repr = serde_json::to_string(&key)?;
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let closing = PositionDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        base_amount: -I256::from_raw(event.base_amount),
        bond_amount: -I256::from_raw(event.bond_amount),
    };
    events
        .longs
        .entry(key)
        .and_modify(|existing| existing.push(closing))
        .or_insert_with(|| {
            panic!("CloseLong position doesn't exist: {}", key_repr);
        });

    Ok(())
}

async fn write_open_short(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::OpenShortFilter,
    meta: LogMeta,
) -> Result<PositionKey> {
    tracing::debug!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%event.maturity_time,
        base_amount=%event.base_amount/U256::exp10(18),
        bond_amount=%event.bond_amount/U256::exp10(18),
        "OpenShort"
    );

    let key = PositionKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let opening = PositionDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        base_amount: I256::from_raw(event.base_amount),
        bond_amount: I256::from_raw(event.bond_amount),
    };
    let short: Short = vec![opening];
    events
        .shorts
        .entry(key)
        .and_modify(|existing| existing.push(opening))
        .or_insert(short);

    Ok(key)
}

///For each OpenShort, write the SharePrice corresponding to the min of its maturity time and the
///end of the timeframe.
async fn write_share_price(
    client: Arc<Provider<Ws>>,
    hyperdrive_contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pool_config: &i_hyperdrive::PoolConfig,
    start_block_num: &U64,
    end_block_num: &U64,
    events: Arc<Events>,
    short_key: PositionKey,
) -> Result<()> {
    let open_checkpoint_time = short_key.maturity_time - pool_config.position_duration;
    let open_block_num = find_block_by_timestamp(
        client.clone(),
        open_checkpoint_time.as_u64(),
        *start_block_num,
        *end_block_num,
    )
    .await
    .unwrap();
    let open_pool_info = hyperdrive_contract
        .get_pool_info()
        .block(open_block_num)
        .call()
        .await?;
    let open_state = hyperdrive_math::State::new(pool_config.clone(), open_pool_info);
    let open_share_price = SharePrice {
        block_num: open_block_num,
        price: open_state.info.vault_share_price,
    };

    events
        .share_prices
        .entry(open_checkpoint_time)
        .or_insert(open_share_price);

    let maturity_checkpoint_time = short_key.maturity_time;
    // This is not necessarily the maturity block num, if the period end is lower it will be the
    // latter.
    let maturity_block_num = find_block_by_timestamp(
        client.clone(),
        maturity_checkpoint_time.as_u64(),
        *start_block_num,
        *end_block_num,
    )
    .await
    .unwrap();
    let maturity_pool_info = hyperdrive_contract
        .get_pool_info()
        .block(maturity_block_num)
        .call()
        .await?;
    let maturity_state = hyperdrive_math::State::new(pool_config.clone(), maturity_pool_info);
    let maturity_share_price = SharePrice {
        block_num: maturity_block_num,
        price: maturity_state.info.vault_share_price,
    };

    tracing::debug!(
        open_checkpoint_time=%open_checkpoint_time,
        open_block_num=%open_block_num,
        open_share_price=%open_share_price.price,
        maturity_checkpoint_time=%maturity_checkpoint_time,
        maturity_block_num=%maturity_block_num,
        maturity_share_price=%maturity_share_price.price,
        "WriteSharePrice"
    );

    events
        .share_prices
        .entry(maturity_checkpoint_time)
        .or_insert(maturity_share_price);

    Ok(())
}

async fn write_close_short(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::CloseShortFilter,
    meta: LogMeta,
) -> Result<()> {
    tracing::debug!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%event.maturity_time,
        base_amount=%event.base_amount/U256::exp10(18),
        bond_amount=%event.bond_amount/U256::exp10(18),
        "CloseShort"
    );

    let key = PositionKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let key_repr = serde_json::to_string(&key)?;
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let closing = PositionDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        base_amount: -I256::from_raw(event.base_amount),
        bond_amount: -I256::from_raw(event.bond_amount),
    };
    events
        .shorts
        .entry(key)
        .and_modify(|existing| existing.push(closing))
        .or_insert_with(|| {
            panic!("CloseShort position doesn't exist: {}", key_repr);
        });

    Ok(())
}

async fn write_initialize(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::InitializeFilter,
    meta: LogMeta,
) -> Result<()> {
    tracing::debug!(
        block_num=%meta.block_number,
        provider=%event.provider,
        lp_amount=%event.lp_amount/U256::exp10(18),
        base_amount=%event.base_amount/U256::exp10(18),
        "InitializeLiquidity"
    );

    let key = LpKey {
        provider: event.provider,
    };
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let adding = LpDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        lp_amount: I256::from_raw(event.lp_amount),
        base_amount: I256::from_raw(event.base_amount),
    };
    let lp: Lp = vec![adding];
    events
        .lps
        .entry(key)
        .and_modify(|existing| existing.push(adding))
        .or_insert(lp);

    Ok(())
}

async fn write_add_liquidity(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::AddLiquidityFilter,
    meta: LogMeta,
) -> Result<()> {
    tracing::debug!(
        block_num=%meta.block_number,
        provider=%event.provider,
        lp_amount=%event.lp_amount/U256::exp10(18),
        base_amount=%event.base_amount/U256::exp10(18),
        "AddLiquidity"
    );

    let key = LpKey {
        provider: event.provider,
    };
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let adding = LpDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        lp_amount: I256::from_raw(event.lp_amount),
        base_amount: I256::from_raw(event.base_amount),
    };
    let lp: Lp = vec![adding];
    events
        .lps
        .entry(key)
        .and_modify(|existing| existing.push(adding))
        .or_insert(lp);

    Ok(())
}

async fn write_remove_liquidity(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::RemoveLiquidityFilter,
    meta: LogMeta,
) -> Result<()> {
    tracing::debug!(
        block_num=%meta.block_number,
        provider=%event.provider,
        lp_amount=%event.lp_amount/U256::exp10(18),
        base_amount=%event.base_amount/U256::exp10(18),
        "RemoveLiquidity"
    );

    let key = LpKey {
        provider: event.provider,
    };
    let key_repr = serde_json::to_string(&key)?;
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let removing = LpDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        lp_amount: -I256::from_raw(event.lp_amount),
        base_amount: -I256::from_raw(event.base_amount),
    };
    events
        .lps
        .entry(key)
        .and_modify(|existing| existing.push(removing))
        .or_insert_with(|| {
            panic!("RemoveLiquidity position doesn't exist: {}", key_repr);
        });

    Ok(())
}

///Loads events from page start (inclusive) to page end (**non inclusive**).
pub async fn load_events_paginated(
    conf: &RunConfig,
    events: Arc<Events>,
    page_start_block: U64,
    page_end_block: U64,
) -> Result<()> {
    // fromBlock and toBlock are inclusive.
    let contract_events = conf
        .contract
        .events()
        .from_block(page_start_block)
        .to_block(page_end_block - 1);
    let query = contract_events.query_with_meta().await?;

    for (evt, meta) in query {
        match evt.clone() {
            i_hyperdrive::IHyperdriveEvents::OpenLongFilter(event) => {
                let _ =
                    write_open_long(conf.client.clone(), events.clone(), event, meta.clone()).await;
            }
            i_hyperdrive::IHyperdriveEvents::OpenShortFilter(event) => {
                let short_key =
                    write_open_short(conf.client.clone(), events.clone(), event, meta.clone())
                        .await;
                let _ = write_share_price(
                    conf.client.clone(),
                    conf.contract.clone(),
                    &conf.pool_config,
                    &conf.deploy_block_num,
                    &conf.end_block_num,
                    events.clone(),
                    short_key?,
                )
                .await;
            }
            i_hyperdrive::IHyperdriveEvents::InitializeFilter(event) => {
                let _ = write_initialize(conf.client.clone(), events.clone(), event, meta.clone())
                    .await;
            }
            i_hyperdrive::IHyperdriveEvents::AddLiquidityFilter(event) => {
                let _ =
                    write_add_liquidity(conf.client.clone(), events.clone(), event, meta.clone())
                        .await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseLongFilter(event) => {
                let _ = write_close_long(conf.client.clone(), events.clone(), event, meta.clone())
                    .await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseShortFilter(event) => {
                let _ = write_close_short(conf.client.clone(), events.clone(), event, meta.clone())
                    .await;
            }
            i_hyperdrive::IHyperdriveEvents::RemoveLiquidityFilter(event) => {
                let _ = write_remove_liquidity(
                    conf.client.clone(),
                    events.clone(),
                    event,
                    meta.clone(),
                )
                .await;
            }
            _ => (),
        }

        tracing::debug!(meta=?meta.clone(), evt=?evt.clone(), "EndQueryEvent");
    }

    Ok(())
}
