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

// CONFIG ///////////////////////////////////////////////////

/// Rust tests deployment
// const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("8d4928532f2dd0e2f31f447d7902197e54db2302"));
/// Agent0 artifacts expected deployment
//const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("7aba23eab591909f9dc5770cea764b8aa989dd25"));
/// Agent0 fixture deployment
//const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("6949c3f59634E94B659486648848Cd3f112AD098"));
/// Infra artifacts
const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("5a7e8a85db4e5734387bd66d189f32cca918ea4f"));

// [TODO] Replace with block right before Sepolia contracts deployment.
const START_BLOCK: u64 = 41;

const HOUR: u64 = 60 * 60;

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

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct TimeData {
    timestamp: U256,
    longs: HashMap<LongKey, PositionStatement>,
    shorts: HashMap<ShortKey, PositionStatement>,
    lps: HashMap<LpKey, LpStatement>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct BaseDebitBalance {
    long: I256,
    short: I256,
    lp: I256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct PnL {
    long: I256,
    short: I256,
    lp: I256,
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
    balance: BaseDebitBalance,
}

type UsersAggs = HashMap<H160, UserAgg>;

#[derive(Serialize)]
struct CsvRecord {
    week: String,
    address: H160,
    action_count_longs: usize,
    action_count_shorts: usize,
    action_count_lps: usize,
    volume_longs: String,
    volume_shorts: String,
    volume_lps: String,
    pnl_longs: String,
    pnl_shorts: String,
    pnl_lps: String,
    balance_longs: String,
    balance_shorts: String,
    balance_lps: String,
}

// LOAD EVENTS ///////////////////////////////////////////////////

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

    debug!(
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
    while let Some(Ok((evt, meta))) = stream.next().await {
        match evt {
            i_hyperdrive::IHyperdriveEvents::OpenLongFilter(event) => {
                let _ = write_open_long(client.clone(), events.clone(), event, meta.clone()).await;
            }
            i_hyperdrive::IHyperdriveEvents::OpenShortFilter(event) => {
                let short_key =
                    write_open_short(client.clone(), events.clone(), event, meta.clone()).await;
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
                let _ = write_initialize(client.clone(), events.clone(), event, meta.clone()).await;
            }
            i_hyperdrive::IHyperdriveEvents::AddLiquidityFilter(event) => {
                let _ =
                    write_add_liquidity(client.clone(), events.clone(), event, meta.clone()).await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseLongFilter(event) => {
                let _ = write_close_long(client.clone(), events.clone(), event, meta.clone()).await;
            }
            i_hyperdrive::IHyperdriveEvents::CloseShortFilter(event) => {
                let _ =
                    write_close_short(client.clone(), events.clone(), event, meta.clone()).await;
            }
            i_hyperdrive::IHyperdriveEvents::RemoveLiquidityFilter(event) => {
                let _ = write_remove_liquidity(client.clone(), events.clone(), event, meta.clone())
                    .await;
            }
            _ => (),
        }

        if meta.block_number >= end_block {
            break;
        }
    }

    Ok(events)
}

// PNLS ///////////////////////////////////////////////////

fn calc_pnls(
    events: Arc<Events>,
    timestamp: U256,
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
                    if debit.timestamp <= timestamp {
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
                    if debit.timestamp <= timestamp {
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
                        if debit.timestamp <= timestamp {
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
                hyperdrive_state.time_remaining_scaled(timestamp, long_key.maturity_time);
            // [XXX] Are we calling this fn correctly? And converting units?
            let calculated_close_shares = hyperdrive_state
                .calculate_close_long(balance.bond_balance, normalized_time_remaining.into());
            let calculated_close_base_amount =
                calculated_close_shares * hyperdrive_state.info.vault_share_price.into();

            debug!(
                "LongsPnL timestamp={} long_key={:?} balance={:?} calculated_close_base_amount={:?}",
                timestamp_to_string(timestamp), long_key, balance, calculated_close_base_amount
            );

            let pos_statement = PositionStatement {
                balance: *balance,
                pnl: I256::try_from(calculated_close_base_amount).unwrap() - balance.base_balance,
            };

            (long_key, pos_statement)
        })
        .collect();

    let shorts_pnls: HashMap<ShortKey, PositionStatement> = events
        .shorts
        .iter()
        .map(|entry| {
            let short_key = *entry.key();

            let balance = shorts_balances.get(&short_key).unwrap();

            let normalized_time_remaining =
                hyperdrive_state.time_remaining_scaled(timestamp, short_key.maturity_time);

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

            let close_checkpoint_time = short_key.maturity_time;
            let close_share_errmsg = &format!(
                "Expected short close checkpoint SharePrice to be recorded but did not: {:?} {:#?}",
                open_checkpoint_time, events.share_prices
            );
            let close_share_price = events
                .share_prices
                .get(&close_checkpoint_time)
                .expect(close_share_errmsg)
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

            let pos_statement = PositionStatement {
                balance: *balance,
                pnl: I256::try_from(calculated_close_base_amount).unwrap() - balance.base_balance,
            };

            (short_key, pos_statement)
        })
        .collect();

    let lps_pnls: HashMap<LpKey, LpStatement> = events
        .lps
        .iter()
        .map(|entry| {
            let lp_key = *entry.key();

            let balance = lps_balances.get(&lp_key).unwrap();

            let calculated_present_value_shares =
                hyperdrive_state.calculate_present_value(timestamp);
            let lp_shares = calculated_present_value_shares * balance.lp_balance.into()
                / hyperdrive_state.info.share_reserves.into();
            let lp_base_amount = lp_shares * hyperdrive_state.info.vault_share_price.into();

            let lp_statement = LpStatement {
                balance: *balance,
                pnl: I256::try_from(lp_base_amount).unwrap() - balance.base_balance,
            };

            debug!(
                "LpPnL timestamp={} lp_key={:?} lp_statement={:?}",
                timestamp_to_string(timestamp),
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

    for entry in events.longs.iter() {
        let long_key = entry.key();
        let filtered_entries: Vec<_> = entry
            .value()
            .iter()
            .filter(|debit| start_timestamp <= debit.timestamp && debit.timestamp < end_timestamp)
            .collect();
        let agg = users_aggs.entry(long_key.trader).or_default();
        agg.action_count.long = filtered_entries.len();
        agg.volume.long = filtered_entries
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
        let filtered_entries: Vec<_> = entry
            .value()
            .iter()
            .filter(|debit| start_timestamp <= debit.timestamp && debit.timestamp < end_timestamp)
            .collect();
        let agg = users_aggs.entry(short_key.trader).or_default();
        agg.action_count.short = filtered_entries.len();
        agg.volume.short = filtered_entries
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
        agg.action_count.lp = filtered_entries.len();
        agg.volume.lp = filtered_entries
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
        agg.pnl.long = position_stmt_ref.pnl;
        agg.balance.long = position_stmt_ref.balance.base_balance;
    }
    for (short_key_ref, position_stmt_ref) in last_time_data.shorts.iter() {
        let agg = users_aggs.entry(short_key_ref.trader).or_default();
        agg.pnl.short = position_stmt_ref.pnl;
        agg.balance.short = position_stmt_ref.balance.base_balance;
    }
    for (lp_key_ref, position_stmt_ref) in last_time_data.lps.iter() {
        let agg = users_aggs.entry(lp_key_ref.provider).or_default();
        agg.pnl.lp = position_stmt_ref.pnl;
        agg.balance.lp = position_stmt_ref.balance.base_balance;
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

fn combine_users_aggs(aggs_list: Vec<UsersAggs>) -> UsersAggs {
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

                combined_agg.balance.long += agg.balance.long;
                combined_agg.balance.short += agg.balance.short;
                combined_agg.balance.lp += agg.balance.lp;
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
) -> Result<(), Box<dyn std::error::Error>> {
    let mut period_start = start_timestamp;
    let mut period_end = start_timestamp + HOUR;

    let mut writer = Writer::from_path(format!(
        "hourly--start-{}.csv",
        timestamp_to_string(period_start)
    ))?;

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

        let users_aggs = combine_users_aggs(hyperdrives_usersaggs);

        for (address, agg) in users_aggs {
            writer.serialize(CsvRecord {
                week: timestamp_to_string(period_start),
                address,
                action_count_longs: agg.action_count.long,
                action_count_shorts: agg.action_count.short,
                action_count_lps: agg.action_count.lp,
                volume_longs: agg.volume.long.to_string(),
                volume_shorts: agg.volume.short.to_string(),
                volume_lps: agg.volume.lp.to_string(),
                pnl_longs: agg.pnl.long.to_string(),
                pnl_shorts: agg.pnl.short.to_string(),
                pnl_lps: agg.pnl.lp.to_string(),
                balance_longs: agg.balance.long.to_string(),
                balance_shorts: agg.balance.short.to_string(),
                balance_lps: agg.balance.lp.to_string(),
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
    tracing_subscriber::fmt::init();

    // [XXX] Check how many blocks behind can the archive node produce.
    let provider = Provider::<Ws>::connect("ws://localhost:8545")
        .await
        .unwrap();
    let client = Arc::new(provider);

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
    let target_end = start_block_timestamp + 7 * 24 * 60 * 60 + 1;
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

    let mut hyperdrives: Vec<HyperdriveConfig> = Vec::new();

    let hyperdrive_addrs: Vec<H160> = vec![HYPERDRIVE_4626_ADDR];

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

    //let current_timestamp = U256::from(Utc::now().timestamp() as u64);
    dump_hourly_aggregates(
        client.clone(),
        hyperdrives,
        START_BLOCK,
        start_block_timestamp,
        end_block,
        end_block_timestamp,
    )
    .await?;

    Ok(())
}
