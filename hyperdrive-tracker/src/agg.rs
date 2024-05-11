use std::collections::HashMap;
use std::fs;
use std::ops::AddAssign;

use chrono::{DateTime, Duration};
use csv::Writer;
use dashmap::DashMap;
use ethers::{
    providers::Middleware,
    types::{H160, I256, U256, U64},
};
use eyre::Result;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

use crate::globals::*;
use crate::types::*;
use crate::utils::*;

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

type PositionStatements = HashMap<PositionKey, PositionStatement>;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct LpStatement {
    cumulative_debit: LpCumulativeDebit,
    pnl: Decimal,
}

type LpStatements = HashMap<LpKey, LpStatement>;

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct CumulativeDebits {
    long: I256,
    short: I256,
    lp: I256,
}

impl AddAssign for CumulativeDebits {
    fn add_assign(&mut self, other: Self) {
        self.long += other.long;
        self.short += other.short;
        self.lp += other.lp;
    }
}

///Still scaled to the e18. Comparable to base_amounts.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct PnL {
    long: Decimal,
    short: Decimal,
    lp: Decimal,
}

impl AddAssign for PnL {
    fn add_assign(&mut self, other: Self) {
        self.long += other.long;
        self.short += other.short;
        self.lp += other.lp;
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct ActionCount {
    long: usize,
    short: usize,
    lp: usize,
}

impl AddAssign for ActionCount {
    fn add_assign(&mut self, other: Self) {
        self.long += other.long;
        self.short += other.short;
        self.lp += other.lp;
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct Volume {
    long: I256,
    short: I256,
    lp: I256,
}

impl AddAssign for Volume {
    fn add_assign(&mut self, other: Self) {
        self.long += other.long;
        self.short += other.short;
        self.lp += other.lp;
    }
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
    timestamp: String,
    block_number: u64,
    pool_type: String,
    user_address: H160,
    action_count_longs: usize,
    action_count_shorts: usize,
    action_count_lps: usize,
    volume_longs: String,
    volume_shorts: String,
    volume_lps: String,
    pnl_longs: String,
    pnl_shorts: String,
    pnl_lps: String,
    tvl_longs: String,
    tvl_shorts: String,
    tvl_lps: String,
}

///Calculates balances at timestamp and position PnLs as if closed at time of maturity.
fn calc_pnls(
    sevents: &SerializableEvents,
    hyperdrive_state: hyperdrive_math::State,
    at_timestamp: U256,
) -> (
    HashMap<PositionKey, PositionStatement>,
    HashMap<PositionKey, PositionStatement>,
    HashMap<LpKey, LpStatement>,
) {
    // [PERF] We could build these cumulatively in Debit objects.
    let longs_cumul_debits: HashMap<PositionKey, PositionCumulativeDebit> = sevents
        .longs
        .iter()
        .map(|(key, long)| {
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
            (*key, cumul_debits_2)
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

    let shorts_cumul_debits: HashMap<PositionKey, PositionCumulativeDebit> = sevents
        .shorts
        .iter()
        .map(|(key, short)| {
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
            (*key, cumul_debits_2)
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

    let lps_cumul_debits: HashMap<LpKey, LpCumulativeDebit> = sevents
        .lps
        .iter()
        .map(|(key, lp)| {
            let cumul_debits_2 =
                lp.iter()
                    .fold((I256::zero(), I256::zero()), |(acc_base, acc_lp), debit| {
                        if debit.timestamp <= at_timestamp {
                            (acc_base + debit.base_amount, acc_lp + debit.lp_amount)
                        } else {
                            (acc_base, acc_lp)
                        }
                    });
            (*key, cumul_debits_2)
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

    let longs_pnls: HashMap<PositionKey, PositionStatement> = sevents
        .longs
        .keys()
        .map(|long_key| {
            let cumulative_debit = longs_cumul_debits.get(long_key).unwrap();

            tracing::debug!(long_key=?long_key, cumulative_debit=?cumulative_debit, 

                hyperdrive_state=?hyperdrive_state,
                "CalculatingLongsPnL");

            let calculated_close_base_amount = if cumulative_debit.bond_amount != U256::zero() {
                let calculated_close_shares = hyperdrive_state.calculate_close_long(
                    cumulative_debit.bond_amount,
                    long_key.maturity_time,
                    long_key.maturity_time,
                );
                // Knowing `calculate_close_long` returns vault share amounts:
                calculated_close_shares.normalized()
                    * hyperdrive_state.info.vault_share_price.normalized()
            } else {
                U256::zero().normalized()
            };

            let cumulative_base_debit = cumulative_debit.base_amount.normalized();

            let pos_statement = PositionStatement {
                cumulative_debit: *cumulative_debit,
                pnl: calculated_close_base_amount - cumulative_base_debit,
            };

            (*long_key, pos_statement)
        })
        .collect();

    let shorts_pnls: HashMap<PositionKey, PositionStatement> = sevents
        .shorts
        .keys()
        .map(|short_key| {
            let cumulative_debit = shorts_cumul_debits.get(short_key).unwrap();

            let open_checkpoint_time =
                short_key.maturity_time - hyperdrive_state.config.position_duration;
            let open_share_errmsg = &format!(
                "Expected short open checkpoint SharePrice to be recorded but did not: \
                short_key={:?} position_duration={:?} open_checkpoint_time={:?} \
                share_prices={:#?}",
                short_key,
                hyperdrive_state.config.position_duration,
                open_checkpoint_time,
                sevents.share_prices
            );
            let open_share_price = sevents
                .share_prices
                .get(&open_checkpoint_time)
                .expect(open_share_errmsg)
                .price;

            let maturity_checkpoint_time = short_key.maturity_time;
            // Whether maturity is within timeframe or not, it should be available in SharePrices.
            let maturity_share_errmsg = &format!(
                "Expected short maturity checkpoint SharePrice to be recorded but did not: \
                short_key={:?} position_duration={:?} maturity_checkpoint_time={:?} \
                share_prices={:#?}",
                short_key,
                hyperdrive_state.config.position_duration,
                maturity_checkpoint_time,
                sevents.share_prices
            );
            let maturity_or_current_share_price = sevents
                .share_prices
                .get(&maturity_checkpoint_time)
                .expect(maturity_share_errmsg)
                .price;

            tracing::debug!(
                short_key=?short_key,
                cumulative_debit=?cumulative_debit,
                open_share_price=?open_share_price,
                maturity_or_current_share_price=?maturity_or_current_share_price,
                hyperdrive_state=?hyperdrive_state,
                "CalculatingShortPnL"
            );

            let calculated_maturity_base_amount = if cumulative_debit.bond_amount != U256::zero() {
                // [XXX] Are we calling this fn correctly?
                let calculated_maturity_shares = hyperdrive_state.calculate_close_short(
                    cumulative_debit.bond_amount,
                    open_share_price,
                    maturity_or_current_share_price,
                    // This argument is maturity time, wheter already happened or not:
                    short_key.maturity_time,
                    short_key.maturity_time,
                );
                calculated_maturity_shares.normalized()
                    * hyperdrive_state.info.vault_share_price.normalized()
            } else {
                U256::zero().normalized()
            };

            let cumulative_base_debit = cumulative_debit.base_amount.normalized();

            let pos_statement = PositionStatement {
                cumulative_debit: *cumulative_debit,
                pnl: calculated_maturity_base_amount - cumulative_base_debit,
            };

            (*short_key, pos_statement)
        })
        .collect();

    let lps_pnls: HashMap<LpKey, LpStatement> = sevents
        .lps
        .keys()
        .map(|lp_key| {
            let cumulative_debit = lps_cumul_debits.get(lp_key).unwrap();

            tracing::debug!(
                lp_key=?lp_key,
                cumulative_debit=?cumulative_debit,
                hyperdrive_state=?hyperdrive_state,
                "CalculatingLpPnL"
            );

            let lp_base_amount = cumulative_debit.lp_amount.normalized()
                * hyperdrive_state.info.lp_share_price.normalized();
            let cumulative_base_debit = cumulative_debit.base_amount.normalized();

            let lp_statement = LpStatement {
                cumulative_debit: *cumulative_debit,
                pnl: lp_base_amount - cumulative_base_debit,
            };

            (*lp_key, lp_statement)
        })
        .collect();

    (longs_pnls, shorts_pnls, lps_pnls)
}

fn aggregate_per_user_over_period(
    sevents: &SerializableEvents,
    long_statements: PositionStatements,
    short_statements: PositionStatements,
    lp_statements: LpStatements,
    start_timestamp: U256,
    end_timestamp: U256,
) -> UsersAggs {
    let mut users_aggs: UsersAggs = HashMap::new();

    tracing::info!(
        start_timestamp_str = timestamp_to_string(start_timestamp),
        start_timestamp = %start_timestamp,
        end_timestamp_str = timestamp_to_string(end_timestamp),
        end_timestamp = %end_timestamp,
        "Agg"
    );

    for (long_key, long) in sevents.longs.iter() {
        let filtered_entries: Vec<_> = long
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
        tracing::debug!(
           long_key=?long_key,
           long=?long,
           action_count_long=%agg.action_count.long,
           volume_long=%agg.volume.long,
           "LongEventInAgg"
        );
    }
    for (short_key, short) in sevents.shorts.iter() {
        let filtered_entries: Vec<_> = short
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
    for (lp_key, lp) in sevents.lps.iter() {
        let filtered_entries: Vec<_> = lp
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

    for (long_key_ref, position_stmt_ref) in long_statements.iter() {
        let agg = users_aggs.entry(long_key_ref.trader).or_default();
        agg.pnl.long += position_stmt_ref.pnl;
        agg.base_cumulative_debit.long += position_stmt_ref.cumulative_debit.base_amount;
    }
    for (short_key_ref, position_stmt_ref) in short_statements.iter() {
        let agg = users_aggs.entry(short_key_ref.trader).or_default();
        agg.pnl.short += position_stmt_ref.pnl;
        agg.base_cumulative_debit.short += position_stmt_ref.cumulative_debit.base_amount;
    }
    for (lp_key_ref, position_stmt_ref) in lp_statements.iter() {
        let agg = users_aggs.entry(lp_key_ref.provider).or_default();
        agg.pnl.lp += position_stmt_ref.pnl;
        agg.base_cumulative_debit.lp += position_stmt_ref.cumulative_debit.base_amount;
    }

    users_aggs
}

async fn calc_period_aggs(
    tconf: &SingleTrackerConfig,
    sevents: &SerializableEvents,
    period_start: U256,
    period_end_block_num: U64,
    period_end: U256,
) -> Result<UsersAggs> {
    let pool_info = tconf
        .contract
        .get_pool_info()
        .block(period_end_block_num)
        .call()
        .await?;
    let hyperdrive_state = hyperdrive_math::State::new(tconf.pool_config.clone(), pool_info);
    tracing::info!(
        period_start=?period_start,
        period_end=?period_end,
        period_end_block_num=?period_end_block_num,
        hyperdrive_state=?hyperdrive_state,
        "CalculatingPeriodPnLs"
    );
    let (longs_stmts, shorts_stmts, lps_stmts) = calc_pnls(sevents, hyperdrive_state, period_end);

    Ok(aggregate_per_user_over_period(
        sevents,
        longs_stmts,
        shorts_stmts,
        lps_stmts,
        period_start,
        period_end,
    ))
}

///Write aggregates, one per midnight.
async fn get_hyperdrive_aggs(
    rconf: &RunConfig,
    tconf: &SingleTrackerConfig,
    sevents: &SerializableEvents,
    period_start: U256,
    period_end: U256,
) -> Result<UsersAggs> {
    // The PnL part doesn't need to know about `period_start` as PnLs and balances are
    // statements that we calculate at `period_end`.
    let period_end_block_num = find_block_by_timestamp(
        rconf.client.clone(),
        period_end.as_u64(),
        tconf.hconf.deploy_block_num,
        rconf.end_block_num,
    )
    .await
    .unwrap();

    let users_aggs = calc_period_aggs(
        tconf,
        sevents,
        period_start,
        period_end_block_num,
        period_end,
    )
    .await?;

    Ok(users_aggs)
}

fn group_users_aggs_by_address(usersaggs_list: &[UsersAggs]) -> UsersAggs {
    usersaggs_list
        .iter()
        .fold(UsersAggs::new(), |mut acc, usersaggs| {
            for (address, user_agg) in usersaggs {
                let entry = acc.entry(*address).or_default();
                entry.action_count += user_agg.action_count.clone();
                entry.volume += user_agg.volume.clone();
                entry.pnl += user_agg.pnl.clone();
                entry.base_cumulative_debit += user_agg.base_cumulative_debit.clone();
            }
            acc
        })
}

// [FIXME] Use read_eventsdb
///Launch aggregation with a timeframe from deploy block until last block of recorded events.
pub async fn launch_agg(rconf: &RunConfig) -> Result<()> {
    let mut writer = Writer::from_path("rows.csv")?;

    let mut period_start = rconf
        .client
        .get_block(rconf.start_block_num)
        .await?
        .unwrap()
        .timestamp;
    let mut period_start_datetime =
        DateTime::from_timestamp(period_start.as_u64() as i64, 0).unwrap();
    let mut period_end_datetime = (period_start_datetime.date_naive() + Duration::days(1))
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();
    let mut period_end = U256::from(period_end_datetime.timestamp());

    let end_timestamp = rconf
        .client
        .get_block(rconf.end_block_num)
        .await?
        .unwrap()
        .timestamp;

    tracing::debug!(
        period_start=?period_start,
        period_end=?period_end,
        end_timestamp=?end_timestamp,
        "AggFirstPeriod"
    );

    while period_end <= end_timestamp {
        let period_end_block_num = find_block_by_timestamp(
            rconf.client.clone(),
            period_end.as_u64(),
            rconf.start_block_num,
            rconf.end_block_num,
        )
        .await?;
        let usersaggs_list_per_pooltype: DashMap<&str, Vec<UsersAggs>> = DashMap::new();

        for hconf in HYPERDRIVES.values() {
            let json_str =
                fs::read_to_string(format!("{}-{}.json", hconf.pool_type, hconf.address))?;
            let events_db: EventsDb = serde_json::from_str(&json_str)?;

            let contract = i_hyperdrive::IHyperdrive::new(hconf.address, rconf.client.clone());
            let pool_config = contract.clone().get_pool_config().call().await?;
            let tconf = SingleTrackerConfig {
                hconf,
                contract,
                pool_config,
            };

            let users_aggs =
                get_hyperdrive_aggs(rconf, &tconf, &events_db.events, period_start, period_end)
                    .await?;

            usersaggs_list_per_pooltype
                .entry(hconf.pool_type)
                .and_modify(|existing| existing.push(users_aggs.clone()))
                .or_insert_with(|| vec![users_aggs.clone()]);
        }

        let pooltype_usersaggs: HashMap<&str, UsersAggs> = usersaggs_list_per_pooltype
            .iter()
            .map(|entry| (*entry.key(), group_users_aggs_by_address(entry.value())))
            .collect::<HashMap<&str, UsersAggs>>();

        for (pool_type, users_aggs) in pooltype_usersaggs.iter() {
            for (user_address, agg) in users_aggs {
                writer.serialize(CsvRecord {
                    timestamp: timestamp_to_date_string(period_end),
                    block_number: period_end_block_num.as_u64(),
                    pool_type: pool_type.to_string(),
                    user_address: *user_address,
                    action_count_longs: agg.action_count.long,
                    action_count_shorts: agg.action_count.short,
                    action_count_lps: agg.action_count.lp,
                    volume_longs: agg.volume.long.normalized().compact_ser(),
                    volume_shorts: agg.volume.short.normalized().compact_ser(),
                    volume_lps: agg.volume.lp.normalized().compact_ser(),
                    pnl_longs: agg.pnl.long.compact_ser(),
                    pnl_shorts: agg.pnl.short.compact_ser(),
                    pnl_lps: agg.pnl.lp.compact_ser(),
                    tvl_longs: agg.base_cumulative_debit.long.normalized().compact_ser(),
                    tvl_shorts: agg.base_cumulative_debit.short.normalized().compact_ser(),
                    tvl_lps: agg.base_cumulative_debit.lp.normalized().compact_ser(),
                })?
            }
        }

        tracing::debug!(
            period_start = timestamp_to_string(period_start),
            period_end = timestamp_to_string(period_end),
            "WritingnAggs"
        );

        writer.flush()?;

        period_start_datetime += Duration::days(1);
        period_start = U256::from(period_start_datetime.timestamp());
        period_end_datetime += Duration::days(1);
        period_end = U256::from(period_end_datetime.timestamp());
    }

    Ok(())
}
