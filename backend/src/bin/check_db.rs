use sqlx::postgres::PgPoolOptions;
use dotenvy::dotenv;
use std::env;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    let row: Option<(String, String)> = sqlx::query_as("SELECT username, password_hash FROM app_user WHERE username = 'admin'")
        .fetch_optional(&pool)
        .await?;

    if let Some((username, hash)) = row {
        println!("User found: {}", username);
        println!("Hash in DB: {}", hash);
    } else {
        println!("User 'admin' not found");
    }

    let diocese_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM diocese").fetch_one(&pool).await?;
    println!("Diocese count: {}", diocese_count.0);

    let parish_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM parish").fetch_one(&pool).await?;
    println!("Parish count: {}", parish_count.0);

    if parish_count.0 > 0 {
        let parish: (Uuid, String) = sqlx::query_as("SELECT id, parish_name FROM parish LIMIT 1").fetch_one(&pool).await?;
        println!("Example Parish: {} ({})", parish.1, parish.0);
    }

    Ok(())
}
