use uuid::Uuid;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Card {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub keys: Vec<String>,
    pub rules: Vec<String>,
    pub link: String,
    pub image: String,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 