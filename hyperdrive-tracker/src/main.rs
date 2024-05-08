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
use tracing::info;

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

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

async fn setup() -> Result<(Arc<Provider<Ws>>, Timeframe), Box<dyn std::error::Error>> {
    let ws_url = env::var("WS_URL").expect("WS_URL must be set");
    info!(ws_url=%ws_url, "ProviderUrl");
    let provider = Provider::<Ws>::connect(ws_url).await?;
    let client = Arc::new(provider);

    let start_block_num = U64::from(
        env::var("START_BLOCK")
            .expect("START_BLOCK must be set")
            .parse::<u64>()?,
    );
    let start_timestamp = client
        .clone()
        .get_block(start_block_num)
        .await?
        .unwrap()
        .timestamp;
    let (end_block_num, end_timestamp) = match env::var("END_BLOCK") {
        Ok(value) => {
            let end_block_num = U64::from(value.parse::<u64>()?);
            let end_timestamp = client
                .clone()
                .get_block(end_block_num)
                .await?
                .unwrap()
                .timestamp;
            (end_block_num, end_timestamp)
        }
        Err(_) => {
            let latest_block = client.get_block(BlockNumber::Latest).await?.unwrap();
            let end_block_num = latest_block.number.unwrap();
            let end_timestamp = latest_block.timestamp;
            (end_block_num, end_timestamp)
        }
    };
    let timeframe = Timeframe {
        start_block_num,
        end_block_num,
        start_timestamp,
        end_timestamp,
    };
    info!(timeframe=?timeframe, "Timeframe");

    Ok((client, timeframe))
}

async fn launch_acq(
    client: Arc<Provider<Ws>>,
    timeframe: &Timeframe,
    hyperdrive: &Hyperdrive,
) -> Result<(), Box<dyn std::error::Error>> {
    let running = Arc::new(AtomicBool::new(true));

    let r = running.clone();
    ctrlc::set_handler(move || {
        r.store(false, Ordering::SeqCst);
        println!("CTRL+C received. Aborting…");
    })
    .unwrap();
    let contract = i_hyperdrive::IHyperdrive::new(hyperdrive.address, client.clone());
    let pool_config = contract.clone().get_pool_config().call().await?;

    let (events, start_block_num) = load_events_data(hyperdrive, timeframe)?;

    info!(
        hyperdrive=?hyperdrive,
        pool_config=?pool_config,
        "AcquiringHyperdriveEvents"
    );

    let end_block = load_hyperdrive_events(
        events.clone(),
        running.clone(),
        client.clone(),
        contract.clone(),
        &pool_config,
        timeframe,
        &start_block_num,
    )
    .await?;

    info!(
        hyperdrive=?hyperdrive,
        pool_config=?pool_config,
        end_block=?end_block,
        "SavingHyperdriveEvents"
    );

    let events_db = EventsDb {
        end_block_num: end_block,
        events: events.to_serializable(),
    };
    let json_str = serde_json::to_string_pretty(&events_db)?;
    let mut file = File::create(format!(
        "{}-{}.json",
        hyperdrive.pool_type, hyperdrive.address
    ))?;
    file.write_all(json_str.as_bytes())?;

    Ok(())
}

async fn launch_agg(
    client: Arc<Provider<Ws>>,
    timeframe: &Timeframe,
    hyperdrive: &Hyperdrive,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut writer = Writer::from_path(AGGREGATES_FILEPATH)?;

    info!(writer=?writer, hyperdrive=?hyperdrive, "Aggregating");

    let contract = i_hyperdrive::IHyperdrive::new(hyperdrive.address, client.clone());
    let pool_config = contract.clone().get_pool_config().call().await?;

    let events_data = fs::read_to_string(format!(
        "{}-{}.json",
        hyperdrive.pool_type, hyperdrive.address
    ))?;
    let sevents: SerializableEvents = serde_json::from_str(&events_data)?;

    let config = HyperdriveConfig {
        hyperdrive: hyperdrive.clone(),
        contract,
        pool_config,
        sevents,
    };

    info!(hyperdrive=?config.hyperdrive, "Dumping");
    dump_hourly_aggregates(&mut writer, client.clone(), &config, timeframe).await?;

    Ok(())
}

// [FIXME] Expect END_BLOCK as argument
// [FIXME] Set the Timeframe start to be the deploy_block
// [FIXME] Merge Timeframe and Hyperdrive in a single RunConfig object.
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    dotenv().ok();

    let matches = command!()
        .author("Butter")
        .arg(arg!([action] "acq or agg").required(true))
        .arg(arg!([pool_type] "The type of the pool").required(true))
        .arg(arg!([address] "The Hyperdrive contract address").required(true))
        .arg(arg!([deploy_block] "The contract deployment block number").required(true))
        .get_matches();

    let (client, timeframe) = setup().await?;

    let action = matches.get_one::<String>("action").unwrap().as_str();
    let pool_type = matches.get_one::<String>("pool_type").unwrap();
    let address = matches.get_one::<String>("address").unwrap().to_string();
    let deploy_block = matches
        .get_one::<String>("deploy_block")
        .unwrap()
        .to_string();

    let hyperdrive = Hyperdrive {
        pool_type: pool_type.clone(),
        address: H160::from_str(&address)?,
        deploy_block: U64::from_str(&deploy_block)?,
    };

    match action {
        "acq" => launch_acq(client, &timeframe, &hyperdrive).await,
        "agg" => launch_agg(client, &timeframe, &hyperdrive).await,
        _ => Err("Invalid action specified".into()),
    }
}
