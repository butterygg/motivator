use std::env;
use std::fs;
use std::fs::File;
use std::io::Write;
use std::str::FromStr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use clap::{arg, command};
use csv::Writer;
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

async fn launch_acq(conf: &RunConfig) -> Result<()> {
    let running = Arc::new(AtomicBool::new(true));

    let r = running.clone();
    ctrlc::set_handler(move || {
        r.store(false, Ordering::SeqCst);
        println!("CTRL+C received. Aborting…");
    })
    .unwrap();

    let (events, start_block_num) = load_events_data(conf).unwrap();

    tracing::info!(
        conf=?conf,
        "AcquiringHyperdriveEvents"
    );

    let end_block =
        load_hyperdrive_events(conf, events.clone(), running.clone(), &start_block_num).await?;

    tracing::info!(
        conf=?conf,
        end_block=?end_block,
        "SavingHyperdriveEvents"
    );

    let events_db = EventsDb {
        end_block_num: end_block,
        events: events.to_serializable(),
    };
    let json_str = serde_json::to_string_pretty(&events_db)?;
    let mut file = File::create(format!("{}-{}.json", conf.pool_type, conf.address))?;
    file.write_all(json_str.as_bytes())?;

    Ok(())
}

///Launch aggregation with a timeframe from deploy block until last block of recorded events.
async fn launch_agg(preconf: &RunConfig) -> Result<()> {
    let json_str = fs::read_to_string(format!("{}-{}.json", preconf.pool_type, preconf.address))?;
    let events_db: EventsDb = serde_json::from_str(&json_str)?;

    let mut conf = preconf.clone();
    conf.end_block_num = U64::from(events_db.end_block_num);
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

    tracing::info!(writer=?writer, conf=?conf, "WritingAggs");
    dump_hourly_aggregates(&conf, &mut writer, &events_db.events).await?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    dotenv().ok();

    let matches = command!()
        .author("Butter")
        .arg(arg!([action] "acq or agg").required(true))
        .arg(arg!([pool_type] "The type of the pool").required(true))
        .arg(arg!([address] "The Hyperdrive contract address").required(true))
        .arg(arg!([deploy_block] "The contract deployment block number").required(true))
        .get_matches();

    let ws_url = env::var("WS_URL").expect("WS_URL must be set");
    tracing::info!(ws_url=%ws_url, "ProviderUrl");
    let client = Arc::new(Provider::<Ws>::connect(ws_url).await?);

    let action = matches.get_one::<String>("action").unwrap().as_str();
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

    let latest_block = client.get_block(BlockNumber::Latest).await?.unwrap();
    let end_block_num = latest_block.number.unwrap();
    let end_timestamp = latest_block.timestamp;

    let contract = i_hyperdrive::IHyperdrive::new(address, client.clone());
    let pool_config = contract.clone().get_pool_config().call().await?;

    let conf = RunConfig {
        client,
        pool_type,
        address,
        deploy_block_num,
        deploy_timestamp,
        end_block_num,
        end_timestamp,
        contract,
        pool_config,
    };

    match action {
        "acq" => launch_acq(&conf).await,
        "agg" => launch_agg(&conf).await,
        _ => bail!("Invalid action specified"),
    }
}
