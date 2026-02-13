use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use serde::Deserialize;
use crate::{
    AppState,
    models::permission::{
        Permission, CustomRole, RolePermission, UserPermissionOverride,
        CreateRoleRequest, UpdateRoleRequest, AssignPermissionsRequest,
        GrantUserOverrideRequest, RevokeUserOverrideRequest,
        RoleWithPermissions, UserOverrideInfo,
    },
    handlers::auth::AuthUser,
    handlers::rbac,
};

// ============================================================================
// Permissions
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct PermissionQuery {
    pub group: Option<String>,
}

pub async fn list_permissions(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<PermissionQuery>,
) -> Result<Json<Vec<Permission>>, (StatusCode, String)> {
    let permissions = if let Some(group) = query.group {
        sqlx::query_as::<_, Permission>(
            "SELECT * FROM permission WHERE permission_group = $1 ORDER BY permission_key"
        )
        .bind(group)
        .fetch_all(&state.db).await
    } else {
        sqlx::query_as::<_, Permission>(
            "SELECT * FROM permission ORDER BY permission_group, permission_key"
        )
        .fetch_all(&state.db).await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(permissions))
}

// ============================================================================
// Custom Roles
// ============================================================================

pub async fn list_roles(
    _auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<RoleWithPermissions>>, (StatusCode, String)> {
    let roles = sqlx::query_as::<_, CustomRole>(
        "SELECT * FROM custom_role ORDER BY is_system DESC, role_name"
    )
    .fetch_all(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut result = Vec::new();
    for role in roles {
        let permissions = sqlx::query_as::<_, Permission>(
            r#"
            SELECT p.* FROM permission p
            JOIN role_permission rp ON rp.permission_id = p.id
            WHERE rp.role_id = $1
            ORDER BY p.permission_group, p.permission_key
            "#
        )
        .bind(role.id)
        .fetch_all(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        result.push(RoleWithPermissions {
            id: role.id,
            role_name: role.role_name,
            display_name: role.display_name,
            description: role.description,
            is_system: role.is_system,
            permissions,
            created_at: role.created_at,
            updated_at: role.updated_at,
        });
    }

    Ok(Json(result))
}

pub async fn get_role(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<RoleWithPermissions>, (StatusCode, String)> {
    let role = sqlx::query_as::<_, CustomRole>(
        "SELECT * FROM custom_role WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Role not found".to_string()))?;

    let permissions = sqlx::query_as::<_, Permission>(
        r#"
        SELECT p.* FROM permission p
        JOIN role_permission rp ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        ORDER BY p.permission_group, p.permission_key
        "#
    )
    .bind(role.id)
    .fetch_all(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(RoleWithPermissions {
        id: role.id,
        role_name: role.role_name,
        display_name: role.display_name,
        description: role.description,
        is_system: role.is_system,
        permissions,
        created_at: role.created_at,
        updated_at: role.updated_at,
    }))
}

pub async fn create_role(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateRoleRequest>,
) -> Result<Json<CustomRole>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let role = sqlx::query_as::<_, CustomRole>(
        r#"
        INSERT INTO custom_role (role_name, display_name, description, is_system)
        VALUES ($1, $2, $3, FALSE)
        RETURNING *
        "#
    )
    .bind(&payload.role_name)
    .bind(&payload.display_name)
    .bind(&payload.description)
    .fetch_one(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Assign permissions if provided
    if let Some(perm_ids) = payload.permission_ids {
        for pid in perm_ids {
            sqlx::query(
                "INSERT INTO role_permission (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
            )
            .bind(role.id)
            .bind(pid)
            .execute(&state.db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    Ok(Json(role))
}

pub async fn update_role(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateRoleRequest>,
) -> Result<Json<CustomRole>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    // Don't allow editing system roles' names
    let existing = sqlx::query_as::<_, CustomRole>(
        "SELECT * FROM custom_role WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Role not found".to_string()))?;

    let display_name = payload.display_name.unwrap_or(existing.display_name);
    let description = payload.description.or(existing.description);

    let role = sqlx::query_as::<_, CustomRole>(
        r#"
        UPDATE custom_role SET display_name = $1, description = $2, updated_at = NOW()
        WHERE id = $3 RETURNING *
        "#
    )
    .bind(&display_name)
    .bind(&description)
    .bind(id)
    .fetch_one(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(role))
}

pub async fn delete_role(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    // Prevent deleting system roles
    let role = sqlx::query_as::<_, CustomRole>(
        "SELECT * FROM custom_role WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Role not found".to_string()))?;

    if role.is_system {
        return Err((StatusCode::FORBIDDEN, "Cannot delete system roles".to_string()));
    }

    sqlx::query("DELETE FROM custom_role WHERE id = $1")
        .bind(id)
        .execute(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

// ============================================================================
// Role Permission Assignment
// ============================================================================

pub async fn set_role_permissions(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(role_id): Path<Uuid>,
    Json(payload): Json<AssignPermissionsRequest>,
) -> Result<Json<Vec<Permission>>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    // Clear existing permissions for this role
    sqlx::query("DELETE FROM role_permission WHERE role_id = $1")
        .bind(role_id)
        .execute(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Insert new permissions
    for pid in &payload.permission_ids {
        sqlx::query(
            "INSERT INTO role_permission (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
        )
        .bind(role_id)
        .bind(pid)
        .execute(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // Return updated permissions
    let permissions = sqlx::query_as::<_, Permission>(
        r#"
        SELECT p.* FROM permission p
        JOIN role_permission rp ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        ORDER BY p.permission_group, p.permission_key
        "#
    )
    .bind(role_id)
    .fetch_all(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(permissions))
}

// ============================================================================
// User Permission Overrides (Temporary)
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct UserOverrideQuery {
    pub user_id: Option<Uuid>,
    pub active_only: Option<bool>,
}

pub async fn list_user_overrides(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<UserOverrideQuery>,
) -> Result<Json<Vec<UserOverrideInfo>>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let overrides = if let Some(user_id) = query.user_id {
        let active_filter = if query.active_only.unwrap_or(true) {
            "AND upo.is_active = TRUE AND (upo.expires_at IS NULL OR upo.expires_at > NOW())"
        } else {
            ""
        };
        let q = format!(
            r#"
            SELECT upo.id, upo.user_id, p.permission_key, p.display_name as permission_display_name,
                   upo.granted_by, upo.reason, upo.expires_at, upo.is_active, upo.created_at
            FROM user_permission_override upo
            JOIN permission p ON p.id = upo.permission_id
            WHERE upo.user_id = $1 {}
            ORDER BY upo.created_at DESC
            "#,
            active_filter
        );
        sqlx::query_as::<_, UserOverrideInfo>(&q)
            .bind(user_id)
            .fetch_all(&state.db).await
    } else {
        sqlx::query_as::<_, UserOverrideInfo>(
            r#"
            SELECT upo.id, upo.user_id, p.permission_key, p.display_name as permission_display_name,
                   upo.granted_by, upo.reason, upo.expires_at, upo.is_active, upo.created_at
            FROM user_permission_override upo
            JOIN permission p ON p.id = upo.permission_id
            WHERE upo.is_active = TRUE AND (upo.expires_at IS NULL OR upo.expires_at > NOW())
            ORDER BY upo.created_at DESC
            "#
        )
        .fetch_all(&state.db).await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(overrides))
}

pub async fn grant_user_overrides(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<GrantUserOverrideRequest>,
) -> Result<Json<Vec<UserOverrideInfo>>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    for pid in &payload.permission_ids {
        sqlx::query(
            r#"
            INSERT INTO user_permission_override (user_id, permission_id, granted_by, reason, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, permission_id) DO UPDATE SET
                granted_by = EXCLUDED.granted_by,
                reason = EXCLUDED.reason,
                expires_at = EXCLUDED.expires_at,
                is_active = TRUE
            "#
        )
        .bind(payload.user_id)
        .bind(pid)
        .bind(auth.user_id)
        .bind(&payload.reason)
        .bind(payload.expires_at)
        .execute(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // Return updated overrides
    let overrides = sqlx::query_as::<_, UserOverrideInfo>(
        r#"
        SELECT upo.id, upo.user_id, p.permission_key, p.display_name as permission_display_name,
               upo.granted_by, upo.reason, upo.expires_at, upo.is_active, upo.created_at
        FROM user_permission_override upo
        JOIN permission p ON p.id = upo.permission_id
        WHERE upo.user_id = $1 AND upo.is_active = TRUE
        ORDER BY upo.created_at DESC
        "#
    )
    .bind(payload.user_id)
    .fetch_all(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(overrides))
}

pub async fn revoke_user_overrides(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<RevokeUserOverrideRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    for pid in &payload.permission_ids {
        sqlx::query(
            "UPDATE user_permission_override SET is_active = FALSE WHERE user_id = $1 AND permission_id = $2"
        )
        .bind(payload.user_id)
        .bind(pid)
        .execute(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn revoke_single_override(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    sqlx::query("UPDATE user_permission_override SET is_active = FALSE WHERE id = $1")
        .bind(id)
        .execute(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}
