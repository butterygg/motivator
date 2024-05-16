use std::collections::HashMap;

use ethers::types::{H160, U64};
use hex_literal::hex;

use crate::types::*;

pub const DECIMAL_SCALE: u32 = 18;
pub const DECIMAL_PRECISION: u32 = 8;
pub const QUERY_PAGE_SIZE: u64 = 100u64;

lazy_static! {
    pub static ref HYPERDRIVES: HashMap<&'static str, HyperdriveConfig> = [
        (
            "0x3928",
            HyperdriveConfig {
                pool_type: "4626",
                address: H160(hex!("392839da0dacac790bd825c81ce2c5e264d793a8")),
                deploy_block_num: U64::from(5664183)
            }
        ),
        (
            "0xff33",
            HyperdriveConfig {
                pool_type: "stETH",
                address: H160(hex!("ff33bd6d7ed4119c99c310f3e5f0fa467796ee23")),
                deploy_block_num: U64::from(5663018)
            }
        ),
        (
            "0x0436",
            HyperdriveConfig {
                pool_type: "4626",
                address: H160(hex!("0436b07823da988484b70309b0d1b509eadd2173")),
                deploy_block_num: U64::from(5755457)
            }
        ),
        (
            "0x72e1",
            HyperdriveConfig {
                pool_type: "stETH",
                address: H160(hex!("72e19347512c194a6812c72934bf0439ffb31a26")),
                deploy_block_num: U64::from(5768223)
            }
        ),
        (
            "0x4e38",
            HyperdriveConfig {
                pool_type: "stETH",
                address: H160(hex!("4e38fd41c03ff11b3426efae53138b86116797b8")),
                deploy_block_num: U64::from(5663061)
            }
        ),
        (
            "0xb932",
            HyperdriveConfig {
                pool_type: "4626",
                address: H160(hex!("b932f8085399c228b16a9f7fc3219d47ffa2810d")),
                deploy_block_num: U64::from(5664214)
            }
        ),
    ]
    .into();
}
