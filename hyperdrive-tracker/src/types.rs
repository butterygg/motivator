use std::collections::HashMap;

use dashmap::DashMap;
use ethers::{
    providers::{Provider, Ws},
    types::{H160, I256, U256, U64},
};
use serde::{Deserialize, Serialize};

use hyperdrive_wrappers::wrappers::ihyperdrive::i_hyperdrive;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Hyperdrive {
    pub name: &'static str,
    pub address: H160,
    pub deployment_block: U64,
}

#[derive(Debug, Clone)]
pub struct HyperdriveConfig {
    pub hyperdrive: Hyperdrive,
    pub contract: i_hyperdrive::IHyperdrive<Provider<Ws>>,
    pub pool_config: i_hyperdrive::PoolConfig,
    pub ser_events: SerializableEvents,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Timeframe {
    pub start_block_num: U64,
    pub end_block_num: U64,
    pub start_timestamp: U256,
    pub end_timestamp: U256,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct PositionKey {
    pub trader: H160,
    pub maturity_time: U256,
}

/// All Debits are considered from the point of view of player wallets with respect to their
/// base-token holdings.
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

// [TODO] Simplify: use only U256 price.
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
