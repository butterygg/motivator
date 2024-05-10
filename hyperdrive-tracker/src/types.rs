use std::collections::HashMap;
use std::sync::Arc;

use dashmap::DashMap;
use ethers::{
    providers::{Provider, Ws},
    types::{H160, I256, U256, U64},
};
use serde::{Deserialize, Serialize};

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

#[derive(Debug, Clone)]
pub struct RunConfig {
    pub client: Arc<Provider<Ws>>,
    pub pool_type: String,
    pub address: H160,
    pub deploy_block_num: U64,
    pub deploy_timestamp: U256,
    pub end_block_num: U64,
    pub end_timestamp: U256,
    pub contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pub pool_config: i_hyperdrive::PoolConfig,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct PositionKey {
    pub trader: H160,
    pub maturity_time: U256,
}

///All Debits are considered from the point of view of player wallets with respect to their
///base-token holdings.
pub type Long = Vec<PositionDebit>;

///Closes are negative, Opens are positive.
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct PositionDebit {
    pub block_number: U64,
    pub timestamp: U256,
    pub base_amount: I256,
    pub bond_amount: I256,
}

pub type Short = Vec<PositionDebit>;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct LpKey {
    pub provider: H160,
}

pub type Lp = Vec<LpDebit>;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct LpDebit {
    pub block_number: U64,
    pub timestamp: U256,
    pub lp_amount: I256,
    pub base_amount: I256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct SharePrice {
    pub block_num: U64,
    pub price: U256,
}

#[derive(Debug, Clone)]
pub struct Events {
    pub longs: DashMap<PositionKey, Long>,
    pub shorts: DashMap<PositionKey, Short>,
    pub lps: DashMap<LpKey, Lp>,
    pub share_prices: DashMap<U256, SharePrice>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SerializableEvents {
    pub longs: HashMap<PositionKey, Long>,
    pub shorts: HashMap<PositionKey, Short>,
    pub lps: HashMap<LpKey, Lp>,
    pub share_prices: HashMap<U256, SharePrice>,
}

#[derive(Serialize, Deserialize)]
pub struct EventsDb {
    pub end_block_num: u64,
    pub events: SerializableEvents,
}
