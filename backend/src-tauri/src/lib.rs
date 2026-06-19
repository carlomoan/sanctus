#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    use dotenvy::dotenv;
    use sqlx::postgres::PgPoolOptions;
    use std::net::SocketAddr;
    use std::sync::Arc;
    use tauri::{Manager, State as TauriState};
    use tokio::sync::Notify;

    fn load_config() {
        let config_path = dirs::home_dir()
            .unwrap_or_default()
            .join(".config/sanctus/database.conf");

        if config_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&config_path) {
                for line in content.lines() {
                    let line = line.trim();
                    if line.is_empty() || line.starts_with('#') {
                        continue;
                    }
                    if let Some((key, value)) = line.split_once('=') {
                        std::env::set_var(key.trim(), value.trim());
                    }
                }
            }
        }
    }

    fn get_database_url() -> String {
        if let Ok(url) = std::env::var("DATABASE_URL") {
            return url;
        }
        "postgresql://postgres:postgres@localhost:5432/sanctus".to_string()
    }

    /// Find an available port starting from the preferred one
    async fn find_available_port(preferred: u16) -> u16 {
        for port in preferred..(preferred + 10) {
            let addr = SocketAddr::from(([127, 0, 0, 1], port));
            if tokio::net::TcpListener::bind(addr).await.is_ok() {
                return port;
            }
        }
        preferred // fallback
    }

    // Load configuration first
    load_config();

    // Readiness signal — set once the HTTP server is accepting connections
    let ready = Arc::new(Notify::new());
    let ready_clone = ready.clone();

    // Tauri commands for frontend integration
    #[tauri::command]
    async fn get_app_version() -> Result<String, String> {
        Ok(env!("CARGO_PKG_VERSION").to_string())
    }

    #[tauri::command]
    async fn check_backend_health(
        state: TauriState<'_, ocmis_backend::AppState>,
    ) -> Result<String, String> {
        match sqlx::query("SELECT 1").execute(&state.db).await {
            Ok(_) => Ok("healthy".to_string()),
            Err(e) => Err(format!("unhealthy: {}", e)),
        }
    }

    #[tauri::command]
    async fn get_server_port(port: TauriState<'_, u16>) -> Result<u16, String> {
        Ok(*port)
    }

    // Initialize environment variables
    dotenv().ok();

    let database_url = get_database_url();

    // Create database connection pool with retry
    let mut pool = None;
    for attempt in 1..=5 {
        match PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
        {
            Ok(p) => {
                pool = Some(p);
                break;
            }
            Err(e) => {
                log::warn!("DB connection attempt {} failed: {}", attempt, e);
                if attempt < 5 {
                    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                }
            }
        }
    }
    let pool = pool.expect("Failed to connect to database after 5 attempts");

    // Run migrations
    sqlx::migrate!("../migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let server_port = find_available_port(3000).await;
    log::info!("Backend will listen on 127.0.0.1:{}", server_port);

    let backend_state = ocmis_backend::AppState { db: pool.clone() };
    let app = ocmis_backend::router::build_router(backend_state);

    // Start backend server in background
    let port_for_notify = server_port;
    tokio::spawn(async move {
        let addr = SocketAddr::from(([127, 0, 0, 1], port_for_notify));
        match tokio::net::TcpListener::bind(addr).await {
            Ok(listener) => {
                log::info!("Backend HTTP server listening on {}", addr);
                ready_clone.notify_one();
                let _: () = axum::serve(listener, app).await.unwrap();
            }
            Err(e) => {
                log::error!("Failed to bind backend server: {}", e);
            }
        }
    });

    // Run Tauri application
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .manage(ocmis_backend::AppState { db: pool })
        .manage(server_port)
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            check_backend_health,
            get_server_port
        ])
        .setup(move |app| {
            // Configure window
            if let Some(window) = app.get_webview_window("main") {
                window.show().unwrap();
                window.set_focus().unwrap();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
