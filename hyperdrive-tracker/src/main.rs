use std::error::Error;
// use std::fs::File;
use std::collections::HashMap;
use std::fmt::{self, Display, Formatter};
use std::sync::Arc;

use chrono::{TimeZone, Utc};
// use csv::Writer;
use dashmap::DashMap;
use ethers::{
    contract::LogMeta,
    providers::{Middleware, Provider, Ws},
    types::{H160, I256, U256, U64},
};
use futures::StreamExt;
use hex_literal::hex;
use serde::{Deserialize, Serialize};
use tracing::{debug, info};

use hyperdrive_math::State;
use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

fn timestamp_to_string(timestamp: U256) -> String {
    let datetime = Utc
        .timestamp_opt(timestamp.as_u64() as i64, 0)
        .single()
        .ok_or("Invalid timestamp");

    match datetime {
        Ok(datetime) => datetime.to_rfc3339(),
        Err(e) => e.to_string(),
    }
}

/// Rust tests deployment
// const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("8d4928532f2dd0e2f31f447d7902197e54db2302"));
/// Agent0 artifacts expected deployment
//const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("7aba23eab591909f9dc5770cea764b8aa989dd25"));
/// Agent0 fixture deployment
//const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("6949c3f59634E94B659486648848Cd3f112AD098"));
/// Infra artifacts expected
const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("5a7e8a85db4e5734387bd66d189f32cca918ea4f"));

const START_BLOCK: u64 = 41;
const BLOCK_STEP: usize = 4;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct LongKey {
    trader: H160,
    maturity_time: U256,
}
impl Display for LongKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}-0x{:x}", self.trader, self.maturity_time)
    }
}

type Long = Vec<LongDebit>;

///Closes are negative, Opens are positive.
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct LongDebit {
    block_number: U64,
    timestamp: U256,
    base_amount: I256,
    bond_amount: I256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct ShortKey {
    trader: H160,
    maturity_time: U256,
}
impl Display for ShortKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}-0x{:x}", self.trader, self.maturity_time)
    }
}

type Short = Vec<ShortDebit>;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct ShortDebit {
    block_number: U64,
    timestamp: U256,
    base_amount: I256,
    bond_amount: I256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct LpKey {
    provider: H160,
}
impl Display for LpKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}", self.provider)
    }
}

type Lp = Vec<LpDebit>;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct LpDebit {
    block_number: U64,
    timestamp: U256,
    lp_amount: I256,
    base_amount: I256,
}

///Bond balances should never be negative.
#[derive(Serialize, Deserialize, Debug)]
struct PositionBalance {
    base_balance: I256,
    bond_balance: U256,
}
#[derive(Serialize, Deserialize, Debug)]
struct LpBalance {
    base_balance: I256,
    lp_balance: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct SharePrice {
    block_num: U64,
    price: U256,
}

async fn write_open_long(
    client: Arc<Provider<Ws>>,
    longs: Arc<DashMap<LongKey, Long>>,
    event: i_hyperdrive::OpenLongFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    debug!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        base_amount=%event.base_amount/U256::exp10(18),
        bond_amount=%event.bond_amount/U256::exp10(18),
        "OpenLong",
    );

    let key = LongKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let opening = LongDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        base_amount: I256::from_raw(event.base_amount),
        bond_amount: I256::from_raw(event.bond_amount),
    };
    let long: Long = vec![opening];
    longs
        .entry(key)
        .and_modify(|existing| existing.push(opening))
        .or_insert(long);

    Ok(())
}

async fn write_close_long(
    client: Arc<Provider<Ws>>,
    longs: Arc<DashMap<LongKey, Long>>,
    event: i_hyperdrive::CloseLongFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    debug!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        base_amount=%event.base_amount/U256::exp10(18),
        bond_amount=%event.bond_amount/U256::exp10(18),
        "CloseLong"
    );

    let key = LongKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let key_repr = serde_json::to_string(&key)?;
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let closing = LongDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        base_amount: -I256::from_raw(event.base_amount),
        bond_amount: -I256::from_raw(event.bond_amount),
    };
    longs
        .entry(key)
        .and_modify(|existing| existing.push(closing))
        .or_insert_with(|| {
            panic!("CloseLong position doesn't exist: {}", key_repr);
        });

    Ok(())
}

async fn write_open_short(
    client: Arc<Provider<Ws>>,
    shorts: Arc<DashMap<ShortKey, Short>>,
    event: i_hyperdrive::OpenShortFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    debug!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        base_amount=%event.base_amount/U256::exp10(18),
        bond_amount=%event.bond_amount/U256::exp10(18),
        "OpenShort"
    );

    let key = ShortKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let opening = ShortDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        base_amount: I256::from_raw(event.base_amount),
        bond_amount: I256::from_raw(event.bond_amount),
    };
    let short: Short = vec![opening];
    shorts
        .entry(key)
        .and_modify(|existing| existing.push(opening))
        .or_insert(short);

    Ok(())
}

async fn find_block_by_timestamp(
    client: Arc<Provider<Ws>>,
    desired_timestamp: u64,
    start_block: u64,
    end_block: U64,
) -> Result<U64, Box<dyn std::error::Error>> {
    let mut low = start_block;
    let mut high = end_block.as_u64();

    while low <= high {
        let mid = low + (high - low) / 2;
        let mid_block = client.get_block::<u64>(mid).await?.unwrap();
        match mid_block.timestamp.as_u64().cmp(&desired_timestamp) {
            std::cmp::Ordering::Less => low = mid + 1,
            std::cmp::Ordering::Greater => high = mid - 1,
            std::cmp::Ordering::Equal => return Ok(mid.into()),
        }
    }
    Ok(high.into())
}

async fn write_share_price(
    client: Arc<Provider<Ws>>,
    share_prices: Arc<DashMap<U256, SharePrice>>,
    hyperdrive_contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pool_config_ref: &i_hyperdrive::PoolConfig,
    start_block: u64,
    end_block: U64,
    short_key: ShortKey,
) -> Result<(), Box<dyn Error>> {
    let open_checkpoint_time = short_key.maturity_time - pool_config_ref.position_duration;
    let open_block_num = find_block_by_timestamp(
        client.clone(),
        open_checkpoint_time.as_u64(),
        start_block + 1,
        end_block,
    )
    .await?;
    let open_pool_info = hyperdrive_contract
        .get_pool_info()
        .block(open_block_num)
        .call()
        .await?;
    let open_state = State::new(pool_config_ref.clone(), open_pool_info);
    let open_share_price = SharePrice {
        block_num: open_block_num,
        price: open_state.info.vault_share_price,
    };

    share_prices
        .entry(open_checkpoint_time)
        .or_insert(open_share_price);

    let close_checkpoint_time = short_key.maturity_time;
    let close_block_num = find_block_by_timestamp(
        client.clone(),
        close_checkpoint_time.as_u64(),
        start_block + 1,
        end_block,
    )
    .await?;
    let close_pool_info = hyperdrive_contract
        .get_pool_info()
        .block(close_block_num)
        .call()
        .await?;
    let close_state = State::new(pool_config_ref.clone(), close_pool_info);
    let close_share_price = SharePrice {
        block_num: close_block_num,
        price: close_state.info.vault_share_price,
    };

    debug!(
        open_checkpoint_time=%open_checkpoint_time,
        open_block_num=%open_block_num,
        open_share_price=%open_share_price.price,
        close_checkpoint_time=%close_checkpoint_time,
        close_block_num=%close_block_num,
        close_share_price=%close_share_price.price,
        "SharePriceOnOpenShort"
    );

    share_prices
        .entry(close_checkpoint_time)
        .or_insert(close_share_price);

    Ok(())
}

async fn write_close_short(
    client: Arc<Provider<Ws>>,
    shorts: Arc<DashMap<ShortKey, Short>>,
    event: i_hyperdrive::CloseShortFilter,
    meta: LogMeta,
) -> Result<ShortKey, Box<dyn Error>> {
    debug!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        base_amount=%event.base_amount/U256::exp10(18),
        bond_amount=%event.bond_amount/U256::exp10(18),
        "CloseShort"
    );

    let key = ShortKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let key_repr = serde_json::to_string(&key)?;
    let block_timestamp = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let closing = ShortDebit {
        block_number: meta.block_number,
        timestamp: block_timestamp,
        base_amount: -I256::from_raw(event.base_amount),
        bond_amount: -I256::from_raw(event.bond_amount),
    };
    shorts
        .entry(key)
        .and_modify(|existing| existing.push(closing))
        .or_insert_with(|| {
            panic!("CloseShort position doesn't exist: {}", key_repr);
        });

    Ok(key)
}

// [TODO] Add Initialize event.
async fn write_initialize(
    client: Arc<Provider<Ws>>,
    lps: Arc<DashMap<LpKey, Lp>>,
    event: i_hyperdrive::InitializeFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    debug!(
        block_num=%meta.block_number,
        provider=%event.provider,
        lp_amount=%event.lp_amount/U256::exp10(18),
        base_amount=%event.base_amount/U256::exp10(18),
        "Initialize"
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
    lps.entry(key)
        .and_modify(|existing| existing.push(adding))
        .or_insert(lp);

    Ok(())
}

async fn write_add_liquidity(
    client: Arc<Provider<Ws>>,
    lps: Arc<DashMap<LpKey, Lp>>,
    event: i_hyperdrive::AddLiquidityFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    debug!(
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
    lps.entry(key)
        .and_modify(|existing| existing.push(adding))
        .or_insert(lp);

    Ok(())
}

async fn write_remove_liquidity(
    client: Arc<Provider<Ws>>,
    lps: Arc<DashMap<LpKey, Lp>>,
    event: i_hyperdrive::RemoveLiquidityFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    debug!(
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
    lps.entry(key)
        .and_modify(|existing| existing.push(removing))
        .or_insert_with(|| {
            panic!("RemoveLiquidity position doesn't exist: {}", key_repr);
        });

    Ok(())
}

async fn load_hyperdrive_events(
    longs: Arc<DashMap<LongKey, Long>>,
    shorts: Arc<DashMap<ShortKey, Short>>,
    lps: Arc<DashMap<LpKey, Lp>>,
    share_prices: Arc<DashMap<U256, SharePrice>>,
    client: Arc<Provider<Ws>>,
    hyperdrive_contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pool_config_ref: &i_hyperdrive::PoolConfig,
    start_block: u64,
    end_block: U64,
) -> Result<(), Box<dyn std::error::Error>> {
    let events = hyperdrive_contract
        .events()
        .from_block(start_block)
        .to_block(end_block);

    let mut stream = events.stream_with_meta().await?;
    while let Some(Ok((evt, meta))) = stream.next().await {
        let client = client.clone();
        let longs = longs.clone();
        let shorts = shorts.clone();
        let lps = lps.clone();
        let m = meta.clone();
        match evt {
            i_hyperdrive::IHyperdriveEvents::OpenLongFilter(event) => {
                let _ = write_open_long(client, longs, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::OpenShortFilter(event) => {
                let _ = write_open_short(client, shorts, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::InitializeFilter(event) => {
                let _ = write_initialize(client, lps, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::AddLiquidityFilter(event) => {
                let _ = write_add_liquidity(client, lps, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseLongFilter(event) => {
                let _ = write_close_long(client, longs, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseShortFilter(event) => {
                let short_key = write_close_short(client.clone(), shorts, event, m).await;
                let _ = write_share_price(
                    client.clone(),
                    share_prices.clone(),
                    hyperdrive_contract.clone(),
                    pool_config_ref,
                    start_block,
                    end_block,
                    short_key.unwrap(),
                )
                .await;
            }
            i_hyperdrive::IHyperdriveEvents::RemoveLiquidityFilter(event) => {
                let _ = write_remove_liquidity(client, lps, event, m).await;
            }
            _ => (),
        }

        if meta.block_number >= end_block {
            break;
        }
    }
    Ok(())
}

fn dump_hyperdrive_events(
    longs: DashMap<LongKey, Long>,
    shorts: DashMap<ShortKey, Short>,
    lps: DashMap<LpKey, Lp>,
    share_prices: DashMap<U256, SharePrice>,
) {
    let longs_map: HashMap<String, Long> = longs
        .into_iter()
        .map(|(key, value)| (key.to_string(), value))
        .collect();
    println!(
        "-- START LONGS --\n{}\n-- END LONGS --",
        serde_json::to_string_pretty(&longs_map).unwrap()
    );
    let shorts_map: HashMap<String, Short> = shorts
        .into_iter()
        .map(|(key, value)| (key.to_string(), value))
        .collect();
    println!(
        "-- START SHORTS --\n{}\n-- END SHORTS --",
        serde_json::to_string_pretty(&shorts_map).unwrap()
    );
    let lps_map: HashMap<String, Lp> = lps
        .into_iter()
        .map(|(key, value)| (key.to_string(), value))
        .collect();
    println!(
        "-- START LPS --\n{}\n-- END LPS --",
        serde_json::to_string_pretty(&lps_map).unwrap()
    );
    let share_prices_map: HashMap<U256, SharePrice> = share_prices.into_iter().collect();
    println!(
        "-- START SHARE_PRICES --\n{}\n-- END SHARE_PRICES --",
        serde_json::to_string_pretty(&share_prices_map).unwrap()
    );
}

async fn load_pnls(
    longs: Arc<DashMap<LongKey, Long>>,
    shorts: Arc<DashMap<ShortKey, Short>>,
    lps: Arc<DashMap<LpKey, Lp>>,
    share_prices: Arc<DashMap<U256, SharePrice>>,
    client: Arc<Provider<Ws>>,
    hyperdrive_contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    start_block: u64,
    end_block: U64,
    block_step: usize,
) -> Result<(), Box<dyn std::error::Error>> {
    for block_num in (start_block..end_block.as_u64() + 1).step_by(block_step) {
        let block_timestamp = client.get_block(block_num).await?.unwrap().timestamp;

        let pool_config = hyperdrive_contract
            .get_pool_config()
            .block(block_num)
            .call()
            .await?;
        let pool_info = hyperdrive_contract
            .get_pool_info()
            .block(block_num)
            .call()
            .await?;

        let state = State::new(pool_config, pool_info);

        // [PERF] We could build balances cumulatively in Debit objects.
        let longs_balances: DashMap<LongKey, PositionBalance> = longs
            .iter()
            .map(|entry| {
                let key = *entry.key();
                let long = entry.value().clone();
                let balance_tuple = long.iter().fold(
                    (I256::zero(), I256::zero()),
                    |(acc_base, acc_bond), debit| {
                        if debit.block_number.as_u64() <= block_num {
                            (acc_base + debit.base_amount, acc_bond + debit.bond_amount)
                        } else {
                            (acc_base, acc_bond)
                        }
                    },
                );
                (key, balance_tuple)
            })
            .map(|(key, (base_balance, bond_balance))| {
                (
                    key,
                    PositionBalance {
                        base_balance,
                        //bond_balance: U256::try_from(bond_balance).expect("Negative bond balance"),
                        bond_balance: bond_balance.try_into().expect("Negative bond balance"),
                    },
                )
            })
            .collect();

        let shorts_balances: DashMap<ShortKey, PositionBalance> = shorts
            .iter()
            .map(|entry| {
                let key = *entry.key();
                let short = entry.value().clone();
                let balance_tuple = short.iter().fold(
                    (I256::zero(), I256::zero()),
                    |(acc_base, acc_bond), debit| {
                        if debit.block_number.as_u64() <= block_num {
                            (acc_base + debit.base_amount, acc_bond + debit.bond_amount)
                        } else {
                            (acc_base, acc_bond)
                        }
                    },
                );
                (key, balance_tuple)
            })
            .map(|(key, (base_balance, bond_balance))| {
                (
                    key,
                    PositionBalance {
                        base_balance,
                        //bond_balance: U256::try_from(bond_balance).expect("Negative bond balance"),
                        bond_balance: bond_balance.try_into().expect("Negative bond balance"),
                    },
                )
            })
            .collect();

        let lps_balances: DashMap<LpKey, LpBalance> = lps
            .iter()
            .map(|entry| {
                let key = *entry.key();
                let lp = entry.value().clone();
                let balance_tuple =
                    lp.iter()
                        .fold((I256::zero(), I256::zero()), |(acc_base, acc_lp), debit| {
                            if debit.block_number.as_u64() <= block_num {
                                (acc_base + debit.base_amount, acc_lp + debit.lp_amount)
                            } else {
                                (acc_base, acc_lp)
                            }
                        });
                (key, balance_tuple)
            })
            .map(|(key, (base_balance, lp_balance))| {
                (
                    key,
                    LpBalance {
                        base_balance,
                        //bond_balance: U256::try_from(bond_balance).expect("Negative bond balance"),
                        lp_balance: lp_balance.try_into().expect("Negative LP balance"),
                    },
                )
            })
            .collect();

        let longs_pnls: DashMap<LongKey, I256> = longs
            .iter()
            .map(|entry| {
                let long_key = *entry.key();

                let balance = longs_balances.get(&long_key).unwrap();

                let normalized_time_remaining =
                    state.time_remaining_scaled(block_timestamp, long_key.maturity_time);
                // [XXX] Are we calling this fn correctly? And converting units?
                let calculated_close_shares = state
                    .calculate_close_long(balance.bond_balance, normalized_time_remaining.into());
                let calculated_close_base_amount =
                    calculated_close_shares * state.info.vault_share_price.into();

                let pnl =
                    I256::try_from(calculated_close_base_amount).unwrap() - balance.base_balance;

                (long_key, pnl)
            })
            .collect();

        let shorts_pnls: DashMap<ShortKey, I256> = shorts
            .iter()
            .map(|entry| {
                let short_key = *entry.key();

                let balance = shorts_balances.get(&short_key).unwrap();

                let normalized_time_remaining =
                    state.time_remaining_scaled(block_timestamp, short_key.maturity_time);

                let open_checkpoint_time = short_key.maturity_time - state.config.position_duration;
                let open_share_price = share_prices
                    .get(&open_checkpoint_time)
                    .expect(&format!("Expected short open checkpoint SharePrice to be recorded but did not: {:?} {:#?}", open_checkpoint_time, share_prices))
                    .price;

                let close_checkpoint_time = short_key.maturity_time;
                let close_share_price = share_prices
                    .get(&close_checkpoint_time)
                    .expect(&format!("Expected short close checkpoint SharePrice to be recorded but did not: {:?} {:#?}", open_checkpoint_time, share_prices))
                    .price;

                // [XXX] Are we calling this fn correctly?
                let calculated_close_shares = state.calculate_close_short(
                    balance.bond_balance,
                    open_share_price,
                    close_share_price,
                    normalized_time_remaining.into(),
                );
                let calculated_close_base_amount =
                    calculated_close_shares * state.info.vault_share_price.into();

                (
                    short_key,
                    I256::try_from(calculated_close_base_amount).unwrap() - balance.base_balance,
                )
            })
            .collect();

        let lps_pnls: DashMap<LpKey, I256> = lps
            .iter()
            .map(|entry| {
                let lp_key = *entry.key();

                let balance = lps_balances.get(&lp_key).unwrap();

                let calculated_present_value_shares =
                    state.calculate_present_value(block_timestamp);
                let calculated_present_value_base_amount =
                    calculated_present_value_shares * state.info.vault_share_price.into();

                (
                    lp_key,
                    I256::try_from(calculated_present_value_base_amount).unwrap()
                        - balance.base_balance,
                )
            })
            .collect();

        // [TODO] Check that initial debit == calculate_close_long at open.
        // [TODO] Check calculate_close after = calculate_close before + debit

        info!(
            "PnL block_num={} block_timestamp={} longs_at_block={:#?} longs_balances={:#?} longs_pnls={:#?} shorts_balances={:#?} shorts_pnls={:#?} lps_balances={:#?} lps_pnls={:#?}", 
            block_num,
            timestamp_to_string(block_timestamp),
            longs,
            longs_balances,
            longs_pnls,
            shorts_balances,
            shorts_pnls,
            lps_balances,
            lps_pnls
        );
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let longs = Arc::new(DashMap::new());
    let shorts = Arc::new(DashMap::new());
    let lps = Arc::new(DashMap::new());
    let share_prices = Arc::new(DashMap::new());

    // [XXX] Check how many blocks behind can the archive node produce.
    let provider = Provider::<Ws>::connect("ws://localhost:8545")
        .await
        .unwrap();
    let client = Arc::new(provider);
    let hyperdrive_4626 = i_hyperdrive::IHyperdrive::new(HYPERDRIVE_4626_ADDR, client.clone());
    let current_block = client.get_block_number().await? - 1; // -1 prevents stalling..
    let pool_config = hyperdrive_4626.get_pool_config().call().await?;
    info!("CONFIG - {:#?}", pool_config);

    load_hyperdrive_events(
        longs.clone(),
        shorts.clone(),
        lps.clone(),
        share_prices.clone(),
        client.clone(),
        hyperdrive_4626.clone(),
        &pool_config,
        START_BLOCK,
        current_block,
    )
    .await?;

    load_pnls(
        longs.clone(),
        shorts.clone(),
        lps.clone(),
        share_prices.clone(),
        client.clone(),
        hyperdrive_4626.clone(),
        START_BLOCK,
        current_block,
        BLOCK_STEP,
    )
    .await?;

    // [TODO] write_aggregates

    // [TODO] write_pnls

    let longs_value = Arc::try_unwrap(longs).unwrap();
    let shorts_value = Arc::try_unwrap(shorts).unwrap();
    let lps_value = Arc::try_unwrap(lps).unwrap();
    let share_prices_value = Arc::try_unwrap(share_prices).unwrap();
    dump_hyperdrive_events(longs_value, shorts_value, lps_value, share_prices_value);

    Ok(())
}
