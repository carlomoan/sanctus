#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    use std::net::SocketAddr;
    use sqlx::postgres::PgPoolOptions;
    use dotenvy::dotenv;
    use tauri::{Manager, State as TauriState};
    use dirs;

    fn load_config() {
        let config_path = dirs::home_dir()
            .unwrap_or_default()
            .join(".config/sanctus/database.conf");

        if config_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&config_path) {
                for line in content.lines() {
                    let line = line.trim();
                    if line.is_empty() || line.starts_with('#') { continue; }
                    if let Some((key, value)) = line.split_once('=') {
                        std::env::set_var(key.trim(), value.trim());
                    }
                }
            }
        }
    }

    fn get_database_url() -> String {
        // 1. Check environment variable first (should be set by load_config())
        if let Ok(url) = std::env::var("DATABASE_URL") {
            return url;
        }

        // 2. Fall back to a sensible default for local installs
        "postgresql://postgres:postgres@localhost:5432/sanctus".to_string()
    }

    // Load configuration first
    load_config();

    // Tauri commands for frontend integration
    #[tauri::command]
    async fn get_app_version() -> Result<String, String> {
        Ok(env!("CARGO_PKG_VERSION").to_string())
    }

    #[tauri::command]
    async fn check_backend_health(state: TauriState<'_, ocmis_backend::AppState>) -> Result<String, String> {
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

    let database_url = get_database_url();

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

    let backend_state = ocmis_backend::AppState { db: pool.clone() };
    let app = ocmis_backend::router::build_router(backend_state);

    // Start backend server in background
    tokio::spawn(async move {
        let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        let _: () = axum::serve(listener, app).await.unwrap();
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
        .manage(ocmis_backend::AppState { db: pool })
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
