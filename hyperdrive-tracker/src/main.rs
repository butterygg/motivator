use std::error::Error;
// use std::fs::File;
use std::collections::HashMap;
use std::fmt::{self, Display, Formatter};
use std::sync::Arc;

use chrono::{TimeZone, Utc};
use csv::Writer;
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

// [TODO] Handle multiple contracts and add Aggregates at the end.

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

const WEEKLY_CSV: &str = "weekly-4626.csv";

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

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct SharePrice {
    block_num: U64,
    price: U256,
}

#[derive(Debug, Clone)]
struct Events {
    longs: DashMap<LongKey, Long>,
    shorts: DashMap<ShortKey, Short>,
    lps: DashMap<LpKey, Lp>,
    share_prices: DashMap<U256, SharePrice>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct PositionBalance {
    base_balance: I256,
    bond_balance: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct LpBalance {
    base_balance: I256,
    lp_balance: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct PositionStatement {
    balance: PositionBalance,
    pnl: I256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct LpStatement {
    balance: LpBalance,
    pnl: I256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct TimeData {
    timestamp: U256,
    longs: HashMap<LongKey, PositionStatement>,
    shorts: HashMap<ShortKey, PositionStatement>,
    lps: HashMap<LpKey, LpStatement>,
}

type Series = HashMap<u64, TimeData>;

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct PnL {
    long: I256,
    short: I256,
    lp: I256,
    total: I256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct UserAgg {
    action_count: usize,
    volume: I256,
    pnl: PnL,
}

type UsersAggs = HashMap<H160, UserAgg>;

#[derive(Serialize)]
struct CsvRecordWeeklyAggs {
    address: String,
    action_count: usize,
    volume: String,
    pnl_longs: String,
    pnl_shorts: String,
    pnl_lps: String,
}
#[derive(Serialize)]
struct CsvRecordDailyAggs {
    address: String,
    action_count: usize,
    volume: String,
}
#[derive(Serialize)]
struct CsvRecordHourlyAggs {
    address: String,
    pnl_longs: String,
    pnl_shorts: String,
    pnl_lps: String,
}

async fn write_open_long(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
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
    events
        .shorts
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
    events: Arc<Events>,
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
    let open_state = hyperdrive_math::State::new(pool_config_ref.clone(), open_pool_info);
    let open_share_price = SharePrice {
        block_num: open_block_num,
        price: open_state.info.vault_share_price,
    };

    events
        .share_prices
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
    let close_state = hyperdrive_math::State::new(pool_config_ref.clone(), close_pool_info);
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

    events
        .share_prices
        .entry(close_checkpoint_time)
        .or_insert(close_share_price);

    Ok(())
}

async fn write_close_short(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
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
    events
        .shorts
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
    events: Arc<Events>,
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
    events
        .lps
        .entry(key)
        .and_modify(|existing| existing.push(removing))
        .or_insert_with(|| {
            panic!("RemoveLiquidity position doesn't exist: {}", key_repr);
        });

    Ok(())
}

async fn load_hyperdrive_events(
    events: Arc<Events>,
    client: Arc<Provider<Ws>>,
    hyperdrive_contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pool_config_ref: &i_hyperdrive::PoolConfig,
    start_block: u64,
    end_block: U64,
) -> Result<(), Box<dyn std::error::Error>> {
    let contract_events = hyperdrive_contract
        .events()
        .from_block(start_block)
        .to_block(end_block);

    let mut stream = contract_events.stream_with_meta().await?;
    while let Some(Ok((evt, meta))) = stream.next().await {
        let c = client.clone();
        let m = meta.clone();
        match evt {
            i_hyperdrive::IHyperdriveEvents::OpenLongFilter(event) => {
                let _ = write_open_long(c, events.clone(), event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::OpenShortFilter(event) => {
                let _ = write_open_short(c, events.clone(), event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::InitializeFilter(event) => {
                let _ = write_initialize(c, events.clone(), event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::AddLiquidityFilter(event) => {
                let _ = write_add_liquidity(c, events.clone(), event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseLongFilter(event) => {
                let _ = write_close_long(c, events.clone(), event, m).await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseShortFilter(event) => {
                let short_key = write_close_short(client.clone(), events.clone(), event, m).await;
                let _ = write_share_price(
                    client.clone(),
                    events.clone(),
                    hyperdrive_contract.clone(),
                    pool_config_ref,
                    start_block,
                    end_block,
                    short_key.unwrap(),
                )
                .await;
            }
            i_hyperdrive::IHyperdriveEvents::RemoveLiquidityFilter(event) => {
                let _ = write_remove_liquidity(c, events.clone(), event, m).await;
            }
            _ => (),
        }

        if meta.block_number >= end_block {
            break;
        }
    }
    Ok(())
}

//fn dump_hyperdrive_events(events: Arc<Events>) {
//    let longs_map: HashMap<String, Long> = events
//        .longs
//        .clone()
//        .into_iter()
//        .map(|(key, value)| (key.to_string(), value))
//        .collect();
//    println!(
//        "-- START LONGS --\n{}\n-- END LONGS --",
//        serde_json::to_string_pretty(&longs_map).unwrap()
//    );
//    let shorts_map: HashMap<String, Short> = events
//        .shorts
//        .clone()
//        .into_iter()
//        .map(|(key, value)| (key.to_string(), value))
//        .collect();
//    println!(
//        "-- START SHORTS --\n{}\n-- END SHORTS --",
//        serde_json::to_string_pretty(&shorts_map).unwrap()
//    );
//    let lps_map: HashMap<String, Lp> = events
//        .lps
//        .clone()
//        .into_iter()
//        .map(|(key, value)| (key.to_string(), value))
//        .collect();
//    println!(
//        "-- START LPS --\n{}\n-- END LPS --",
//        serde_json::to_string_pretty(&lps_map).unwrap()
//    );
//    let share_prices_map: HashMap<U256, SharePrice> =
//        events.share_prices.clone().into_iter().collect();
//    println!(
//        "-- START SHARE_PRICES --\n{}\n-- END SHARE_PRICES --",
//        serde_json::to_string_pretty(&share_prices_map).unwrap()
//    );
//}

fn calc_pnls(
    events: Arc<Events>,
    block_num: u64,
    block_timestamp: U256,
    hyperdrive_state: hyperdrive_math::State,
) -> (
    HashMap<LongKey, PositionStatement>,
    HashMap<ShortKey, PositionStatement>,
    HashMap<LpKey, LpStatement>,
) {
    // [PERF] We could build balances cumulatively in Debit objects.
    let longs_balances: HashMap<LongKey, PositionBalance> = events
        .longs
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

    let shorts_balances: HashMap<ShortKey, PositionBalance> = events
        .shorts
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

    let lps_balances: HashMap<LpKey, LpBalance> = events
        .lps
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

    let longs_pnls: HashMap<LongKey, PositionStatement> = events
        .longs
        .iter()
        .map(|entry| {
            let long_key = *entry.key();

            let balance = longs_balances.get(&long_key).unwrap();

            let normalized_time_remaining =
                hyperdrive_state.time_remaining_scaled(block_timestamp, long_key.maturity_time);
            // [XXX] Are we calling this fn correctly? And converting units?
            let calculated_close_shares = hyperdrive_state
                .calculate_close_long(balance.bond_balance, normalized_time_remaining.into());
            let calculated_close_base_amount =
                calculated_close_shares * hyperdrive_state.info.vault_share_price.into();

            let pos_statement = PositionStatement {
                balance: *balance,
                pnl: I256::try_from(calculated_close_base_amount).unwrap() - balance.base_balance,
            };

            (long_key, pos_statement)
        })
        .collect();

    let shorts_pnls: HashMap<ShortKey, PositionStatement> = events.shorts
            .iter()
            .map(|entry| {
                let short_key = *entry.key();

                let balance = shorts_balances.get(&short_key).unwrap();

                let normalized_time_remaining =
                    hyperdrive_state.time_remaining_scaled(block_timestamp, short_key.maturity_time);

                let open_checkpoint_time = short_key.maturity_time - hyperdrive_state.config.position_duration;
                let open_share_price = events.share_prices
                    .get(&open_checkpoint_time)
                    .unwrap_or_else(||
                        panic!("Expected short open checkpoint SharePrice to be recorded but did not: {:?} {:#?}", open_checkpoint_time, events.share_prices)
                    )
                    .price;

                let close_checkpoint_time = short_key.maturity_time;
                let close_share_price = events.share_prices
                    .get(&close_checkpoint_time)
                    .unwrap_or_else(|| 
                        panic!("Expected short close checkpoint SharePrice to be recorded but did not: {:?} {:#?}", open_checkpoint_time, events.share_prices)
                    )
                    .price;

                // [XXX] Are we calling this fn correctly?
                let calculated_close_shares = hyperdrive_state.calculate_close_short(
                    balance.bond_balance,
                    open_share_price,
                    close_share_price,
                    normalized_time_remaining.into(),
                );
                let calculated_close_base_amount =
                    calculated_close_shares * hyperdrive_state.info.vault_share_price.into();

                let pos_statement = PositionStatement{
                    balance: *balance,
                    pnl:
                    I256::try_from(calculated_close_base_amount).unwrap() - balance.base_balance};

                (
                    short_key,
                    pos_statement
                )
            })
            .collect();

    let lps_pnls: HashMap<LpKey, LpStatement> = events
        .lps
        .iter()
        .map(|entry| {
            let lp_key = *entry.key();

            let balance = lps_balances.get(&lp_key).unwrap();

            let calculated_present_value_shares =
                hyperdrive_state.calculate_present_value(block_timestamp);
            let lp_shares = calculated_present_value_shares * balance.lp_balance.into()
                / hyperdrive_state.info.share_reserves.into();
            let lp_base_amount = lp_shares * hyperdrive_state.info.vault_share_price.into();

            let lp_statement = LpStatement {
                balance: *balance,
                pnl: I256::try_from(lp_base_amount).unwrap() - balance.base_balance,
            };

            (lp_key, lp_statement)
        })
        .collect();

    (longs_pnls, shorts_pnls, lps_pnls)
}

async fn load_pnls(
    events: Arc<Events>,
    client: Arc<Provider<Ws>>,
    hyperdrive_contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pool_config_ref: &i_hyperdrive::PoolConfig,
    start_block: u64,
    end_block: U64,
    block_step: usize,
) -> Result<Series, Box<dyn std::error::Error>> {
    let mut series: Series = HashMap::new();

    for block_num in (start_block..end_block.as_u64() + 1).step_by(block_step) {
        let block_timestamp = client.get_block(block_num).await?.unwrap().timestamp;

        let pool_info = hyperdrive_contract
            .get_pool_info()
            .block(block_num)
            .call()
            .await?;

        let hyperdrive_state = hyperdrive_math::State::new(pool_config_ref.clone(), pool_info);
        let (longs_stmts, shorts_stmts, lps_stmts) =
            calc_pnls(events.clone(), block_num, block_timestamp, hyperdrive_state);

        // [TODO] Check that initial debit == calculate_close_long at open.
        // [TODO] Check calculate_close after = calculate_close before + debit
        info!(
            "PnL block_num={} block_timestamp={} longs_stmts={:#?} shorts_stmts={:#?} lps_stmts={:#?}",
            block_num,
            timestamp_to_string(block_timestamp),
            longs_stmts,
            shorts_stmts,
            lps_stmts,
        );

        let time_data = TimeData {
            timestamp: block_timestamp,
            longs: longs_stmts,
            shorts: shorts_stmts,
            lps: lps_stmts,
        };

        series.insert(block_num, time_data);
    }

    Ok(series)
}

fn compute_users_aggregates(events: Arc<Events>, series_ref: &Series) -> UsersAggs {
    let mut users_aggs: UsersAggs = HashMap::new();

    for entry in events.longs.iter() {
        let long_key = entry.key();
        let agg = users_aggs.entry(long_key.trader).or_default();
        agg.action_count += entry.value().len();
        agg.volume += entry
            .value()
            .iter()
            .map(|debit| {
                if debit.base_amount < I256::zero() {
                    -debit.base_amount
                } else {
                    debit.base_amount
                }
            })
            .sum::<I256>();
    }
    for entry in events.shorts.iter() {
        let short_key = entry.key();
        let agg = users_aggs.entry(short_key.trader).or_default();
        agg.action_count += entry.value().len();
        agg.volume += entry
            .value()
            .iter()
            .map(|debit| {
                if debit.base_amount < I256::zero() {
                    -debit.base_amount
                } else {
                    debit.base_amount
                }
            })
            .sum::<I256>();
    }
    for entry in events.lps.iter() {
        let lp_key = entry.key();
        let agg = users_aggs.entry(lp_key.provider).or_default();
        agg.action_count += entry.value().len();
        agg.volume += entry
            .value()
            .iter()
            .map(|debit| {
                if debit.base_amount < I256::zero() {
                    -debit.base_amount
                } else {
                    debit.base_amount
                }
            })
            .sum::<I256>();
    }

    let (_, last_time_data) = series_ref.iter().max_by_key(|&(block, _)| block).unwrap();

    for (long_key_ref, position_stmt_ref) in last_time_data.longs.iter() {
        let agg = users_aggs.entry(long_key_ref.trader).or_default();
        agg.pnl.long += position_stmt_ref.pnl;
    }
    for (short_key_ref, position_stmt_ref) in last_time_data.shorts.iter() {
        let agg = users_aggs.entry(short_key_ref.trader).or_default();
        agg.pnl.short += position_stmt_ref.pnl;
    }
    for (lp_key_ref, position_stmt_ref) in last_time_data.lps.iter() {
        let agg = users_aggs.entry(lp_key_ref.provider).or_default();
        agg.pnl.lp += position_stmt_ref.pnl;
    }
    
    users_aggs
}

async fn dump_total_period_aggregates(
    events: Arc<Events>,
    series_ref: &Series,
    csv_file_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut writer = Writer::from_path(csv_file_path)?;

    let users_aggs = compute_users_aggregates(events, series_ref);

    for (address, agg) in users_aggs {
        let record = CsvRecordWeeklyAggs {
            address: address.to_string(),
            action_count: agg.action_count,
            volume: agg.volume.to_string(),
            pnl_longs: agg.pnl.long.to_string(),
            pnl_shorts: agg.pnl.short.to_string(),
            pnl_lps: agg.pnl.lp.to_string(),
        };
        writer.serialize(record)?;
    }

    writer.flush()?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let events = Arc::new(Events {
        longs: DashMap::new(),
        shorts: DashMap::new(),
        lps: DashMap::new(),
        share_prices: DashMap::new(),
    });

    // [XXX] Check how many blocks behind can the archive node produce.
    let provider = Provider::<Ws>::connect("ws://localhost:8545")
        .await
        .unwrap();
    let client = Arc::new(provider);
    let hyperdrive_4626 = i_hyperdrive::IHyperdrive::new(HYPERDRIVE_4626_ADDR, client.clone());
    let current_block = client.get_block_number().await? - 1; // -1 prevents stalling…
    let pool_config = hyperdrive_4626.get_pool_config().call().await?;
    info!("Config pool_config={:#?}", pool_config);

    load_hyperdrive_events(
        events.clone(),
        client.clone(),
        hyperdrive_4626.clone(),
        &pool_config,
        START_BLOCK,
        current_block,
    )
    .await?;

    info!(
        "Events longs={:#?} shorts={:#?} lps={:#?} share_prices={:#?}",
        events.longs, events.shorts, events.lps, events.share_prices
    );

    let series = load_pnls(
        events.clone(),
        client.clone(),
        hyperdrive_4626.clone(),
        &pool_config,
        START_BLOCK,
        current_block,
        BLOCK_STEP,
    )
    .await?;

    dump_total_period_aggregates(events.clone(), &series, WEEKLY_CSV).await?;

    Ok(())
}
