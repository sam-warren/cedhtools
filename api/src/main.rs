mod db;
mod models;

use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Initialize database connection
    let _data_pool = db::init_data_db().await?;

    println!("API server started successfully");

    // Keep the application running
    tokio::signal::ctrl_c().await?;
    println!("Shutting down...");

    Ok(())
}