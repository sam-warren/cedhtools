use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Timestamps {
    pub created_at: DateTime<Utc>,
    pub created_by: ObjectId,
    pub updated_at: DateTime<Utc>,
    pub updated_by: ObjectId,
} 