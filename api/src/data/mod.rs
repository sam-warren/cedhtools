use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DefaultUser {
    pub name: String,
    pub email: String,
    pub password: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DefaultUsers {
    pub users: Vec<DefaultUser>,
}

pub fn load_default_users() -> DefaultUsers {
    let data = include_str!("default_users.json");
    serde_json::from_str(data).expect("Failed to parse default users")
} 