use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::user::{User, UserProfile, UserRole, CreateUserRequest}, handlers::auth::AuthUser, handlers::audit::log_audit_event};
use bcrypt::{hash, DEFAULT_COST};
use serde::Deserialize;
use serde_json::json;

pub async fn list_users(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<UserProfile>>, (StatusCode, String)> {
    // Debug logging
    println!("DEBUG: list_users called by user role: {:?}", auth.role);
    println!("DEBUG: user parish_id: {:?}", auth.parish_id);
    
    let users = if auth.role == UserRole::SuperAdmin {
        // SuperAdmin can see all users (including deleted ones)
        sqlx::query_as::<_, User>(
            "SELECT * FROM app_user ORDER BY username"
        )
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    } else {
        // Parish admins can see users from their parish (including deleted ones)
        if let Some(parish_id) = auth.parish_id {
            sqlx::query_as::<_, User>(
                "SELECT * FROM app_user WHERE parish_id = $1 ORDER BY username"
            )
            .bind(parish_id)
            .fetch_all(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        } else {
            return Err((StatusCode::FORBIDDEN, "You don't have permission to list users".to_string()));
        }
    };

    println!("DEBUG: Found {} users in database", users.len());
    for (i, user) in users.iter().enumerate() {
        println!("DEBUG: User {}: {} ({}), active: {}, parish: {:?}", 
                 i+1, user.username, user.full_name, user.is_active, user.parish_id);
    }

    let profiles = users.into_iter().map(|u| UserProfile {
        id: u.id,
        parish_id: u.parish_id,
        username: u.username,
        email: u.email,
        full_name: u.full_name,
        phone_number: u.phone_number,
        role: u.role,
        profile_photo_url: u.profile_photo_url,
        is_active: u.deleted_at.is_none() && u.is_active, // Show as inactive if deleted
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

    // Log audit event
    if let Err(e) = log_audit_event(
        &state,
        auth.user_id,
        user.parish_id,
        "CREATE",
        "app_user",
        Some(user.id),
        None,
        Some(json!({
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "parish_id": user.parish_id
        }))
    ).await {
        eprintln!("Failed to log audit event: {}", e);
    }

    // Additional audit logging using fire-and-forget method
    crate::handlers::audit::write_audit_log(
        &state.db,
        Some(auth.user_id),
        user.parish_id,
        "INSERT",
        "app_user",
        Some(user.id),
        None,
        Some(json!({
            "username": user.username,
            "role": format!("{:?}", user.role),
            "email": user.email,
        }))
    ).await;

    Ok(Json(UserProfile {
        id: user.id,
        parish_id: user.parish_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
        is_active: user.is_active,
    }))
}

pub async fn delete_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Debug logging
    println!("DEBUG: delete_user called by role: {:?} for user: {}", auth.role, id);
    
    if auth.role == UserRole::SuperAdmin {
        // SuperAdmin can permanently delete users
        let result = sqlx::query(
            "DELETE FROM app_user WHERE id = $1"
        )
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if result.rows_affected() == 0 {
            return Err((StatusCode::NOT_FOUND, "User not found".to_string()));
        }
        
        println!("DEBUG: SuperAdmin permanently deleted user: {}", id);
    } else if auth.role == UserRole::ParishAdmin {
        // Parish Admin can only deactivate users (not delete from database)
        // Check if the target user belongs to their parish
        let target_user = sqlx::query_as::<_, User>(
            "SELECT * FROM app_user WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
        let target_user = target_user.ok_or((StatusCode::NOT_FOUND, "User not found".to_string()))?;
        
        // Check if target user belongs to the same parish
        match (auth.parish_id, target_user.parish_id) {
            (Some(auth_parish), Some(target_parish)) if auth_parish == target_parish => {
                // Same parish, allow deactivation
                let result = sqlx::query(
                    "UPDATE app_user SET is_active = FALSE WHERE id = $1"
                )
                .bind(id)
                .execute(&state.db)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

                if result.rows_affected() == 0 {
                    return Err((StatusCode::NOT_FOUND, "User not found".to_string()));
                }
                
                println!("DEBUG: Parish Admin deactivated user: {}", id);
            }
            _ => {
                return Err((StatusCode::FORBIDDEN, "You can only deactivate users from your parish".to_string()));
            }
        }
    } else {
        return Err((StatusCode::FORBIDDEN, "You don't have permission to delete users".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct ToggleStatusRequest {
    pub is_active: bool,
}

// Reactivate user (SuperAdmin only - can reactivate deleted users)
pub async fn reactivate_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserProfile>, (StatusCode, String)> {
    // Debug logging
    println!("DEBUG: reactivate_user called by role: {:?} for user: {}", auth.role, id);
    
    if auth.role != UserRole::SuperAdmin {
        return Err((StatusCode::FORBIDDEN, "Only SuperAdmins can reactivate users".to_string()));
    }

    let user = sqlx::query_as::<_, User>(
        "UPDATE app_user SET is_active = TRUE, deleted_at = NULL WHERE id = $1
         RETURNING *"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    println!("DEBUG: SuperAdmin reactivated user: {}", id);

    Ok(Json(UserProfile {
        id: user.id,
        parish_id: user.parish_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
        is_active: user.is_active,
    }))
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
    // Debug logging
    println!("DEBUG: toggle_user_status called by role: {:?} for user: {}", auth.role, id);
    
    // Check permissions
    if auth.role != UserRole::SuperAdmin {
        // For non-SuperAdmins, check if the target user belongs to their parish
        let target_user = sqlx::query_as::<_, User>(
            "SELECT * FROM app_user WHERE id = $1 AND deleted_at IS NULL"
        )
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
        let target_user = target_user.ok_or((StatusCode::NOT_FOUND, "User not found".to_string()))?;
        
        // Check if target user belongs to the same parish
        match (auth.parish_id, target_user.parish_id) {
            (Some(auth_parish), Some(target_parish)) if auth_parish == target_parish => {
                // Same parish, allow
            }
            _ => {
                return Err((StatusCode::FORBIDDEN, "You can only update users from your parish".to_string()));
            }
        }
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

    // Log audit event for user status change
    crate::handlers::audit::write_audit_log(
        &state.db,
        Some(auth.user_id),
        user.parish_id,
        "UPDATE",
        "app_user",
        Some(user.id),
        Some(json!({ "is_active": !payload.is_active })),
        Some(json!({ "is_active": payload.is_active })),
    ).await;

    Ok(Json(UserProfile {
        id: user.id,
        parish_id: user.parish_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
        is_active: user.is_active,
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
        is_active: user.is_active,
    }))
}