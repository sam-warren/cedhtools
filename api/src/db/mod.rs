use sqlx::postgres::PgPool;
use std::env;
use std::error::Error;

pub async fn init_data_db() -> Result<PgPool, Box<dyn Error>> {
    let db_url = env::var("DATA_DB_URL").expect("DATA_DB_URL must be set");
    let pool = PgPool::connect(&db_url).await?;
    
    // Run migrations if they exist
    sqlx::migrate!("./migrations/data")
        .run(&pool)
        .await?;

    println!("Successfully connected to TimescaleDB");
    Ok(pool)
}
