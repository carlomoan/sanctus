use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::user::{User, UserProfile, UserRole, CreateUserRequest}, handlers::auth::AuthUser};
use bcrypt::{hash, DEFAULT_COST};
use serde::Deserialize;

pub async fn list_users(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<UserProfile>>, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin {
        return Err((StatusCode::FORBIDDEN, "Only SuperAdmins can list users".to_string()));
    }

    let users = sqlx::query_as::<_, User>(
        "SELECT * FROM app_user WHERE deleted_at IS NULL ORDER BY username"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let profiles = users.into_iter().map(|u| UserProfile {
        id: u.id,
        parish_id: u.parish_id,
        username: u.username,
        email: u.email,
        full_name: u.full_name,
        phone_number: u.phone_number,
        role: u.role,
        profile_photo_url: u.profile_photo_url,
    }).collect();

    Ok(Json(profiles))
}

pub async fn create_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserProfile>, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin {
        return Err((StatusCode::FORBIDDEN, "Only SuperAdmins can create users".to_string()));
    }

    let password_hash = hash(payload.password, DEFAULT_COST)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to hash password".to_string()))?;

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO app_user (
            parish_id, username, email, password_hash, full_name, phone_number, role
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#
    )
    .bind(payload.parish_id)
    .bind(payload.username)
    .bind(payload.email)
    .bind(password_hash)
    .bind(payload.full_name)
    .bind(payload.phone_number)
    .bind(payload.role)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(UserProfile {
        id: user.id,
        parish_id: user.parish_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
    }))
}

pub async fn delete_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin {
        return Err((StatusCode::FORBIDDEN, "Only SuperAdmins can delete users".to_string()));
    }

    let result = sqlx::query(
        "UPDATE app_user SET deleted_at = NOW(), is_active = FALSE WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "User not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct ToggleStatusRequest {
    pub is_active: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub phone_number: Option<String>,
    pub parish_id: Option<Uuid>,
    pub role: Option<UserRole>,
}

// ------- toggle_user_status -------------------------------------------
pub async fn toggle_user_status(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ToggleStatusRequest>,
) -> Result<Json<UserProfile>, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin {
        return Err((StatusCode::FORBIDDEN, "Only SuperAdmins can update users".to_string()));
    }

    let user = sqlx::query_as::<_, User>(
        "UPDATE app_user SET is_active = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING *"
    )
    .bind(payload.is_active)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(UserProfile {
        id: user.id,
        parish_id: user.parish_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
    }))
}

// ------- update_user ------------------------------------------------
pub async fn update_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<UserProfile>, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin {
        return Err((StatusCode::FORBIDDEN, "Only SuperAdmins can update users".to_string()));
    }

    let user = sqlx::query_as::<_, User>(
        r#"UPDATE app_user SET
            full_name    = COALESCE($1, full_name),
            email        = COALESCE($2, email),
            phone_number = COALESCE($3, phone_number),
            parish_id    = COALESCE($4, parish_id),
            role         = COALESCE($5, role),
            updated_at   = NOW()
           WHERE id = $6 AND deleted_at IS NULL
           RETURNING *"#
    )
    .bind(payload.full_name)
    .bind(payload.email)
    .bind(payload.phone_number)
    .bind(payload.parish_id)
    .bind(payload.role)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(UserProfile {
        id: user.id,
        parish_id: user.parish_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
    }))
}