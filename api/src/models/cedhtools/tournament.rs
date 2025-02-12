use uuid::Uuid;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Tournament {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub decks: Vec<Uuid>,
    pub cards: Vec<Uuid>,
    pub stats: Vec<Uuid>,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 