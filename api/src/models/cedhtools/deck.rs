use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;

#[derive(Debug, Serialize, Deserialize)]
pub struct Deck {
    #[serde(rename = "deck_id")]
    pub id: ObjectId,
    #[serde(rename = "deck_name")]
    pub name: String,
    #[serde(rename = "deck_desc")]
    pub description: String,
    #[serde(rename = "deck_keys")]
    pub keys: Vec<String>,
    #[serde(rename = "deck_rules")]
    pub rules: Vec<String>,
    #[serde(rename = "deck_cards")]
    pub cards: Vec<ObjectId>,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 