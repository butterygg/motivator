use std::env;
use std::fs;
use std::fs::File;
use std::io::Write;
use std::str::FromStr;
use std::sync::Arc;

use chrono::NaiveDate;
use clap::{arg, command, Command};
use csv::Writer;
use dashmap::DashMap;
use dotenv::dotenv;
use ethers::{
    providers::{Middleware, Provider, Ws},
    types::{BlockNumber, H160, U64},
};
use eyre::{bail, Result};

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

use crate::acq::*;
use crate::agg::*;
use crate::types::*;
use crate::utils::*;

mod acq;
mod agg;
mod globals;
mod types;
mod utils;

fn read_eventsdb(conf: &RunConfig) -> Result<(Arc<Events>, U64)> {
    match fs::read_to_string(format!("{}-{}.json", conf.pool_type, conf.address)) {
        Ok(events_data) => {
            let events_db: EventsDb = serde_json::from_str(&events_data)?;

            tracing::info!(
                end_block_num=?events_db.end_block_num,
                "LoadingPreviousEvents"
            );

            let events = Arc::new(Events::from_serializable(events_db.events));
            let start_block_num = events_db.end_block_num.into();
            Ok((events, start_block_num))
        }
        Err(_) => {
            tracing::info!("FreshEvents");

            let events = Arc::new(Events {
                longs: DashMap::new(),
                shorts: DashMap::new(),
                lps: DashMap::new(),
                share_prices: DashMap::new(),
            });
            let start_block_num = conf.deploy_block_num;
            Ok((events, start_block_num))
        }
    }
}

async fn launch_acq(conf: &RunConfig) -> Result<()> {
    let mut page_end_block_num: U64;
    let mut page_start_block_num: U64;
    let events: Arc<Events>;

    (events, page_start_block_num) = read_eventsdb(conf)?;
    page_end_block_num = page_start_block_num + conf.page_size;

    while page_end_block_num <= conf.end_block_num {
        page_end_block_num = U64::min(page_end_block_num, conf.end_block_num.as_u64().into());

        tracing::info!(
            page_start_block_num=?page_start_block_num,
            page_end_block_num=?page_end_block_num,
            "LoadingHyperdriveEvents"
        );

        load_events_paginated(
            conf,
            events.clone(),
            page_start_block_num,
            page_end_block_num,
        )
        .await?;

        tracing::info!(
            end_block_num=?page_end_block_num,
            "SavingHyperdriveEvents"
        );

        let events_db = EventsDb {
            end_block_num: page_end_block_num.as_u64(),
            events: events.to_serializable(),
        };
        let json_str = serde_json::to_string_pretty(&events_db)?;
        let mut file = File::create(format!("{}-{}.json", conf.pool_type, conf.address))?;
        file.write_all(json_str.as_bytes())?;

        page_start_block_num += conf.page_size;
        page_end_block_num += conf.page_size;
    }

    Ok(())
}

///Launch aggregation with a timeframe from deploy block until last block of recorded events.
async fn launch_agg(preconf: &RunConfig) -> Result<()> {
    let json_str = fs::read_to_string(format!("{}-{}.json", preconf.pool_type, preconf.address))?;
    let events_db: EventsDb = serde_json::from_str(&json_str)?;

    let mut conf = preconf.clone();
    conf.end_block_num = events_db.end_block_num.into();
    conf.end_timestamp = conf
        .client
        .clone()
        .get_block(conf.end_block_num)
        .await?
        .unwrap()
        .timestamp;

    let mut writer = Writer::from_path(format!(
        "{}-{}-{}.csv",
        conf.pool_type, conf.address, conf.end_block_num
    ))?;

    tracing::info!(writer=?writer, "WritingAggs");
    write_aggregates(&conf, &mut writer, &events_db.events).await?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    dotenv().ok();

    let ws_url = env::var("WS_URL").expect("WS_URL must be set");
    tracing::info!(ws_url=%ws_url, "ProviderUrl");
    let client = Arc::new(Provider::<Ws>::connect(ws_url).await?);

    let latest_block = client.get_block(BlockNumber::Latest).await?.unwrap();
    let latest_block_num = latest_block.number.unwrap();
    let latest_block_timestamp = latest_block.timestamp;

    let matches = command!()
        .author("Butter")
        .arg(arg!([pool_type] "The type of the pool").required(true))
        .arg(arg!([address] "The Hyperdrive contract address").required(true))
        .arg(arg!([deploy_block] "The contract deployment block number").required(true))
        .subcommand(Command::new("acq").arg(arg!(-p --page_size <PAGE_SIZE> "Query page size")))
        .subcommand(
            Command::new("agg")
                .arg(arg!(-e --end_date <END_DATE> "Custom end date like `%YYYY-%mm-%dd`")),
        )
        .get_matches();

    let pool_type = matches.get_one::<String>("pool_type").unwrap().clone();
    let address = matches.get_one::<String>("address").unwrap().to_string();
    let address = H160::from_str(&address)?;
    let deploy_block_num = matches
        .get_one::<String>("deploy_block")
        .unwrap()
        .to_string();
    let deploy_block_num = deploy_block_num.parse::<u64>()?;
    let deploy_block_num = U64::from(deploy_block_num);

    tracing::debug!(address=?address, deploy_block_num=?deploy_block_num, "DEPLOY");

    let deploy_timestamp = client
        .clone()
        .get_block(deploy_block_num)
        .await?
        .unwrap()
        .timestamp;

    let contract = i_hyperdrive::IHyperdrive::new(address, client.clone());
    let pool_config = contract.clone().get_pool_config().call().await?;

    let mut conf = RunConfig {
        client: client.clone(),
        pool_type,
        address,
        deploy_block_num,
        deploy_timestamp,
        end_block_num: latest_block_num,
        end_timestamp: latest_block_timestamp,
        contract,
        pool_config,
        page_size: globals::QUERY_PAGE_SIZE.into(),
    };

    match matches.subcommand() {
        Some(("acq", sub_matches)) => {
            if let Some(ps_str) = sub_matches.get_one::<String>("page_size") {
                let page_size: u64 = ps_str.parse()?;
                conf.page_size = page_size.into();
            }

            tracing::info!(conf=?conf, "LaunchingAcq");

            launch_acq(&conf).await
        }
        Some(("agg", sub_matches)) => {
            if let Some(ed_str) = sub_matches.get_one::<String>("end_date") {
                let datetime = NaiveDate::parse_from_str(ed_str, "%Y-%m-%d")?
                    .and_hms_opt(0, 0, 0)
                    .unwrap()
                    .and_utc();
                let timestamp: u64 = datetime.timestamp().try_into().unwrap();
                let block_num = find_block_by_timestamp(
                    client.clone(),
                    timestamp,
                    deploy_block_num,
                    latest_block_num,
                )
                .await?;
                conf.end_block_num = block_num;
                conf.end_timestamp = timestamp.into();
            }

            tracing::info!(conf=?conf, "LaunchingAgg");

            launch_agg(&conf).await
        }
        _ => bail!("Invalid subcommand"),
    }
}
