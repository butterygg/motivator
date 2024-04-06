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

const FROM_BLOCK: u64 = 0;

// [XXX] Are we bookeeping the right amounts?
#[derive(Serialize, Deserialize, Debug, Clone)]
struct Long {
    trader: H160,
    maturity_time: U256,
    openings: Vec<OpenLong>,
    closings: Vec<CloseLong>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
struct LongKey {
    trader: H160,
    maturity_time: U256,
}
impl Display for LongKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}-0x{:x}", self.trader, self.maturity_time)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct OpenLong {
    block_number: U64,
    time: U256,
    base_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct CloseLong {
    block_number: U64,
    time: U256,
    base_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Short {
    trader: H160,
    maturity_time: U256,
    openings: Vec<OpenShort>,
    closings: Vec<CloseShort>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
struct ShortKey {
    trader: H160,
    maturity_time: U256,
}
impl Display for ShortKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}-0x{:x}", self.trader, self.maturity_time)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct OpenShort {
    block_number: U64,
    time: U256,
    base_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct CloseShort {
    block_number: U64,
    time: U256,
    base_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Lp {
    provider: H160,
    addings: Vec<AddLiquidity>,
    removings: Vec<RemoveLiquidity>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
struct LpKey {
    provider: H160,
}
impl Display for LpKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}", self.provider)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct AddLiquidity {
    block_number: U64,
    time: U256,
    base_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
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
    let current_block = client.get_block_number().await? - 1;

    let longs_for_load = longs.clone();
    let shorts_for_load = shorts.clone();
    let lps_for_load = lps.clone();
    read_hyperdrive_events(
        longs_for_load,
        shorts_for_load,
        lps_for_load,
        client,
        hyperdrive_4626,
        current_block,
    )
    .await?;

    write_hyperdrive_events(longs, shorts, lps);

    // for block_num in 0..=current_block.as_u64() {
    //     // Fetch logs directly using the provider and the filter
    //     let logs = provider.get_logs(&open_long_filter.into()).await?;
    // }

    // for block_num in 0..=current_block.as_u64() {
    //     if let Ok(events) = hyperdrive_4626.
    //         .query_filter(open_long_filter.clone(), block_num, block_num)
    //         .await
    //     {
    //         for event in events {
    //             on_open_long(client, longs, event, block_num);
    //         }
    //     }

    //     if let Ok(events) = hyperdrive_4626
    //         .query_filter(open_short_filter.clone(), block_num, block_num)
    //         .await
    //     {
    //         for event in events {
    //             on_open_short(client, longs, event, block_num);
    //         }
    //     }

    //     if let Ok(events) = hyperdrive_4626
    //         .query_filter(add_liquidity_filter.clone(), block_num, block_num)
    //         .await
    //     {
    //         for event in events {
    //             on_add_liquidity(client, longs, event, block_num);
    //         }
    //     }
    // }
    Ok(())
}

async fn read_hyperdrive_events(
    longs: Arc<DashMap<LongKey, Long>>,
    shorts: Arc<DashMap<ShortKey, Short>>,
    lps: Arc<DashMap<LpKey, Lp>>,
    client: Arc<Provider<Ws>>,
    hyperdrive_4626: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    current_block: U64,
) -> Result<(), Box<dyn std::error::Error>> {
    let events = hyperdrive_4626
        .events()
        .from_block(FROM_BLOCK)
        .to_block(current_block);

    let mut stream = events.stream_with_meta().await?;
    while let Some(Ok((evt, meta))) = stream.next().await {
        let client = client.clone();
        let longs = longs.clone();
        let shorts = shorts.clone();
        let lps = lps.clone();
        let m = meta.clone();
        match evt {
            i_hyperdrive::IHyperdriveEvents::OpenLongFilter(event) => {
                let _ = on_open_long(client, longs, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::OpenShortFilter(event) => {
                let _ = on_open_short(client, shorts, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::AddLiquidityFilter(event) => {
                let _ = on_add_liquidity(client, lps, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseLongFilter(event) => {
                let _ = on_close_long(client, longs, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseShortFilter(event) => {
                let _ = on_close_short(client, shorts, event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::RemoveLiquidityFilter(event) => {
                let _ = on_remove_liquidity(client, lps, event, m).await;
            }
            _ => (),
        }

        if meta.block_number >= current_block {
            break;
        }
    }
    Ok(())
}

fn write_hyperdrive_events(
    longs: Arc<DashMap<LongKey, Long>>,
    shorts: Arc<DashMap<ShortKey, Short>>,
    lps: Arc<DashMap<LpKey, Lp>>,
) {
    let longs_map: HashMap<String, Long> = Arc::try_unwrap(longs)
        .unwrap()
        .into_iter()
        .map(|(key, value)| (key.to_string(), value))
        .collect();
    println!(
        "-- START LONGS --\n{}\n-- END LONGS --",
        serde_json::to_string_pretty(&longs_map).unwrap()
    );
    let shorts_map: HashMap<String, Short> = Arc::try_unwrap(shorts)
        .unwrap()
        .into_iter()
        .map(|(key, value)| (key.to_string(), value))
        .collect();
    println!(
        "-- START SHORTS --\n{}\n-- END SHORTS --",
        serde_json::to_string_pretty(&shorts_map).unwrap()
    );
    let lps_map: HashMap<String, Lp> = Arc::try_unwrap(lps)
        .unwrap()
        .into_iter()
        .map(|(key, value)| (key.to_string(), value))
        .collect();
    println!(
        "-- START LPs --\n{}\n-- END LPs --",
        serde_json::to_string_pretty(&lps_map).unwrap()
    );
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

    let key = LongKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let opening = OpenLong {
        block_number: meta.block_number,
        time: block_time,
        base_amount: event.base_amount,
    };
    let long = Long {
        trader: event.trader,
        maturity_time: event.maturity_time,
        openings: vec![opening],
        closings: vec![],
    };
    longs
        .entry(key)
        .and_modify(|existing| existing.openings.push(opening))
        .or_insert(long);

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

    let key = LongKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let key_repr = serde_json::to_string(&key)?;
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let closing = CloseLong {
        block_number: meta.block_number,
        time: block_time,
        base_amount: event.base_amount,
    };
    longs
        .entry(key)
        .and_modify(|existing| existing.closings.push(closing))
        .or_insert_with(|| {
            panic!("CloseLong position doesn't exist: {}", key_repr);
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

    let key = ShortKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let opening = OpenShort {
        block_number: meta.block_number,
        time: block_time,
        base_amount: event.base_amount,
    };
    let short = Short {
        trader: event.trader,
        maturity_time: event.maturity_time,
        openings: vec![opening],
        closings: vec![],
    };
    shorts
        .entry(key)
        .and_modify(|existing| existing.openings.push(opening))
        .or_insert(short);

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

    let key = ShortKey {
        trader: event.trader,
        maturity_time: event.maturity_time,
    };
    let key_repr = serde_json::to_string(&key)?;
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let closing = CloseShort {
        block_number: meta.block_number,
        time: block_time,
        base_amount: event.base_amount,
    };
    shorts
        .entry(key)
        .and_modify(|existing| existing.closings.push(closing))
        .or_insert_with(|| {
            panic!("CloseShort position doesn't exist: {}", key_repr);
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

    let key = LpKey {
        provider: event.provider,
    };
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let adding = AddLiquidity {
        block_number: meta.block_number,
        time: block_time,
        base_amount: event.base_amount,
    };
    let lp = Lp {
        provider: event.provider,
        addings: vec![adding],
        removings: vec![],
    };
    lps.entry(key)
        .and_modify(|existing| existing.addings.push(adding))
        .or_insert(lp);

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

    let key = LpKey {
        provider: event.provider,
    };
    let key_repr = serde_json::to_string(&key)?;
    let block_time = client
        .get_block(meta.block_number)
        .await?
        .unwrap()
        .timestamp;
    let removing = RemoveLiquidity {
        block_number: meta.block_number,
        time: block_time,
        base_amount: event.base_amount,
    };
    lps.entry(key)
        .and_modify(|existing| existing.removings.push(removing))
        .or_insert_with(|| {
            panic!("RemoveLiquidity position doesn't exist: {}", key_repr);
        });

    Ok(())
}
