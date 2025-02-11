use mongodb::{Client, Database};
use std::env;
use std::error::Error;
use bson::doc;
use crate::models::user::User;
use crate::models::common::Timestamps;
use chrono::Utc;
use bson::oid::ObjectId;

pub async fn setup_database(client: &Client) -> Result<(), Box<dyn Error>> {
    // Get the database name from environment
    let db_name = env::var("USER_INITDB_DATABASE").expect("USER_INITDB_DATABASE must be set");
    let db = client.database(&db_name);

    // Get tables from environment and parse JSON array
    let tables = env::var("USER_INITDB_TABLES").expect("USER_INITDB_TABLES must be set");
    let tables: Vec<String> = serde_json::from_str(&tables).expect("USER_INITDB_TABLES must be valid JSON array");

    create_collections(&db, &tables).await?;
    
    // Ensure default users exist
    ensure_default_users(&db).await?;

    Ok(())
}

async fn create_collections(db: &Database, tables: &[String]) -> Result<(), Box<dyn Error>> {
    // Get existing collections
    let existing_collections = db.list_collection_names(None).await?;

    // Create collections that don't exist
    for table in tables {
        if !existing_collections.contains(table) {
            println!("Creating collection: {}", table);
            db.create_collection(table, None).await?;
        } else {
            println!("Collection already exists: {}", table);
        }
    }

    Ok(())
}

async fn ensure_default_users(db: &Database) -> Result<(), Box<dyn Error>> {
    let users_collection = db.collection::<User>("user");
    let default_users = crate::data::load_default_users();

    for default_user in default_users.users {
        // Check if user already exists
        let existing_user = users_collection
            .find_one(doc! { "user_email": &default_user.email }, None)
            .await?;

        if existing_user.is_none() {
            // Create new user if doesn't exist
            let now = Utc::now();
            let user = User {
                id: ObjectId::new(),
                name: default_user.name.clone(),
                email: default_user.email.clone(),
                password: default_user.password.clone(), // In production, this should be hashed
                role: default_user.role.clone(),
                timestamps: Timestamps {
                    created_at: now,
                    created_by: ObjectId::new(), // System user
                    updated_at: now,
                    updated_by: ObjectId::new(), // System user
                },
            };

            users_collection.insert_one(user, None).await?;
            println!("Created default user: {}", default_user.name);
        } else {
            println!("Default user already exists: {}", default_user.name);
        }
    }

    Ok(())
}

pub async fn init_db() -> Result<Client, Box<dyn Error>> {
    // Get MongoDB connection URI from environment
    let client_uri = env::var("USER_INITDB_URI").expect("USER_INITDB_URI must be set");

    // Create client
    let client = Client::with_uri_str(&client_uri).await?;

    // Test connection
    client
        .database("admin")
        .run_command(doc! {"ping": 1}, None)
        .await?;

    println!("Successfully connected to USER MongoDB");

    // Setup database and collections
    setup_database(&client).await?;

    Ok(client)
} 