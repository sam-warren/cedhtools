use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;

#[derive(Debug, Serialize, Deserialize)]
pub struct Card {
    #[serde(rename = "card_id")]
    pub id: ObjectId,
    #[serde(rename = "card_name")]
    pub name: String,
    #[serde(rename = "card_desc")]
    pub description: String,
    #[serde(rename = "card_keys")]
    pub keys: Vec<String>,
    #[serde(rename = "card_rules")]
    pub rules: Vec<String>,
    #[serde(rename = "card_link")]
    pub link: String,
    #[serde(rename = "card_image")]
    pub image: String,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 