use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;

#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    #[serde(rename = "session_id")]
    pub id: ObjectId,
    #[serde(rename = "session_user")]
    pub user: ObjectId,
    #[serde(rename = "session_token")]
    pub token: String,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 