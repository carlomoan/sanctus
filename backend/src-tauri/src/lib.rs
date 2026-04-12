#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    use axum::{
        extract::State,
        routing::get,
        Router,
        http::{Method, header::{AUTHORIZATION, CONTENT_TYPE, ACCEPT}},
    };
    use std::net::SocketAddr;
    use sqlx::postgres::{PgPool, PgPoolOptions};
    use dotenvy::dotenv;
    use tower_http::cors::{CorsLayer, Any};
    use tauri::{Manager, State as TauriState};

    #[derive(Clone)]
    struct AppState {
        db: PgPool,
    }

    // Tauri commands for frontend integration
    #[tauri::command]
    async fn get_app_version() -> Result<String, String> {
        Ok(env!("CARGO_PKG_VERSION").to_string())
    }

    #[tauri::command]
    async fn check_backend_health(state: TauriState<'_, AppState>) -> Result<String, String> {
        match sqlx::query("SELECT 1").execute(&state.db).await {
            Ok(_) => Ok("Database is healthy".to_string()),
            Err(e) => Err(format!("Database is unhealthy: {}", e)),
        }
    }

    #[tauri::command]
    async fn get_server_port() -> Result<u16, String> {
        Ok(3000)
    }

    // Initialize environment variables
    dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    // Create database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create pool");

    // Run migrations
    sqlx::migrate!("../migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let state = AppState { db: pool };

    // Create Axum router with basic routes for now
    // We'll expand this to include all backend routes
    let app = Router::new()
        .route("/", get(|| async { "Sanctus Backend Running!" }))
        .route("/health", get(|State(state): State<AppState>| async move {
            match sqlx::query("SELECT 1").execute(&state.db).await {
                Ok(_) => "Database is healthy",
                Err(_) => "Database is unhealthy",
            }
        }))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
                .allow_headers([AUTHORIZATION, CONTENT_TYPE, ACCEPT]),
        )
        .with_state(state.clone());

    // Start backend server in background
    tokio::spawn(async move {
        let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        axum::serve(listener, app).await.unwrap();
    });

    // Run Tauri application
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Debug)
                .build()
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            check_backend_health,
            get_server_port
        ])
        .setup(|app| {
            // Configure window
            let window = app.get_webview_window("main").unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
