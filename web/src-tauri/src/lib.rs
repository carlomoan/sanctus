use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use std::collections::HashMap;
use std::path::PathBuf;

/// Load env vars from a .env file (simple key=value parser).
fn load_env_file(path: &PathBuf) -> HashMap<String, String> {
    let mut map = HashMap::new();
    if let Ok(contents) = std::fs::read_to_string(path) {
        for line in contents.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if let Some((key, value)) = line.split_once('=') {
                map.insert(key.trim().to_string(), value.trim().to_string());
            }
        }
    }
    map
}

/// Find the .env file: check next to the executable, then in common locations.
fn find_env_file() -> Option<PathBuf> {
    // 1. Next to the running executable (production install)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let candidate = dir.join(".env");
            if candidate.exists() {
                return Some(candidate);
            }
        }
    }
    // 2. Current working directory
    let cwd = std::env::current_dir().ok()?;
    let candidate = cwd.join(".env");
    if candidate.exists() {
        return Some(candidate);
    }
    // 3. Home directory config
    if let Some(home) = dirs_next::home_dir() {
        let candidate = home.join(".sanctus").join(".env");
        if candidate.exists() {
            return Some(candidate);
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Load environment variables for the backend sidecar
            let mut env_vars: HashMap<String, String> = HashMap::new();

            // Try to load from .env file
            if let Some(env_path) = find_env_file() {
                log::info!("Loading backend env from: {:?}", env_path);
                env_vars = load_env_file(&env_path);
            }

            // Fallback: inherit from current process environment
            for key in &["DATABASE_URL", "JWT_SECRET", "RUST_LOG"] {
                if !env_vars.contains_key(*key) {
                    if let Ok(val) = std::env::var(key) {
                        env_vars.insert(key.to_string(), val);
                    }
                }
            }

            // Spawn the backend sidecar with env vars
            let mut sidecar_cmd = app.shell()
                .sidecar("sanctus-backend")
                .expect("failed to create sidecar command");

            for (key, value) in &env_vars {
                sidecar_cmd = sidecar_cmd.env(key, value);
            }

            let (mut rx, _child) = sidecar_cmd
                .spawn()
                .expect("failed to spawn backend sidecar");

            // Log sidecar output
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            log::info!("[backend] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            log::info!("[backend:err] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Terminated(status) => {
                            log::error!("[backend] process terminated with {:?}", status);
                            break;
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
