use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use crate::models::common::Timestamps;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    #[serde(rename = "user_id")]
    pub id: ObjectId,
    #[serde(rename = "user_name")]
    pub name: String,
    #[serde(rename = "user_email")]
    pub email: String,
    #[serde(rename = "user_password")]
    pub password: String,
    #[serde(rename = "user_role")]
    pub role: String,
    #[serde(flatten)]
    pub timestamps: Timestamps,
} 