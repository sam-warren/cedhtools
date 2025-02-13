use uuid::Uuid;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Stats {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub value: Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
} 