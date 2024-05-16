use std::env;
//use std::str::FromStr;
use std::sync::Arc;

use chrono::NaiveDate;
use clap::{arg, command, Command};
use dotenv::dotenv;
use ethers::{
    providers::{Middleware, Provider, Ws},
    types::BlockNumber,
};
use eyre::{bail, Result};

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

#[macro_use]
extern crate lazy_static;
use crate::acq::*;
use crate::agg::*;
use crate::globals::*;
use crate::types::*;
use crate::utils::*;

mod acq;
mod agg;
mod globals;
mod types;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    dotenv().ok();

    let ws_url = env::var("WS_URL").expect("WS_URL must be set");
    tracing::info!(ws_url=%ws_url, "ProviderUrl");
    let client = Arc::new(Provider::<Ws>::connect(ws_url).await?);

    let latest_block = client.get_block(BlockNumber::Latest).await?.unwrap();
    let latest_block_num = latest_block.number.unwrap();

    let matches = command!()
        .author("Butter")
        .subcommand(
            Command::new("acq")
                .arg(arg!([hyperdrive_id] "The 0x1234 of the Hyperdrive instance").required(true))
                .arg(arg!(-p --page_size <PAGE_SIZE> "Query page size")),
        )
        .subcommand(
            Command::new("agg")
                .arg(arg!(-e --end_date <END_DATE> "Custom end date like `%YYYY-%mm-%dd`")),
        )
        .get_matches();

    match matches.subcommand() {
        Some(("acq", sub_matches)) => {
            let hyperdrive_id = sub_matches
                .get_one::<String>("hyperdrive_id")
                .unwrap()
                .to_string();
            let hconf = HYPERDRIVES
                .get(hyperdrive_id.as_str())
                .expect("Hyperdrive ID unavailable");

            let contract = i_hyperdrive::IHyperdrive::new(hconf.address, client.clone());
            let pool_config = contract.clone().get_pool_config().call().await?;

            let tconf = SingleTrackerConfig {
                hconf,
                contract,
                pool_config,
            };
            let mut rconf = RunConfig {
                client: client.clone(),
                page_size: QUERY_PAGE_SIZE.into(),
                start_block_num: hconf.deploy_block_num,
                end_block_num: latest_block_num,
            };

            if let Some(ps_str) = sub_matches.get_one::<String>("page_size") {
                let page_size: u64 = ps_str.parse()?;
                rconf.page_size = page_size.into();
            }

            tracing::info!(tconf=?tconf, rconf=?rconf, "LaunchingAcq");

            launch_acq(&rconf, &tconf).await
        }
        Some(("agg", sub_matches)) => {
            let earliest_deploy_block_num = HYPERDRIVES
                .values()
                .min_by_key(|h| h.deploy_block_num)
                .unwrap()
                .deploy_block_num;
            let mut rconf = RunConfig {
                client: client.clone(),
                page_size: QUERY_PAGE_SIZE.into(),
                start_block_num: earliest_deploy_block_num,
                end_block_num: latest_block_num,
            };

            if let Some(ed_str) = sub_matches.get_one::<String>("end_date") {
                let datetime = NaiveDate::parse_from_str(ed_str, "%Y-%m-%d")?
                    .and_hms_opt(0, 0, 0)
                    .unwrap()
                    .and_utc();
                let timestamp: u64 = datetime.timestamp().try_into().unwrap();
                let block_num = find_block_by_timestamp(
                    client.clone(),
                    timestamp,
                    earliest_deploy_block_num,
                    latest_block_num,
                )
                .await?;
                rconf.end_block_num = block_num;
            }

            tracing::info!(rconf=?rconf, "LaunchingAgg");

            launch_agg(&rconf).await
        }
        _ => bail!("Invalid subcommand"),
    }
}
