use std::collections::HashMap;
use std::fs::File;

use csv::Writer;
use ethers::types::{H160, I256, U256, U64};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use tracing::{debug, info};
use uuid::Uuid;

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

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
struct LpStatement {
    cumulative_debit: LpCumulativeDebit,
    pnl: Decimal,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct TimeData {
    timestamp: U256,
    longs: HashMap<PositionKey, PositionStatement>,
    shorts: HashMap<PositionKey, PositionStatement>,
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

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
struct UserAgg {
    action_count: ActionCount,
    volume: Volume,
    pnl: PnL,
    base_cumulative_debit: CumulativeDebits,
}

type UsersAggs = HashMap<H160, UserAgg>;

// [TODO] Adjusted PnLs
#[derive(Serialize)]
struct CsvRecord {
    id: Uuid,
    timestamp: String,
    block_number: u64,
    pool_type: String,
    user_address: H160,
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

            let calculated_close_base_amount = if cumulative_debit.bond_amount != U256::zero() {
                // [XXX] Are we calling this fn correctly?
                let calculated_close_shares = hyperdrive_state.calculate_close_long(
                    cumulative_debit.bond_amount,
                    long_key.maturity_time,
                    at_timestamp,
                );
                // Knowing `calculate_close_long` returns vault share amounts:
                calculated_close_shares.normalized()
                    * hyperdrive_state.info.vault_share_price.normalized()
            } else {
                U256::zero().normalized()
            };

            let cumulative_base_debit = cumulative_debit.base_amount.normalized();

            debug!(
                timestamp=timestamp_to_string(at_timestamp),
                long_key=?long_key,
                cumulative_debit=?cumulative_debit,
                calculated_close_base_amount=?calculated_close_base_amount,
                "LongsPnL"
            );

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

            let calculated_maturity_base_amount = if cumulative_debit.bond_amount != U256::zero() {
                // [XXX] Are we calling this fn correctly?
                let calculated_maturity_shares = hyperdrive_state.calculate_close_short(
                    cumulative_debit.bond_amount,
                    open_share_price,
                    maturity_or_current_share_price,
                    // This argument is maturity time, wheter already happened or not:
                    short_key.maturity_time,
                    at_timestamp,
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

            debug!(
                timestamp=timestamp_to_string(at_timestamp),
                short_key=?short_key,
                pos_statement=?pos_statement,
                calc_matu_base=?calculated_maturity_base_amount,
                h_state=?hyperdrive_state,
                "ShortPnL"
            );

            (*short_key, pos_statement)
        })
        .collect();

    let lps_pnls: HashMap<LpKey, LpStatement> = sevents
        .lps
        .keys()
        .map(|lp_key| {
            let cumulative_debit = lps_cumul_debits.get(lp_key).unwrap();

            let lp_base_amount = cumulative_debit.lp_amount.normalized()
                * hyperdrive_state.info.lp_share_price.normalized();
            let cumulative_base_debit = cumulative_debit.base_amount.normalized();

            let lp_statement = LpStatement {
                cumulative_debit: *cumulative_debit,
                pnl: lp_base_amount - cumulative_base_debit,
            };

            debug!(
                timestamp=timestamp_to_string(at_timestamp),
                lp_key=?lp_key,
                lp_statement=?lp_statement,
                "LpPnL"
            );

            (*lp_key, lp_statement)
        })
        .collect();

    (longs_pnls, shorts_pnls, lps_pnls)
}

fn aggregate_per_user_over_period(
    sevents: &SerializableEvents,
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
        debug!(
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

async fn calc_period_aggs(
    conf: &RunConfig,
    sevents: &SerializableEvents,
    period_start: U256,
    period_end_block_num: U64,
    period_end: U256,
) -> Result<UsersAggs, Box<dyn std::error::Error>> {
    let pool_info = conf
        .contract
        .get_pool_info()
        .block(period_end_block_num)
        .call()
        .await?;
    let hyperdrive_state = hyperdrive_math::State::new(conf.pool_config.clone(), pool_info);
    info!(
        period_start=?period_start,
        period_end=?period_end,
        period_end_block_num=?period_end_block_num,
        hyperdrive_state=?hyperdrive_state,
        "CalculatingPeriodPnLs"
    );
    let (longs_stmts, shorts_stmts, lps_stmts) = calc_pnls(&sevents, hyperdrive_state, period_end);
    let end_time_data = TimeData {
        timestamp: period_end,
        longs: longs_stmts,
        shorts: shorts_stmts,
        lps: lps_stmts,
    };

    Ok(aggregate_per_user_over_period(
        &sevents,
        end_time_data,
        period_start,
        period_end,
    ))
}

pub async fn dump_hourly_aggregates(
    conf: &RunConfig,
    writer: &mut Writer<File>,
    sevents: &SerializableEvents,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut period_start = conf.deploy_timestamp;
    let mut period_end = period_start + HOUR;

    debug!(
        period_start=?period_start,
        period_end=?period_end,
        end_timestamp=?conf.end_timestamp,
        "DumpingHourlyAggFirstPeriod"
    );

    while period_end <= conf.end_timestamp {
        // The PnL part doesn't need to know about `period_start` as PnLs and balances are
        // statements that we calculate at `period_end`.
        let period_end_block_num = find_block_by_timestamp(
            conf.client.clone(),
            period_end.as_u64(),
            conf.deploy_block_num,
            conf.end_block_num,
        )
        .await?;

        let users_aggs = calc_period_aggs(
            conf,
            sevents,
            period_start,
            period_end_block_num,
            period_end,
        )
        .await?;

        for (user_address, agg) in users_aggs {
            writer.serialize(CsvRecord {
                id: Uuid::new_v4(),
                timestamp: timestamp_to_string(period_end),
                block_number: period_end_block_num.as_u64(),
                pool_type: conf.pool_type.clone(),
                user_address,
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

        writer.flush()?;
    }

    Ok(())
}
