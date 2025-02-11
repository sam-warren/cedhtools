use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;

#[derive(Debug, Serialize, Deserialize)]
pub struct Tournament {
    #[serde(rename = "tournament_id")]
    pub id: ObjectId,
    #[serde(rename = "tournament_name")]
    pub name: String,
    #[serde(rename = "tournament_desc")]
    pub description: String,
    #[serde(rename = "tournament_keys")]
    pub keys: Vec<String>,
    #[serde(rename = "tournament_rules")]
    pub rules: Vec<String>,
    #[serde(rename = "tournament_players")]
    pub players: Vec<ObjectId>,
    #[serde(rename = "tournament_decks")]
    pub decks: Vec<ObjectId>,
    #[serde(rename = "tournament_cards")]
    pub cards: Vec<ObjectId>,
    #[serde(rename = "tournament_stats")]
    pub stats: Vec<ObjectId>,
    #[serde(rename = "tournament_tags")]
    pub tags: Vec<ObjectId>,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 