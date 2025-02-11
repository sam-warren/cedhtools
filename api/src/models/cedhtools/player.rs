use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;

#[derive(Debug, Serialize, Deserialize)]
pub struct Player {
    #[serde(rename = "player_id")]
    pub id: ObjectId,
    #[serde(rename = "player_name")]
    pub name: String,
    #[serde(rename = "player_desc")]
    pub description: String,
    #[serde(rename = "player_keys")]
    pub keys: Vec<String>,
    #[serde(rename = "player_rules")]
    pub rules: Vec<String>,
    #[serde(rename = "player_stats")]
    pub stats: Vec<ObjectId>,
    #[serde(rename = "player_links")]
    pub links: Vec<String>,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 