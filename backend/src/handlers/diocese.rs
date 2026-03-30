use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::diocese::Diocese, handlers::auth::AuthUser, handlers::rbac};

pub async fn list_dioceses(
    _auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Diocese>>, (StatusCode, String)> {
    let dioceses = sqlx::query_as::<_, Diocese>(
        "SELECT * FROM diocese WHERE deleted_at IS NULL"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(dioceses))
}

pub async fn delete_diocese(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Only SuperAdmin can delete dioceses
    rbac::require_super_admin(&auth)?;
    
    let result = sqlx::query(
        "UPDATE diocese SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Diocese not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
