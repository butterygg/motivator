use std::collections::HashMap;
use std::fmt::{self, Display, Formatter};
use std::sync::Arc;

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
    pub events: Arc<Events>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Timeframe {
    pub start_block_num: U64,
    pub end_block_num: U64,
    pub start_timestamp: U256,
    pub end_timestamp: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct LongKey {
    pub trader: H160,
    pub maturity_time: U256,
}
impl Display for LongKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}-0x{:x}", self.trader, self.maturity_time)
    }
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

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ShortKey {
    pub trader: H160,
    pub maturity_time: U256,
}
impl Display for ShortKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}-0x{:x}", self.trader, self.maturity_time)
    }
}

pub type Short = Vec<PositionDebit>;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct LpKey {
    pub provider: H160,
}
impl Display for LpKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "0x{:x}", self.provider)
    }
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
    pub longs: DashMap<LongKey, Long>,
    pub shorts: DashMap<ShortKey, Short>,
    pub lps: DashMap<LpKey, Lp>,
    pub share_prices: DashMap<U256, SharePrice>,
}

#[derive(Debug, Clone)]
pub struct SerializableEvents {
    pub longs: HashMap<LongKey, Long>,
    pub shorts: HashMap<ShortKey, Short>,
    pub lps: HashMap<LpKey, Lp>,
    pub share_prices: HashMap<U256, SharePrice>,
}
