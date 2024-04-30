use std::collections::HashMap;
use std::fmt;
use std::str::FromStr;
use std::sync::Arc;

use chrono::{TimeZone, Utc};
use dashmap::DashMap;
use ethers::{
    providers::{Middleware, Provider, Ws},
    types::{H160, I256, U256, U64},
};
use rust_decimal::Decimal;
use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

use crate::globals::*;
use crate::types::*;

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

pub trait DashMapToHashMap<K, V> {
    fn to_hashmap(&self) -> HashMap<K, V>
    where
        K: Eq + std::hash::Hash + Clone,
        V: Clone;
}

impl<K, V> DashMapToHashMap<K, V> for DashMap<K, V> {
    fn to_hashmap(&self) -> HashMap<K, V>
    where
        K: Eq + std::hash::Hash + Clone,
        V: Clone,
    {
        self.iter()
            .map(|entry| (entry.key().clone(), entry.value().clone()))
            .collect()
    }
}

pub trait EventsSerializable {
    fn to_serializable(&self) -> SerializableEvents;
}

impl EventsSerializable for Events {
    fn to_serializable(&self) -> SerializableEvents {
        SerializableEvents {
            longs: self.longs.to_hashmap(),
            shorts: self.shorts.to_hashmap(),
            lps: self.lps.to_hashmap(),
            share_prices: self.share_prices.to_hashmap(),
        }
    }
}

impl Serialize for PositionKey {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let key_str = format!("0x{:x}-0x{:x}", self.trader, self.maturity_time);
        serializer.serialize_str(&key_str)
    }
}

impl<'de> Deserialize<'de> for PositionKey {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct PositionKeyVisitor;

        impl<'de> Visitor<'de> for PositionKeyVisitor {
            type Value = PositionKey;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a string encoded PositionKey")
            }

            fn visit_str<E>(self, value: &str) -> Result<PositionKey, E>
            where
                E: de::Error,
            {
                let parts: Vec<&str> = value.split('-').collect();
                if parts.len() != 2 {
                    return Err(E::custom("Invalid format for PositionKey"));
                }
                let trader = H160::from_str(parts[0]).map_err(de::Error::custom)?;
                let maturity_time = U256::from_str(parts[1]).map_err(de::Error::custom)?;
                Ok(PositionKey {
                    trader,
                    maturity_time,
                })
            }
        }

        deserializer.deserialize_string(PositionKeyVisitor)
    }
}

impl Serialize for LpKey {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let key_str = format!("0x{:x}", self.provider);
        serializer.serialize_str(&key_str)
    }
}

impl<'de> Deserialize<'de> for LpKey {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct LpKeyVisitor;

        impl<'de> Visitor<'de> for LpKeyVisitor {
            type Value = LpKey;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a string encoded LpKey")
            }

            fn visit_str<E>(self, value: &str) -> Result<LpKey, E>
            where
                E: de::Error,
            {
                let provider = H160::from_str(value).map_err(de::Error::custom)?;
                Ok(LpKey { provider })
            }
        }

        deserializer.deserialize_string(LpKeyVisitor)
    }
}
