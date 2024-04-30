use ethers::types::{H160, U64};
use hex_literal::hex;

use crate::types::*;

pub const HOUR: u64 = 60 * 60;

pub const DECIMAL_SCALE: u32 = 18;
pub const DECIMAL_PRECISION: u32 = 18;

pub const QUERY_BLOCKS_PAGE_SIZE: u64 = 1000;

lazy_static! {
    pub static ref HYPERDRIVE_4626: Hyperdrive = Hyperdrive {
        name: &"4626",
        address: H160(hex!("392839da0dacac790bd825c81ce2c5e264d793a8")),
        deployment_block: U64::from(5664183)
    };
}
lazy_static! {
    pub static ref HYPERDRIVE_STETH: Hyperdrive = Hyperdrive {
        name: &"stETH",
        address: H160(hex!("ff33bd6d7ed4119c99c310f3e5f0fa467796ee23")),
        deployment_block: U64::from(5663018)
    };
}
