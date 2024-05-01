use std::env;
use std::fs;
use std::fs::File;
use std::io::Write;
use std::sync::Arc;

use clap::{arg, command, Command};
use csv::Writer;
use dotenv::dotenv;
use ethers::{
    providers::{Middleware, Provider, Ws},
    types::{BlockNumber, U64},
};
use tracing::info;

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
    hyperdrives: &Vec<Hyperdrive>,
) -> Result<(), Box<dyn std::error::Error>> {
    for hyperdrive in hyperdrives {
        let contract = i_hyperdrive::IHyperdrive::new(hyperdrive.address, client.clone());
        let pool_config = contract.clone().get_pool_config().call().await?;

        info!(
            hyperdrive=?hyperdrive,
            pool_config=?pool_config,
            "AcquiringHyperdriveEvents"
        );

        let events =
            load_hyperdrive_events(client.clone(), contract.clone(), &pool_config, timeframe)
                .await?;

        info!(
            hyperdrive=?hyperdrive,
            pool_config=?pool_config,
            "DumpingHyperdriveEvents"
        );

        let ser_events = events.to_serializable();
        info!(
            ser_events=?ser_events
            , "TEST"
        );
        let json_str = serde_json::to_string_pretty(&ser_events)?;
        let mut file = File::create(format!("{}.json", hyperdrive.name))?;
        file.write_all(json_str.as_bytes())?;
    }

    Ok(())
}

async fn launch_agg(
    client: Arc<Provider<Ws>>,
    timeframe: &Timeframe,
    hyperdrives: &Vec<Hyperdrive>,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut hyperdrive_configs: Vec<HyperdriveConfig> = Vec::new();

    for hyperdrive in hyperdrives {
        let contract = i_hyperdrive::IHyperdrive::new(hyperdrive.address, client.clone());
        let pool_config = contract.clone().get_pool_config().call().await?;

        let data = fs::read_to_string(format!("{}.json", hyperdrive.name))?;
        let ser_events: SerializableEvents = serde_json::from_str(&data)?;

        hyperdrive_configs.push(HyperdriveConfig {
            hyperdrive: *hyperdrive,
            contract,
            pool_config,
            ser_events,
        });
    }

    let mut writer = Writer::from_path(AGGREGATES_FILEPATH)?;
    info!(writer=?writer, "Aggregating");

    for hyperdrive_config in hyperdrive_configs {
        info!(hyperdrive=?hyperdrive_config.hyperdrive, "Dumping");
        dump_hourly_aggregates(&mut writer, client.clone(), &hyperdrive_config, timeframe).await?;
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    dotenv().ok();

    let matches = command!()
        .arg(arg!([name] "Hyperdrive Tracker"))
        .author("Butter")
        .subcommand(Command::new("acq").about("acquires events and share prices"))
        .subcommand(Command::new("agg").about("aggtregates with pnls"))
        .get_matches();

    let (client, timeframe) = setup().await?;

    // [FIXME] Use the 6 testnet hyperdrive addresses.
    let hyperdrives = vec![*HYPERDRIVE_4626, *HYPERDRIVE_STETH];

    if let Some(("acq", _)) = matches.subcommand() {
        launch_acq(client, &timeframe, &hyperdrives).await?;
    } else if let Some(("agg", _)) = matches.subcommand() {
        launch_agg(client, &timeframe, &hyperdrives).await?;
    } else {
        println!("Not a valid subcommand.");
    }

    Ok(())
}
