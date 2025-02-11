use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;

#[derive(Debug, Serialize, Deserialize)]
pub struct Tags {
    #[serde(rename = "tags_id")]
    pub id: ObjectId,
    #[serde(rename = "tags_name")]
    pub name: String,
    #[serde(rename = "tags_desc")]
    pub description: String,
    #[serde(rename = "tags_keys")]
    pub keys: Vec<String>,
    #[serde(rename = "tags_rules")]
    pub rules: Vec<String>,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 