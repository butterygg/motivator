use std::sync::Arc;

use chrono::{TimeZone, Utc};
use ethers::{
    providers::{Middleware, Provider, Ws},
    types::{I256, U256, U64},
};
use rust_decimal::Decimal;

use crate::globals::*;

pub fn timestamp_to_string(timestamp: U256) -> String {
    let datetime = Utc
        .timestamp_opt(timestamp.as_u64() as i64, 0)
        .single()
        .ok_or("Invalid timestamp");
    match datetime {
        Ok(datetime) => datetime.to_rfc3339(),
        Err(e) => e.to_string(),
    }
}

pub async fn find_block_by_timestamp(
    client: Arc<Provider<Ws>>,
    desired_timestamp: u64,
    start_block: U64,
    end_block: U64,
) -> Result<U64, Box<dyn std::error::Error>> {
    let mut low = start_block.as_u64();
    let mut high = end_block.as_u64();

    while low <= high {
        let mid = low + (high - low) / 2;
        let mid_block = client.get_block::<u64>(mid).await?.unwrap();
        match mid_block.timestamp.as_u64().cmp(&desired_timestamp) {
            std::cmp::Ordering::Less => low = mid + 1,
            std::cmp::Ordering::Greater => high = mid - 1,
            std::cmp::Ordering::Equal => return Ok(mid.into()),
        }
    }
    Ok(high.into())
}

pub trait Decimalizable {
    fn normalized(&self) -> Decimal;
}

impl Decimalizable for I256 {
    fn normalized(&self) -> Decimal {
        let val_i128 = (*self).as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}

impl Decimalizable for U256 {
    fn normalized(&self) -> Decimal {
        let val_ethers_i128 = I256::try_from(*self).unwrap();
        let val_i128 = val_ethers_i128.as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}

impl Decimalizable for fixed_point::FixedPoint {
    fn normalized(&self) -> Decimal {
        let val_ethers_i128 = I256::try_from(*self).unwrap();
        let val_i128 = val_ethers_i128.as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}
