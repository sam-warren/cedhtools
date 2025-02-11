mod db;
mod models;
mod data;

use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Initialize database connections and setup
    let cedhtools_client = db::init_cedhtools_db().await?;
    let user_client = db::init_user_db().await?;

    // Print the databases in our MongoDB clusters:
    println!("CEDHTOOLS Databases:");
    for name in cedhtools_client.list_database_names(None, None).await? {
        println!("- {}", name);
    }

    println!("\nUSER Databases:");
    for name in user_client.list_database_names(None, None).await? {
        println!("- {}", name);
    }

    Ok(())
}