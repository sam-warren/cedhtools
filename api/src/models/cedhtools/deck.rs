use uuid::Uuid;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Deck {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub keys: Vec<String>,
    pub rules: Vec<String>,
    pub cards: Vec<Uuid>,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 