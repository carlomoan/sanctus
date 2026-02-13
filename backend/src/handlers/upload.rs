use axum::{
    extract::{Multipart, State, Path},
    http::StatusCode,
    Json,
};
use serde::Serialize;
use std::path::PathBuf;
use uuid::Uuid;
use crate::{AppState, handlers::auth::AuthUser};

#[derive(Debug, Serialize)]
pub struct UploadResponse {
    pub url: String,
}

const UPLOAD_DIR: &str = "uploads";
const MAX_FILE_SIZE: usize = 5 * 1024 * 1024; // 5MB

fn ensure_upload_dir(subdir: &str) -> Result<PathBuf, (StatusCode, String)> {
    let path = PathBuf::from(UPLOAD_DIR).join(subdir);
    std::fs::create_dir_all(&path)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create upload directory: {}", e)))?;
    Ok(path)
}

pub async fn upload_parish_logo(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(parish_id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, String)> {
    let field = multipart.next_field().await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid multipart data: {}", e)))?
        .ok_or((StatusCode::BAD_REQUEST, "No file provided".to_string()))?;

    let filename = field.file_name()
        .map(|f| f.to_string())
        .unwrap_or_else(|| "logo.jpg".to_string());

    let ext = filename.rsplit('.').next().unwrap_or("jpg").to_lowercase();
    if !["jpg", "jpeg", "png", "gif", "webp", "svg"].contains(&ext.as_str()) {
        return Err((StatusCode::BAD_REQUEST, "Invalid file type. Allowed: jpg, jpeg, png, gif, webp, svg".to_string()));
    }

    let data = field.bytes().await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Failed to read file: {}", e)))?;

    if data.len() > MAX_FILE_SIZE {
        return Err((StatusCode::BAD_REQUEST, "File too large. Maximum size is 5MB".to_string()));
    }

    let dir = ensure_upload_dir("parishes")?;
    let stored_name = format!("{}.{}", parish_id, ext);
    let file_path = dir.join(&stored_name);

    tokio::fs::write(&file_path, &data).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save file: {}", e)))?;

    let url = format!("/uploads/parishes/{}", stored_name);

    sqlx::query("UPDATE parish SET logo_url = $1, updated_at = NOW() WHERE id = $2")
        .bind(&url)
        .bind(parish_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(UploadResponse { url }))
}

pub async fn upload_member_photo(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(member_id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, String)> {
    let field = multipart.next_field().await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid multipart data: {}", e)))?
        .ok_or((StatusCode::BAD_REQUEST, "No file provided".to_string()))?;

    let filename = field.file_name()
        .map(|f| f.to_string())
        .unwrap_or_else(|| "photo.jpg".to_string());

    let ext = filename.rsplit('.').next().unwrap_or("jpg").to_lowercase();
    if !["jpg", "jpeg", "png", "gif", "webp"].contains(&ext.as_str()) {
        return Err((StatusCode::BAD_REQUEST, "Invalid file type. Allowed: jpg, jpeg, png, gif, webp".to_string()));
    }

    let data = field.bytes().await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Failed to read file: {}", e)))?;

    if data.len() > MAX_FILE_SIZE {
        return Err((StatusCode::BAD_REQUEST, "File too large. Maximum size is 5MB".to_string()));
    }

    let dir = ensure_upload_dir("members")?;
    let stored_name = format!("{}.{}", member_id, ext);
    let file_path = dir.join(&stored_name);

    tokio::fs::write(&file_path, &data).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save file: {}", e)))?;

    let url = format!("/uploads/members/{}", stored_name);

    sqlx::query("UPDATE member SET photo_url = $1, updated_at = NOW() WHERE id = $2")
        .bind(&url)
        .bind(member_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(UploadResponse { url }))
}

pub async fn upload_user_photo(
    auth: AuthUser,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, String)> {
    let field = multipart.next_field().await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid multipart data: {}", e)))?
        .ok_or((StatusCode::BAD_REQUEST, "No file provided".to_string()))?;

    let filename = field.file_name()
        .map(|f| f.to_string())
        .unwrap_or_else(|| "photo.jpg".to_string());

    let ext = filename.rsplit('.').next().unwrap_or("jpg").to_lowercase();
    if !["jpg", "jpeg", "png", "gif", "webp"].contains(&ext.as_str()) {
        return Err((StatusCode::BAD_REQUEST, "Invalid file type. Allowed: jpg, jpeg, png, gif, webp".to_string()));
    }

    let data = field.bytes().await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Failed to read file: {}", e)))?;

    if data.len() > MAX_FILE_SIZE {
        return Err((StatusCode::BAD_REQUEST, "File too large. Maximum size is 5MB".to_string()));
    }

    let dir = ensure_upload_dir("users")?;
    let stored_name = format!("{}.{}", auth.user_id, ext);
    let file_path = dir.join(&stored_name);

    tokio::fs::write(&file_path, &data).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save file: {}", e)))?;

    let url = format!("/uploads/users/{}", stored_name);

    sqlx::query("UPDATE app_user SET profile_photo_url = $1, updated_at = NOW() WHERE id = $2")
        .bind(&url)
        .bind(auth.user_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(UploadResponse { url }))
}
