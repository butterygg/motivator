use std::error::Error;
// use std::fs::File;
use std::sync::Arc;

use chrono::{TimeZone, Utc};
// use csv::Writer;
use dashmap::DashMap;
use ethers::{
    contract::LogMeta,
    providers::{Middleware, Provider, Ws},
    types::{H160, U256, U64},
};
use futures::StreamExt;
use hex_literal::hex;
use serde::{Deserialize, Serialize};
use tracing::info;

// use hyperdrive_math::State;
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

// [XXX] Are we bookeeping the right amounts?
#[derive(Serialize, Deserialize, Debug, Clone)]
struct Long {
    trader: H160,
    block_number: U64,
    time: U256,
    maturity_time: U256,
    base_amount: U256,
    closings: Vec<CloseLong>,
}
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
struct LongKey {
    trader: H160,
    maturity_time: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct CloseLong {
    block_number: U64,
    time: U256,
    base_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Short {
    trader: H160,
    block_number: U64,
    time: U256,
    maturity_time: U256,
    base_amount: U256,
    closings: Vec<CloseShort>,
}
// [XXX] Are we bookeeping the right amounts?
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
struct ShortKey {
    trader: H160,
    maturity_time: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct CloseShort {
    block_number: U64,
    time: U256,
    base_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Lp {
    provider: H160,
    block_number: U64,
    time: U256,
    base_amount: U256,
    removings: Vec<RemoveLiquidity>,
}
// [XXX] Are we bookeeping the right amounts?
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
struct LpKey {
    provider: H160,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RemoveLiquidity {
    block_number: U64,
    time: U256,
    base_amount: U256,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let longs = Arc::new(DashMap::new());
    let shorts = Arc::new(DashMap::new());
    let lps = Arc::new(DashMap::new());

    let provider = Provider::<Ws>::connect("ws://localhost:8545")
        .await
        .unwrap();
    let client = Arc::new(provider);

    let hyperdrive_4626 = i_hyperdrive::IHyperdrive::new(HYPERDRIVE_4626_ADDR, client.clone());

    let hyperdrive_4626_for_open_long = hyperdrive_4626.clone();
    let client_for_open_long = client.clone();
    let longs_for_open_long = longs.clone();
    let open_long_task = tokio::spawn(async move {
        let open_long_filter = hyperdrive_4626_for_open_long.open_long_filter();
        let open_long_sub = open_long_filter.stream_with_meta().await.unwrap();
        open_long_sub
            .for_each_concurrent(None, move |item| {
                let client = client_for_open_long.clone();
                let longs = longs_for_open_long.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_open_long(client, longs, event, meta).await {
                                eprintln!("Error writing event to file {:?}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error processing event: {:?}", e);
                        }
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_close_long = hyperdrive_4626.clone();
    let client_for_close_long = client.clone();
    let longs_for_close_long = longs.clone();
    let close_long_task = tokio::spawn(async move {
        let close_long_filter = hyperdrive_4626_for_close_long.close_long_filter();
        let close_long_sub = close_long_filter.stream_with_meta().await.unwrap();
        close_long_sub
            .for_each_concurrent(None, move |item| {
                let client = client_for_close_long.clone();
                let longs = longs_for_close_long.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_close_long(client, longs, event, meta).await {
                                eprintln!("Error writing event to file {:?}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error processing event: {:?}", e);
                        }
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_open_short = hyperdrive_4626.clone();
    let client_for_open_short = client.clone();
    let shorts_for_open_short = shorts.clone();
    let open_short_task = tokio::spawn(async move {
        let open_short_filter = hyperdrive_4626_for_open_short.open_short_filter();
        let open_short_sub = open_short_filter.stream_with_meta().await.unwrap();
        open_short_sub
            .for_each_concurrent(None, move |item| {
                let client = client_for_open_short.clone();
                let shorts = shorts_for_open_short.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_open_short(client, shorts, event, meta).await {
                                eprintln!("Error writing event to file: {:?}", e);
                            }
                        }
                        Err(e) => eprintln!("Error processing event: {:?}", e),
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_close_short = hyperdrive_4626.clone();
    let client_for_close_short = client.clone();
    let shorts_for_close_short = shorts.clone();
    let close_short_task = tokio::spawn(async move {
        let close_short_filter = hyperdrive_4626_for_close_short.close_short_filter();
        let close_short_sub = close_short_filter.stream_with_meta().await.unwrap();
        close_short_sub
            .for_each_concurrent(None, move |item| {
                let client = client_for_close_short.clone();
                let shorts = shorts_for_close_short.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_close_short(client, shorts, event, meta).await {
                                eprintln!("Error writing event to file: {:?}", e);
                            }
                        }
                        Err(e) => eprintln!("Error processing event: {:?}", e),
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_add_liquidity = hyperdrive_4626.clone();
    let client_for_add_liqudity = client.clone();
    let lps_for_add_liquidity = lps.clone();
    let add_liquidity_task = tokio::spawn(async move {
        let add_liquidity_filter = hyperdrive_4626_for_add_liquidity.add_liquidity_filter();
        let add_liquidity_sub = add_liquidity_filter.stream_with_meta().await.unwrap();
        add_liquidity_sub
            .for_each_concurrent(None, move |item| {
                let client = client_for_add_liqudity.clone();
                let lps = lps_for_add_liquidity.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_add_liquidity(client, lps, event, meta).await {
                                eprintln!("Error writing event to file {:?}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error processing event: {:?}", e);
                        }
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_remove_liquidity = hyperdrive_4626.clone();
    let client_for_remove_liqudity = client.clone();
    let lps_for_remove_liquidity = lps.clone();
    let remove_liquidity_task = tokio::spawn(async move {
        let remove_liquidity_filter =
            hyperdrive_4626_for_remove_liquidity.remove_liquidity_filter();
        let remove_liquidity_sub = remove_liquidity_filter.stream_with_meta().await.unwrap();
        remove_liquidity_sub
            .for_each_concurrent(None, move |item| {
                let client = client_for_remove_liqudity.clone();
                let lps = lps_for_remove_liquidity.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_remove_liquidity(client, lps, event, meta).await {
                                eprintln!("Error writing event to file {:?}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error processing event: {:?}", e);
                        }
                    }
                }
            })
            .await;
    });

    let _ = tokio::join!(
        open_long_task,
        close_long_task,
        open_short_task,
        close_short_task,
        add_liquidity_task,
        remove_liquidity_task
    );

    Ok(())
}

async fn on_open_long(
    client: Arc<Provider<Ws>>,
    longs: Arc<DashMap<LongKey, Long>>,
    event: i_hyperdrive::OpenLongFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!(
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        base_amount=%event.base_amount/U256::exp10(18),
        as_base=%event.as_base,
        "OpenLong",
    );

    let pos = Long {
        trader: event.trader,
        block_number: meta.block_number,
        time: client
            .get_block(meta.block_number)
            .await?
            .unwrap()
            .timestamp,
        maturity_time: event.maturity_time,
        base_amount: event.base_amount,
        closings: vec![],
    };
    let pos_key = LongKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    longs
        .entry(pos_key)
        .and_modify(|existing_pos| {
            existing_pos.base_amount += event.base_amount;
        })
        .or_insert(pos);

    Ok(())
}

async fn on_close_long(
    client: Arc<Provider<Ws>>,
    longs: Arc<DashMap<LongKey, Long>>,
    event: i_hyperdrive::CloseLongFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!(
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        base_amount=%event.base_amount/U256::exp10(18),
        as_base=%event.as_base,
        "CloseLong"
    );

    let pos_key = LongKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let pos_key_repr = serde_json::to_string(&pos_key)?;
    longs
        .entry(pos_key)
        .and_modify(|existing_pos| {
            existing_pos.closings.push(CloseLong {
                block_number: meta.block_number,
                time: block_time,
                base_amount: event.base_amount,
            })
        })
        .or_insert_with(|| {
            panic!("CloseLong position doesn't exist: {}", pos_key_repr);
        });

    Ok(())
}

async fn on_open_short(
    client: Arc<Provider<Ws>>,
    shorts: Arc<DashMap<ShortKey, Short>>,
    event: i_hyperdrive::OpenShortFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!(
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        base_amount=%event.base_amount/U256::exp10(18),
        as_base=%event.as_base,
        "OpenShort"
    );

    let pos = Short {
        trader: event.trader,
        block_number: meta.block_number,
        time: client
            .get_block(meta.block_number)
            .await?
            .unwrap()
            .timestamp,
        maturity_time: event.maturity_time,
        base_amount: event.base_amount,
        closings: vec![],
    };
    let pos_key = ShortKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    shorts
        .entry(pos_key)
        .and_modify(|existing_pos| {
            existing_pos.base_amount += event.base_amount;
        })
        .or_insert(pos);

    Ok(())
}
async fn on_close_short(
    client: Arc<Provider<Ws>>,
    shorts: Arc<DashMap<ShortKey, Short>>,
    event: i_hyperdrive::CloseShortFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!(
        trader=%event.trader,
        maturity_time=%timestamp_to_string(event.maturity_time),
        amount=%event.base_amount/U256::exp10(18),
        as_base=%event.as_base,
        "CloseShort"
    );

    let pos_key = ShortKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let pos_key_repr = serde_json::to_string(&pos_key)?;
    shorts
        .entry(pos_key)
        .and_modify(|existing_pos| {
            existing_pos.closings.push(CloseShort {
                block_number: meta.block_number,
                time: block_time,
                base_amount: event.base_amount,
            })
        })
        .or_insert_with(|| {
            panic!("CloseShort position doesn't exist: {}", pos_key_repr);
        });

    Ok(())
}

async fn on_add_liquidity(
    client: Arc<Provider<Ws>>,
    lps: Arc<DashMap<LpKey, Lp>>,
    event: i_hyperdrive::AddLiquidityFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!(
        provider=%event.provider,
        lp_amount=%event.lp_amount/U256::exp10(18),
        base_amount=%event.base_amount/U256::exp10(18),
        as_base=%event.as_base,
        "AddLiquidity"
    );

    let pos = Lp {
        provider: event.provider,
        block_number: meta.block_number,
        time: client
            .get_block(meta.block_number)
            .await?
            .unwrap()
            .timestamp,
        base_amount: event.base_amount,
        removings: vec![],
    };
    let pos_key = LpKey {
        provider: event.provider,
    };
    lps.entry(pos_key)
        .and_modify(|existing_pos| {
            existing_pos.base_amount += event.base_amount;
        })
        .or_insert(pos);

    Ok(())
}

async fn on_remove_liquidity(
    client: Arc<Provider<Ws>>,
    lps: Arc<DashMap<LpKey, Lp>>,
    event: i_hyperdrive::RemoveLiquidityFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!(
        provider=%event.provider,
        lp_amount=%event.lp_amount/U256::exp10(18),
        base_amount=%event.base_amount/U256::exp10(18),
        as_base=%event.as_base,
        "RemoveLiquidity"
    );

    let pos_key = LpKey {
        provider: event.provider,
    };
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let pos_key_repr = serde_json::to_string(&pos_key)?;
    lps.entry(pos_key)
        .and_modify(|existing_pos| {
            existing_pos.removings.push(RemoveLiquidity {
                block_number: meta.block_number,
                time: block_time,
                base_amount: event.base_amount,
            })
        })
        .or_insert_with(|| {
            panic!("RemoveLiquidity position doesn't exist: {}", pos_key_repr);
        });

    Ok(())
}
