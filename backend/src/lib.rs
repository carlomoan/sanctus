pub mod models;
pub mod sync;
pub mod handlers;
pub mod router;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::postgres::PgPool,
}
