use std::error::Error;
use std::fs::File;
use std::sync::{Arc, Mutex};

use csv::Writer;
use ethers::{
    contract::LogMeta,
    providers::{Provider, Ws},
    types::H160,
};
use futures::StreamExt;
use hex_literal::hex;
use serde::Serialize;
use tracing::info;

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

/// Rust tests deployment
// const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("8d4928532f2dd0e2f31f447d7902197e54db2302"));
/// Agent0 artifacts expected deployment
//const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("7aba23eab591909f9dc5770cea764b8aa989dd25"));
/// Agent0 fixture deployment
//const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("6949c3f59634E94B659486648848Cd3f112AD098"));
/// Infra artifacts expected
const HYPERDRIVE_4626_ADDR: H160 = H160(hex!("5a7e8a85db4e5734387bd66d189f32cca918ea4f"));

#[derive(Serialize)]
struct EventRecord {
    block_number: String,
    address: H160,
    type_: String,
    data: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let file = File::create("events.csv")?;
    let writer = Arc::new(Mutex::new(Writer::from_writer(file)));

    let provider = Arc::new(
        Provider::<Ws>::connect("ws://localhost:8545")
            .await
            .unwrap(),
    );

    let hyperdrive_4626 = i_hyperdrive::IHyperdrive::new(HYPERDRIVE_4626_ADDR, provider.clone());

    let hyperdrive_4626_for_open_long = hyperdrive_4626.clone();
    let writer_for_open_long = writer.clone();
    let open_long_task = tokio::spawn(async move {
        let open_long_filter = hyperdrive_4626_for_open_long.open_long_filter();
        let open_long_sub = open_long_filter.stream_with_meta().await.unwrap();
        open_long_sub
            .for_each_concurrent(None, move |item| {
                let writer = writer_for_open_long.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_open_long(writer, event, meta).await {
                                eprintln!("Error writing event to file {:?}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error processing event: {:?}", e);
                        }
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_close_long = hyperdrive_4626.clone();
    let writer_for_close_long = writer.clone();
    let close_long_task = tokio::spawn(async move {
        let close_long_filter = hyperdrive_4626_for_close_long.close_long_filter();
        let close_long_sub = close_long_filter.stream_with_meta().await.unwrap();
        close_long_sub
            .for_each_concurrent(None, move |item| {
                let writer = writer_for_close_long.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_close_long(writer, event, meta).await {
                                eprintln!("Error writing event to file {:?}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error processing event: {:?}", e);
                        }
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_open_short = hyperdrive_4626.clone();
    let writer_for_open_short = writer.clone();
    let open_short_task = tokio::spawn(async move {
        let open_short_filter = hyperdrive_4626_for_open_short.open_short_filter();
        let open_short_sub = open_short_filter.stream_with_meta().await.unwrap();
        open_short_sub
            .for_each_concurrent(None, move |item| {
                let writer = writer_for_open_short.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_open_short(writer, event, meta).await {
                                eprintln!("Error writing event to file: {:?}", e);
                            }
                        }
                        Err(e) => eprintln!("Error processing event: {:?}", e),
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_close_short = hyperdrive_4626.clone();
    let writer_for_close_short = writer.clone();
    let close_short_task = tokio::spawn(async move {
        let close_short_filter = hyperdrive_4626_for_close_short.close_short_filter();
        let close_short_sub = close_short_filter.stream_with_meta().await.unwrap();
        close_short_sub
            .for_each_concurrent(None, move |item| {
                let writer = writer_for_close_short.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_close_short(writer, event, meta).await {
                                eprintln!("Error writing event to file: {:?}", e);
                            }
                        }
                        Err(e) => eprintln!("Error processing event: {:?}", e),
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_add_liquidity = hyperdrive_4626.clone();
    let writer_for_add_liquidity = writer.clone();
    let add_liquidity_task = tokio::spawn(async move {
        let add_liquidity_filter = hyperdrive_4626_for_add_liquidity.add_liquidity_filter();
        let add_liquidity_sub = add_liquidity_filter.stream_with_meta().await.unwrap();
        add_liquidity_sub
            .for_each_concurrent(None, move |item| {
                let writer = writer_for_add_liquidity.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_add_liquidity(writer, event, meta).await {
                                eprintln!("Error writing event to file {:?}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error processing event: {:?}", e);
                        }
                    }
                }
            })
            .await;
    });

    let hyperdrive_4626_for_remove_liquidity = hyperdrive_4626.clone();
    let writer_for_remove_liquidity = writer.clone();
    let remove_liquidity_task = tokio::spawn(async move {
        let remove_liquidity_filter =
            hyperdrive_4626_for_remove_liquidity.remove_liquidity_filter();
        let remove_liquidity_sub = remove_liquidity_filter.stream_with_meta().await.unwrap();
        remove_liquidity_sub
            .for_each_concurrent(None, move |item| {
                let writer = writer_for_remove_liquidity.clone();
                async move {
                    match item {
                        Ok((event, meta)) => {
                            if let Err(e) = on_remove_liquidity(writer, event, meta).await {
                                eprintln!("Error writing event to file {:?}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error processing event: {:?}", e);
                        }
                    }
                }
            })
            .await;
    });

    let _ = tokio::join!(
        open_long_task,
        close_long_task,
        open_short_task,
        close_short_task,
        add_liquidity_task,
        remove_liquidity_task
    );

    Ok(())
}

async fn write_event(
    writer: Arc<Mutex<Writer<File>>>,
    event_record: EventRecord,
) -> Result<(), Box<dyn Error>> {
    let mut wtr = writer.lock().unwrap();
    wtr.serialize(event_record)?;
    wtr.flush()?;
    Ok(())
}

async fn on_open_long(
    writer: Arc<Mutex<Writer<File>>>,
    event: i_hyperdrive::OpenLongFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!("OpenLong: {{ trader: {}, asset_id: {}, maturity_time: {}, base_amount: {}, vault_share_amount: {}, as_base: {}, bond_amount: {} }}",
        event.trader, event.asset_id, event.maturity_time, event.base_amount, event.vault_share_amount, event.as_base, event.bond_amount);
    let event_record = EventRecord {
        block_number: meta.block_number.to_string(),
        address: event.trader,
        type_: "OpenLong".into(),
        data: serde_json::to_string(&event)?,
    };
    write_event(writer, event_record).await
}
async fn on_close_long(
    writer: Arc<Mutex<Writer<File>>>,
    event: i_hyperdrive::CloseLongFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!("CloseLong: {{ trader: {}, destination: {}, asset_id: {}, maturity_time: {}, base_amount: {}, vault_share_amount: {}, as_base: {}, bond_amount: {} }}",
        event.trader, event.destination, event.asset_id, event.maturity_time, event.base_amount, event.vault_share_amount, event.as_base, event.bond_amount);
    let event_record = EventRecord {
        block_number: meta.block_number.to_string(),
        address: event.trader,
        type_: "CloseLong".into(),
        data: serde_json::to_string(&event)?,
    };
    write_event(writer, event_record).await
}
async fn on_open_short(
    writer: Arc<Mutex<Writer<File>>>,
    event: i_hyperdrive::OpenShortFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!("OpenShort: {{ trader: {}, asset_id: {}, maturity_time: {}, base_amount: {}, vault_share_amount: {}, as_base: {}, base_proceeds: {}, bond_amount: {} }}",
        event.trader, event.asset_id, event.maturity_time, event.base_amount, event.vault_share_amount, event.as_base, event.base_proceeds, event.bond_amount);
    let event_record = EventRecord {
        block_number: meta.block_number.to_string(),
        address: event.trader,
        type_: "OpenShort".into(),
        data: serde_json::to_string(&event)?,
    };
    write_event(writer, event_record).await
}
async fn on_close_short(
    writer: Arc<Mutex<Writer<File>>>,
    event: i_hyperdrive::CloseShortFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!("CloseShort: {{ trader: {}, destination: {}, asset_id: {}, maturity_time: {}, base_amount: {}, vault_share_amount: {}, as_base: {}, base_payment: {}, bond_amount: {} }}",
        event.trader, event.destination, event.asset_id, event.maturity_time, event.base_amount, event.vault_share_amount, event.as_base, event.base_payment, event.bond_amount);
    let event_record = EventRecord {
        block_number: meta.block_number.to_string(),
        address: event.trader,
        type_: "CloseShort".into(),
        data: serde_json::to_string(&event)?,
    };
    write_event(writer, event_record).await
}
async fn on_add_liquidity(
    writer: Arc<Mutex<Writer<File>>>,
    event: i_hyperdrive::AddLiquidityFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!("AddLiquidity: {{ provider: {}, amount: {}, base_amount: {}, share_amount: {}, as_base: {}, lp_share_price: {} }}",
        event.provider, event.lp_amount, event.base_amount, event.vault_share_amount, event.as_base, event.lp_share_price);
    let event_record = EventRecord {
        block_number: meta.block_number.to_string(),
        address: event.provider,
        type_: "AddLiquidity".into(),
        data: serde_json::to_string(&event)?,
    };
    write_event(writer, event_record).await
}
async fn on_remove_liquidity(
    writer: Arc<Mutex<Writer<File>>>,
    event: i_hyperdrive::RemoveLiquidityFilter,
    meta: LogMeta,
) -> Result<(), Box<dyn Error>> {
    info!("RemoveLiquidity: {{ provider: {}, destination: {}, amount: {}, base_amount: {}, share_amount: {}, as_base: {}, withdrawal_share_amount: {}, lp_share_price: {} }}",
        event.provider, event.destination, event.lp_amount, event.base_amount, event.vault_share_amount, event.as_base, event.withdrawal_share_amount, event.lp_share_price);
    let event_record = EventRecord {
        block_number: meta.block_number.to_string(),
        address: event.provider,
        type_: "RemoveLiquidity".into(),
        data: serde_json::to_string(&event)?,
    };
    write_event(writer, event_record).await
}
