use std::error::Error;
// use std::fs::File;
use std::collections::HashMap;
use std::env;
use std::fmt::{self, Display, Formatter};
use std::sync::Arc;

use chrono::{TimeZone, Utc};
use csv::Writer;
use dashmap::DashMap;
use dotenv::dotenv;
use ethers::{
    contract::LogMeta,
    providers::{Middleware, Provider, Ws},
    types::{H160, I256, U256, U64},
};
use futures::StreamExt;
use hex_literal::hex;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use tokio::time::{self, Duration};
use tracing::{debug, info};
use uuid::Uuid;

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

// CONFIG ///////////////////////////////////////////////////

const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("392839da0dacac790bd825c81ce2c5e264d793a8"));
const HYPERDRIVE_STETH_ADDR: H160 = H160(hex!("ff33bd6d7ed4119c99c310f3e5f0fa467796ee23"));

// See https://sepolia.etherscan.io/address/0xff33bd6d7ed4119c99c310f3e5f0fa467796ee23#internaltx
const START_BLOCK: u64 = 5663018;

const HOUR: u64 = 60 * 60;

const TIMEOUT_DURATION: u64 = 30;

const DECIMAL_SCALE: u32 = 18;
const DECIMAL_PRECISION: u32 = 18;

// UTILS ///////////////////////////////////////////////////

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

trait Decimalizable {
    fn normalized(&self) -> Decimal;
}

impl Decimalizable for I256 {
    fn normalized(&self) -> Decimal {
        let val_i128 = (*self).as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}

impl Decimalizable for U256 {
    fn normalized(&self) -> Decimal {
        let val_ethers_i128 = I256::try_from(*self).unwrap();
        let val_i128 = val_ethers_i128.as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}

impl Decimalizable for fixed_point::FixedPoint {
    fn normalized(&self) -> Decimal {
        let val_ethers_i128 = I256::try_from(*self).unwrap();
        let val_i128 = val_ethers_i128.as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}

// TYPES ///////////////////////////////////////////////////

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

/// All Debits are considered from the point of view of player wallets with respect to their
/// base-token holdings.
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

// [TODO] Simplify: use only U256 price.
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
struct PositionCumulativeDebit {
    base_amount: I256,
    bond_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct LpCumulativeDebit {
    base_amount: I256,
    lp_amount: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct PositionStatement {
    cumulative_debit: PositionCumulativeDebit,
    pnl: Decimal,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct LpStatement {
    cumulative_debit: LpCumulativeDebit,
    pnl: Decimal,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct TimeData {
    timestamp: U256,
    longs: HashMap<LongKey, PositionStatement>,
    shorts: HashMap<ShortKey, PositionStatement>,
    lps: HashMap<LpKey, LpStatement>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct CumulativeDebits {
    long: I256,
    short: I256,
    lp: I256,
}

///Still scaled to the e18. Comparable to base_amounts.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct PnL {
    long: Decimal,
    short: Decimal,
    lp: Decimal,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct ActionCount {
    long: usize,
    short: usize,
    lp: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct Volume {
    long: I256,
    short: I256,
    lp: I256,
}

#[derive(Debug, Clone)]
struct HyperdriveConfig {
    // address: H160,
    contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pool_config: i_hyperdrive::PoolConfig,
    events: Arc<Events>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct UserAgg {
    action_count: ActionCount,
    volume: Volume,
    pnl: PnL,
    base_cumulative_debit: CumulativeDebits,
}

type UsersAggs = HashMap<H160, UserAgg>;

#[derive(Serialize)]
struct CsvRecord {
    id: Uuid,
    timestamp: String,
    block_number: u64,
    address: H160,
    action_count_longs: usize,
    action_count_shorts: usize,
    action_count_lps: usize,
    volume_longs: Decimal,
    volume_shorts: Decimal,
    volume_lps: Decimal,
    pnl_longs: Decimal,
    pnl_shorts: Decimal,
    pnl_lps: Decimal,
    base_balance_longs: Decimal,
    base_balance_shorts: Decimal,
    base_balance_lps: Decimal,
}

// LOAD EVENTS ///////////////////////////////////////////////////

async fn write_open_long(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::OpenLongFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time_str=%timestamp_to_string(event.maturity_time),
        maturity_time=?event.maturity_time,
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
    info!(
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
) -> Result<ShortKey, Box<dyn Error>> {
    info!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%event.maturity_time,
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

    Ok(key)
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

    let maturity_checkpoint_time = short_key.maturity_time;
    let maturity_block_num = find_block_by_timestamp(
        client.clone(),
        maturity_checkpoint_time.as_u64(),
        start_block + 1,
        end_block,
    )
    .await?;
    let maturity_pool_info = hyperdrive_contract
        .get_pool_info()
        .block(maturity_block_num)
        .call()
        .await?;
    let maturity_state = hyperdrive_math::State::new(pool_config_ref.clone(), maturity_pool_info);
    let maturity_share_price = SharePrice {
        block_num: maturity_block_num,
        price: maturity_state.info.vault_share_price,
    };

    info!(
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
) -> Result<(), Box<dyn Error>> {
    info!(
        block_num=%meta.block_number,
        trader=%event.trader,
        maturity_time=%event.maturity_time,
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

    Ok(())
}

async fn write_initialize(
    client: Arc<Provider<Ws>>,
    events: Arc<Events>,
    event: i_hyperdrive::InitializeFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!(
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
) -> Result<(), Box<dyn Error>> {
    info!(
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
    info!(
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
    client: Arc<Provider<Ws>>,
    hyperdrive_contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pool_config_ref: &i_hyperdrive::PoolConfig,
    start_block: u64,
    end_block: U64,
) -> Result<Arc<Events>, Box<dyn std::error::Error>> {
    let events = Arc::new(Events {
        longs: DashMap::new(),
        shorts: DashMap::new(),
        lps: DashMap::new(),
        share_prices: DashMap::new(),
    });

    let contract_events = hyperdrive_contract
        .events()
        .from_block(start_block)
        .to_block(end_block);

    info!(
        "StreamEvents hyperdrive_contract={:?} start_block={:?} end_block={:?}",
        hyperdrive_contract, start_block, end_block
    );

    let mut stream = contract_events.stream_with_meta().await?;
    let timeout_duration = Duration::from_secs(TIMEOUT_DURATION);

    while let Ok(Some(event_result)) = time::timeout(timeout_duration, stream.next()).await {
        match event_result {
            Ok((evt, meta)) => {
                debug!(
                    "StartStreamEvent meta={:?} evt={:?}",
                    meta.clone(),
                    evt.clone()
                );
                match evt.clone() {
                    i_hyperdrive::IHyperdriveEvents::OpenLongFilter(event) => {
                        let _ =
                            write_open_long(client.clone(), events.clone(), event, meta.clone())
                                .await;
                    }
                    i_hyperdrive::IHyperdriveEvents::OpenShortFilter(event) => {
                        let short_key =
                            write_open_short(client.clone(), events.clone(), event, meta.clone())
                                .await;
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
                    i_hyperdrive::IHyperdriveEvents::InitializeFilter(event) => {
                        let _ =
                            write_initialize(client.clone(), events.clone(), event, meta.clone())
                                .await;
                    }
                    i_hyperdrive::IHyperdriveEvents::AddLiquidityFilter(event) => {
                        let _ = write_add_liquidity(
                            client.clone(),
                            events.clone(),
                            event,
                            meta.clone(),
                        )
                        .await;
                    }
                    i_hyperdrive::IHyperdriveEvents::CloseLongFilter(event) => {
                        let _ =
                            write_close_long(client.clone(), events.clone(), event, meta.clone())
                                .await;
                    }
                    i_hyperdrive::IHyperdriveEvents::CloseShortFilter(event) => {
                        let _ =
                            write_close_short(client.clone(), events.clone(), event, meta.clone())
                                .await;
                    }
                    i_hyperdrive::IHyperdriveEvents::RemoveLiquidityFilter(event) => {
                        let _ = write_remove_liquidity(
                            client.clone(),
                            events.clone(),
                            event,
                            meta.clone(),
                        )
                        .await;
                    }
                    _ => (),
                }

                debug!(
                    "EndStreamEvent meta={:?} evt={:?}",
                    meta.clone(),
                    evt.clone()
                );

                if meta.block_number >= end_block {
                    break;
                }
            }
            Err(e) => {
                // Handle individual event errors
                panic!(
                    "Error processing contract event: hyperdrive_contract={:?} start_block={:?}\
                        end_block={:?} error={:?}",
                    hyperdrive_contract, start_block, end_block, e
                );
            }
        }
    }

    Ok(events)
}

// PNLS ///////////////////////////////////////////////////

fn calc_pnls(
    events: Arc<Events>,
    at_timestamp: U256,
    hyperdrive_state: hyperdrive_math::State,
) -> (
    HashMap<LongKey, PositionStatement>,
    HashMap<ShortKey, PositionStatement>,
    HashMap<LpKey, LpStatement>,
) {
    // [PERF] We could build these cumulatively in Debit objects.
    let longs_cumul_debits: HashMap<LongKey, PositionCumulativeDebit> = events
        .longs
        .iter()
        .map(|entry| {
            let key = *entry.key();
            let long = entry.value().clone();
            let cumul_debits_2 = long.iter().fold(
                (I256::zero(), I256::zero()),
                |(acc_base, acc_bond), debit| {
                    if debit.timestamp <= at_timestamp {
                        (acc_base + debit.base_amount, acc_bond + debit.bond_amount)
                    } else {
                        (acc_base, acc_bond)
                    }
                },
            );
            (key, cumul_debits_2)
        })
        .map(|(key, (base_cumul_debit, bond_cumul_credit))| {
            (
                key,
                PositionCumulativeDebit {
                    base_amount: base_cumul_debit,
                    bond_amount: bond_cumul_credit
                        .try_into()
                        .expect("Negative long bond balance"),
                },
            )
        })
        .collect();

    let shorts_cumul_debits: HashMap<ShortKey, PositionCumulativeDebit> = events
        .shorts
        .iter()
        .map(|entry| {
            let key = *entry.key();
            let short = entry.value().clone();
            let cumul_debits_2 = short.iter().fold(
                (I256::zero(), I256::zero()),
                |(acc_base, acc_bond), debit| {
                    if debit.timestamp <= at_timestamp {
                        (acc_base + debit.base_amount, acc_bond + debit.bond_amount)
                    } else {
                        (acc_base, acc_bond)
                    }
                },
            );
            (key, cumul_debits_2)
        })
        .map(|(key, (base_cumul_debit, bond_cumul_credit))| {
            (
                key,
                PositionCumulativeDebit {
                    base_amount: base_cumul_debit,
                    bond_amount: bond_cumul_credit
                        .try_into()
                        .expect("Negative short bond balance"),
                },
            )
        })
        .collect();

    let lps_cumul_debits: HashMap<LpKey, LpCumulativeDebit> = events
        .lps
        .iter()
        .map(|entry| {
            let key = *entry.key();
            let lp = entry.value().clone();
            let cumul_debits_2 =
                lp.iter()
                    .fold((I256::zero(), I256::zero()), |(acc_base, acc_lp), debit| {
                        if debit.timestamp <= at_timestamp {
                            (acc_base + debit.base_amount, acc_lp + debit.lp_amount)
                        } else {
                            (acc_base, acc_lp)
                        }
                    });
            (key, cumul_debits_2)
        })
        .map(|(key, (base_cumul_debit, lp_shares_credit))| {
            (
                key,
                LpCumulativeDebit {
                    base_amount: base_cumul_debit,
                    lp_amount: lp_shares_credit.try_into().expect("Negative LP balance"),
                },
            )
        })
        .collect();

    let longs_pnls: HashMap<LongKey, PositionStatement> = events
        .longs
        .iter()
        .map(|entry| {
            let long_key = *entry.key();

            let cumulative_debit = longs_cumul_debits.get(&long_key).unwrap();

            // [XXX] Are we calling this fn correctly?
            let calculated_close_shares = hyperdrive_state
                .calculate_close_long(cumulative_debit.bond_amount, long_key.maturity_time, at_timestamp);
            // Knowing `calculate_close_long` returns vault share amounts:
            // [TODO] Verify that's still the case.
            let calculated_close_base_amount =
                calculated_close_shares.normalized() * hyperdrive_state.info.vault_share_price.normalized();

            let cumulative_base_debit = cumulative_debit.base_amount.normalized();

            info!(
                "LongsPnL timestamp={} long_key={:?} cumulative_debit={:?} calculated_close_base_amount={:?}",
                timestamp_to_string(at_timestamp), long_key, cumulative_debit, calculated_close_base_amount
            );

            let pos_statement = PositionStatement {
                cumulative_debit: *cumulative_debit,
                pnl: calculated_close_base_amount - cumulative_base_debit,
            };

            (long_key, pos_statement)
        })
        .collect();

    let shorts_pnls: HashMap<ShortKey, PositionStatement> = events
        .shorts
        .iter()
        .map(|entry| {
            let short_key = *entry.key();

            let cumulative_debit = shorts_cumul_debits.get(&short_key).unwrap();

            let open_checkpoint_time =
                short_key.maturity_time - hyperdrive_state.config.position_duration;
            let open_share_errmsg = &format!(
                "Expected short open checkpoint SharePrice to be recorded but did not: \
                short_key={:?} position_duration={:?} open_checkpoint_time={:?} share_prices={:#?}",
                short_key,
                hyperdrive_state.config.position_duration,
                open_checkpoint_time,
                events.share_prices
            );
            let open_share_price = events
                .share_prices
                .get(&open_checkpoint_time)
                .expect(open_share_errmsg)
                .price;

            // [TODO] Only use maturity if in the past.
            // if (hyperdrive_state.block_time >= maturity) and (maturity in checkpoint_share_prices.index):

            let maturity_checkpoint_time = short_key.maturity_time;
            let maturity_share_errmsg = &format!(
                "Expected short maturity checkpoint SharePrice to be recorded but did not: \
                short_key={:?} position_duration={:?} maturity_checkpoint_time={:?} \
                share_prices={:#?}",
                short_key,
                hyperdrive_state.config.position_duration,
                maturity_checkpoint_time,
                events.share_prices
            );
            let maturity_share_price = events
                .share_prices
                .get(&maturity_checkpoint_time)
                .expect(maturity_share_errmsg)
                .price;

            // [XXX] Are we calling this fn correctly?
            let calculated_maturity_shares = hyperdrive_state.calculate_close_short(
                cumulative_debit.bond_amount,
                open_share_price,
                // [TODO] This one is to replace with "maturity or current":
                maturity_share_price,
                // This argument is maturity time, wheter already happened or not:
                short_key.maturity_time,
                at_timestamp, 
            );
            let calculated_maturity_base_amount = calculated_maturity_shares.normalized()
                * hyperdrive_state.info.vault_share_price.normalized();

            let cumulative_base_debit = cumulative_debit.base_amount.normalized();

            let pos_statement = PositionStatement {
                cumulative_debit: *cumulative_debit,
                pnl: calculated_maturity_base_amount - cumulative_base_debit,
            };

            debug!(
                "ShortPnL timestamp={} short_key={:?} pos_statement={:?} calc_matu_shares={:?} calc_matu_base={:?} h_state={:#?}",
                timestamp_to_string(at_timestamp),
                short_key,
                pos_statement,
                calculated_maturity_shares,
                calculated_maturity_base_amount,
                hyperdrive_state
            );

            (short_key, pos_statement)
        })
        .collect();

    let lps_pnls: HashMap<LpKey, LpStatement> = events
        .lps
        .iter()
        .map(|entry| {
            let lp_key = *entry.key();

            let cumulative_debit = lps_cumul_debits.get(&lp_key).unwrap();

            let lp_base_amount = cumulative_debit.lp_amount.normalized()
                * hyperdrive_state.info.lp_share_price.normalized();
            let cumulative_base_debit = cumulative_debit.base_amount.normalized();

            let lp_statement = LpStatement {
                cumulative_debit: *cumulative_debit,
                pnl: lp_base_amount - cumulative_base_debit,
            };

            debug!(
                "LpPnL timestamp={} lp_key={:?} lp_statement={:?}",
                timestamp_to_string(at_timestamp),
                lp_key,
                lp_statement
            );

            (lp_key, lp_statement)
        })
        .collect();

    (longs_pnls, shorts_pnls, lps_pnls)
}

// AGGREGATES //////////////////////////////////////////////

fn aggregate_per_user_over_period(
    events: Arc<Events>,
    last_time_data: TimeData,
    start_timestamp: U256,
    end_timestamp: U256,
) -> UsersAggs {
    let mut users_aggs: UsersAggs = HashMap::new();

    info!(
        start_timestamp_str = timestamp_to_string(start_timestamp),
        start_timestamp = %start_timestamp,
        end_timestamp_str = timestamp_to_string(end_timestamp),
        end_timestamp = %end_timestamp,
        "Agg"
    );

    for entry in events.longs.iter() {
        let long_key = entry.key();
        let filtered_entries: Vec<_> = entry
            .value()
            .iter()
            .filter(|debit| {
                (start_timestamp <= debit.timestamp) && (debit.timestamp < end_timestamp)
            })
            .collect();
        let agg = users_aggs.entry(long_key.trader).or_default();
        agg.action_count.long += filtered_entries.len();
        agg.volume.long += filtered_entries
            .iter()
            .map(|debit| {
                if debit.base_amount < I256::zero() {
                    -debit.base_amount
                } else {
                    debit.base_amount
                }
            })
            .sum::<I256>();
        info!(
           long_key=?long_key,
           long=?entry.value(),
           action_count_long=%agg.action_count.long,
           volume_long=%agg.volume.long,
           "LongEventInAgg"
        );
    }
    for entry in events.shorts.iter() {
        let short_key = entry.key();
        let filtered_entries: Vec<_> = entry
            .value()
            .iter()
            .filter(|debit| start_timestamp <= debit.timestamp && debit.timestamp < end_timestamp)
            .collect();
        let agg = users_aggs.entry(short_key.trader).or_default();
        agg.action_count.short += filtered_entries.len();
        agg.volume.short += filtered_entries
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
        let filtered_entries: Vec<_> = entry
            .value()
            .iter()
            .filter(|debit| start_timestamp <= debit.timestamp && debit.timestamp < end_timestamp)
            .collect();
        let agg = users_aggs.entry(lp_key.provider).or_default();
        agg.action_count.lp += filtered_entries.len();
        agg.volume.lp += filtered_entries
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

    for (long_key_ref, position_stmt_ref) in last_time_data.longs.iter() {
        let agg = users_aggs.entry(long_key_ref.trader).or_default();
        agg.pnl.long += position_stmt_ref.pnl;
        agg.base_cumulative_debit.long += position_stmt_ref.cumulative_debit.base_amount;
    }
    for (short_key_ref, position_stmt_ref) in last_time_data.shorts.iter() {
        let agg = users_aggs.entry(short_key_ref.trader).or_default();
        agg.pnl.short += position_stmt_ref.pnl;
        agg.base_cumulative_debit.short += position_stmt_ref.cumulative_debit.base_amount;
    }
    for (lp_key_ref, position_stmt_ref) in last_time_data.lps.iter() {
        let agg = users_aggs.entry(lp_key_ref.provider).or_default();
        agg.pnl.lp += position_stmt_ref.pnl;
        agg.base_cumulative_debit.lp += position_stmt_ref.cumulative_debit.base_amount;
    }

    users_aggs
}

async fn calc_contract_hourly_aggregates(
    hyperdrive: HyperdriveConfig,
    period_start: U256,
    period_end_block_num: U64,
    period_end: U256,
) -> Result<UsersAggs, Box<dyn std::error::Error>> {
    let pool_info = hyperdrive
        .contract
        .get_pool_info()
        .block(period_end_block_num)
        .call()
        .await?;
    let hyperdrive_state = hyperdrive_math::State::new(hyperdrive.pool_config.clone(), pool_info);
    // [XXX] What happens if period_end > maturity_date?
    let (longs_stmts, shorts_stmts, lps_stmts) =
        calc_pnls(hyperdrive.events.clone(), period_end, hyperdrive_state);
    let end_time_data = TimeData {
        timestamp: period_end,
        longs: longs_stmts,
        shorts: shorts_stmts,
        lps: lps_stmts,
    };

    Ok(aggregate_per_user_over_period(
        hyperdrive.events.clone(),
        end_time_data,
        period_start,
        period_end,
    ))
}

fn sum_users_aggs(aggs_list: Vec<UsersAggs>) -> UsersAggs {
    aggs_list
        .into_iter()
        .fold(HashMap::new(), |mut combined, aggs| {
            for (user, agg) in aggs {
                let combined_agg = combined.entry(user).or_default();

                combined_agg.action_count.long += agg.action_count.long;
                combined_agg.action_count.short += agg.action_count.short;
                combined_agg.action_count.lp += agg.action_count.lp;

                combined_agg.volume.long += agg.volume.long;
                combined_agg.volume.short += agg.volume.short;
                combined_agg.volume.lp += agg.volume.lp;

                combined_agg.pnl.long += agg.pnl.long;
                combined_agg.pnl.short += agg.pnl.short;
                combined_agg.pnl.lp += agg.pnl.lp;

                combined_agg.base_cumulative_debit.long += agg.base_cumulative_debit.long;
                combined_agg.base_cumulative_debit.short += agg.base_cumulative_debit.short;
                combined_agg.base_cumulative_debit.lp += agg.base_cumulative_debit.lp;
            }
            combined
        })
}

async fn dump_hourly_aggregates(
    client: Arc<Provider<Ws>>,
    hyperdrives: Vec<HyperdriveConfig>,
    start_block: u64,
    start_timestamp: U256,
    end_block: U64,
    end_timestamp: U256,
    filepath: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut period_start = start_timestamp;
    let mut period_end = start_timestamp + HOUR;

    let mut writer = Writer::from_path(filepath)?;

    while period_end < end_timestamp {
        // The PnL part doesn't need to know about `period_start` as PnLs and balances are
        // statements that we calculate at `period_end`.
        let period_end_block_num = find_block_by_timestamp(
            client.clone(),
            period_end.as_u64(),
            start_block + 1,
            end_block,
        )
        .await?;

        let mut hyperdrives_usersaggs = Vec::new();
        for hyperdrive in hyperdrives.clone() {
            hyperdrives_usersaggs.push(
                calc_contract_hourly_aggregates(
                    hyperdrive,
                    period_start,
                    period_end_block_num,
                    period_end,
                )
                .await?,
            );
        }

        let users_aggs = sum_users_aggs(hyperdrives_usersaggs);

        for (address, agg) in users_aggs {
            writer.serialize(CsvRecord {
                id: Uuid::new_v4(),
                timestamp: timestamp_to_string(period_end),
                block_number: period_end_block_num.as_u64(),
                address,
                action_count_longs: agg.action_count.long,
                action_count_shorts: agg.action_count.short,
                action_count_lps: agg.action_count.lp,
                volume_longs: agg.volume.long.normalized(),
                volume_shorts: agg.volume.short.normalized(),
                volume_lps: agg.volume.lp.normalized(),
                pnl_longs: agg.pnl.long,
                pnl_shorts: agg.pnl.short,
                pnl_lps: agg.pnl.lp,
                base_balance_longs: -agg.base_cumulative_debit.long.normalized(),
                base_balance_shorts: -agg.base_cumulative_debit.short.normalized(),
                base_balance_lps: -agg.base_cumulative_debit.lp.normalized(),
            })?
        }

        debug!(
            "HourlyDumped period_start={} period_end={}",
            timestamp_to_string(period_start),
            timestamp_to_string(period_end)
        );

        period_start += HOUR.into();
        period_end += HOUR.into();
    }

    writer.flush()?;

    Ok(())
}

// MAIN ////////////////////////////////////////////////

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // SETUP STUFF //

    tracing_subscriber::fmt::init();

    dotenv().ok();
    let infura_key = env::var("INFURA_KEY").expect("INFURA_KEY must be set");
    let infura_url = &format!("wss://sepolia.infura.io/ws/v3/{}", infura_key);

    // [XXX] Check how many blocks behind can the archive node produce.
    let provider = Provider::<Ws>::connect(infura_url).await.unwrap();
    let client = Arc::new(provider);

    let hyperdrive_addrs: Vec<H160> = vec![HYPERDRIVE_4626_ADDR, HYPERDRIVE_STETH_ADDR];

    let start_block_timestamp = client
        .clone()
        .get_block(START_BLOCK)
        .await?
        .unwrap()
        .timestamp;
    // -1 prevents stalling:
    let before_last_block = client.get_block_number().await? - 1;
    // [TODO] At week 1: seven days.
    // [TODO] At week 2: update.
    let target_end = start_block_timestamp + 5 * 60 * 60 + 1;
    //let target_end = start_block_timestamp + 60 * 60;
    let end_block = find_block_by_timestamp(
        client.clone(),
        target_end.as_u64(),
        START_BLOCK,
        before_last_block,
    )
    .await?;
    let end_block_timestamp = if end_block == before_last_block {
        client
            .clone()
            .get_block(before_last_block)
            .await?
            .unwrap()
            .timestamp
    } else {
        target_end
    };
    info!(
        "EndBlock before_last_block={:?} end_block={:?} end_block_timestamp={:?}",
        before_last_block, end_block, end_block_timestamp
    );

    // DO STUFF //

    let mut hyperdrives: Vec<HyperdriveConfig> = Vec::new();

    for address in hyperdrive_addrs {
        let contract = i_hyperdrive::IHyperdrive::new(address, client.clone());
        let pool_config = contract.clone().get_pool_config().call().await?;

        info!(
            "LoadingHyperdriveEvents hyperdrive={:?} pool_config={:#?}",
            address, &pool_config
        );

        let events = load_hyperdrive_events(
            client.clone(),
            contract.clone(),
            &pool_config,
            START_BLOCK,
            end_block,
        )
        .await?;

        hyperdrives.push(HyperdriveConfig {
            //address,
            contract,
            pool_config,
            events,
        });
    }

    info!("DumpHourlyAggregates");

    let filepath = &format!(
        "hourly--start-{}.csv",
        timestamp_to_string(start_block_timestamp)
    );

    //let current_timestamp = U256::from(Utc::now().timestamp() as u64);
    dump_hourly_aggregates(
        client.clone(),
        hyperdrives,
        START_BLOCK,
        start_block_timestamp,
        end_block,
        end_block_timestamp,
        filepath,
    )
    .await?;

    info!(file=%filepath, "DumpDone");

    Ok(())
}
