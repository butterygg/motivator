use std::env;
use std::sync::Arc;

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

mod acq;
mod agg;
mod globals;
mod types;
mod utils;

// MAIN ////////////////////////////////////////////////

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // SETUP STUFF //

    tracing_subscriber::fmt::init();

    dotenv().ok();
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

    let hyperdrives = vec![*HYPERDRIVE_4626, *HYPERDRIVE_STETH];

    // DO STUFF //

    let mut hyperdrive_configs: Vec<HyperdriveConfig> = Vec::new();

    for hyperdrive in hyperdrives {
        let contract = i_hyperdrive::IHyperdrive::new(hyperdrive.address, client.clone());
        let pool_config = contract.clone().get_pool_config().call().await?;

        info!(
            hyperdrive=?hyperdrive,
            pool_config=?pool_config,
            "LoadingHyperdriveEvents"
        );

        let events =
            load_hyperdrive_events(client.clone(), contract.clone(), &pool_config, &timeframe)
                .await?;

        hyperdrive_configs.push(HyperdriveConfig {
            hyperdrive,
            contract,
            pool_config,
            events,
        });
    }

    let mut writer = Writer::from_path(&"hourly.csv")?;
    info!(writer=?writer, "DumpHourlyAggregates");

    for hyperdrive_config in hyperdrive_configs {
        info!(hyperdrive=?hyperdrive_config.hyperdrive, "Dumping");
        dump_hourly_aggregates(&mut writer, client.clone(), &hyperdrive_config, &timeframe).await?;
    }

    Ok(())
}
