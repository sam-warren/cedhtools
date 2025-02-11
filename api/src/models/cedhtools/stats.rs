use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;

#[derive(Debug, Serialize, Deserialize)]
pub struct Stats {
    #[serde(rename = "stats_id")]
    pub id: ObjectId,
    #[serde(rename = "stats_name")]
    pub name: String,
    #[serde(rename = "stats_desc")]
    pub description: String,
    #[serde(rename = "stats_keys")]
    pub keys: Vec<String>,
    #[serde(rename = "stats_rules")]
    pub rules: Vec<String>,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 