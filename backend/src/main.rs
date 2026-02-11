use axum::{
    extract::State,
    routing::{get, post, delete, put},
    Router,
    http::{Method, header::{AUTHORIZATION, CONTENT_TYPE, ACCEPT}},
};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use sqlx::postgres::{PgPool, PgPoolOptions};
use dotenvy::dotenv;
use tower_http::cors::{CorsLayer, Any};

mod models;
mod sync;
mod handlers;

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sanctus_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    tracing::info!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create pool");
    
    tracing::info!("Database connection established");

    tracing::info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    tracing::info!("Migrations applied successfully");

    let state = AppState { db: pool };

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/auth/login", post(handlers::auth::login))
        .route("/users", get(handlers::user::list_users).post(handlers::user::create_user))
        .route("/users/:id", delete(handlers::user::delete_user))
        .route("/budgets", get(handlers::budget::list_budgets).post(handlers::budget::create_budget))
        .route("/budgets/:id", put(handlers::budget::update_budget))
        .route("/reports/trial-balance", get(handlers::report::get_trial_balance))
        .route("/reports/income-expenditure", get(handlers::report::get_income_expenditure))
        .route("/import/members", post(handlers::import::import_members))
        .route("/import/transactions", post(handlers::import::import_transactions))
        .route("/sync", post(sync::sync_handler))
        .route("/dashboard", get(handlers::dashboard::get_dashboard_stats))
        .route("/dioceses", get(handlers::diocese::list_dioceses))
        .route("/parishes", get(handlers::parish::list_parishes).post(handlers::parish::create_parish))
        .route("/parishes/:id", get(handlers::parish::get_parish).put(handlers::parish::update_parish).delete(handlers::parish::delete_parish))
        .route("/members", get(handlers::member::list_members).post(handlers::member::create_member))
        .route("/members/:id", get(handlers::member::get_member).put(handlers::member::update_member).delete(handlers::member::delete_member))
        .route("/transactions/income", get(handlers::transaction::list_income_transactions).post(handlers::transaction::create_income_transaction))
        .route("/transactions/income/:id", get(handlers::transaction::get_income_transaction))
        .route("/transactions/expense", get(handlers::transaction::list_expense_vouchers).post(handlers::transaction::create_expense_voucher))
        .route("/transactions/expense/:id", get(handlers::transaction::get_expense_voucher))
        .route("/sacraments", get(handlers::sacrament::list_sacraments).post(handlers::sacrament::create_sacrament))
        .route("/sacraments/:id", get(handlers::sacrament::get_sacrament).put(handlers::sacrament::update_sacrament).delete(handlers::sacrament::delete_sacrament))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
                .allow_headers([AUTHORIZATION, CONTENT_TYPE, ACCEPT]),
        )
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::debug!("listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Hello, Sanctus!"
}

async fn health_check(State(state): State<AppState>) -> &'static str {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => "Database is healthy",
        Err(_) => "Database is unhealthy",
    }
}
