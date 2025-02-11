use mongodb::{Client, Database};
use std::env;
use std::error::Error;
use bson::doc;

pub async fn setup_database(client: &Client) -> Result<(), Box<dyn Error>> {
    // Get the database name from environment
    let db_name = env::var("DATA_INITDB_DATABASE").expect("DATA_INITDB_DATABASE must be set");
    let db = client.database(&db_name);

    // Get tables from environment and parse JSON array
    let tables = env::var("DATA_INITDB_TABLES").expect("DATA_INITDB_TABLES must be valid JSON array");
    let tables: Vec<String> = serde_json::from_str(&tables).expect("DATA_INITDB_TABLES must be valid JSON array");

    create_collections(&db, &tables).await?;

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

pub async fn init_db() -> Result<Client, Box<dyn Error>> {
    // Get MongoDB connection URI from environment
    let client_uri = env::var("DATA_INITDB_URI").expect("DATA_INITDB_URI must be set");

    // Create client
    let client = Client::with_uri_str(&client_uri).await?;

    // Test connection
    client
        .database("admin")
        .run_command(doc! {"ping": 1}, None)
        .await?;

    println!("Successfully connected to DATA MongoDB");

    // Setup database and collections
    setup_database(&client).await?;

    Ok(client)
} 