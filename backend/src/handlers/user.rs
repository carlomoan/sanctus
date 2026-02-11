use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::user::{User, UserProfile, UserRole, CreateUserRequest}, handlers::auth::AuthUser};
use bcrypt::{hash, DEFAULT_COST};

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
