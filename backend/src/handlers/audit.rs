use axum::{
    extract::{State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use serde::Deserialize;
use crate::{
    AppState,
    models::audit::AuditLog,
    handlers::auth::AuthUser,
    handlers::rbac,
};

// Utility function to log audit events
pub async fn log_audit_event(
    state: &AppState,
    user_id: Uuid,
    parish_id: Option<Uuid>,
    action_type: &str,
    table_name: &str,
    record_id: Option<Uuid>,
    old_values: Option<serde_json::Value>,
    new_values: Option<serde_json::Value>,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO audit_log (user_id, parish_id, action_type, table_name, record_id, old_values, new_values, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        "#,
        user_id,
        parish_id,
        action_type,
        table_name,
        record_id,
        old_values,
        new_values
    )
    .execute(&state.db)
    .await?;
    
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct AuditQuery {
    pub parish_id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub action_type: Option<String>,
    pub table_name: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn list_audit_logs(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<AuditQuery>,
) -> Result<Json<Vec<AuditLog>>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let limit = query.limit.unwrap_or(100).min(500);
    let offset = query.offset.unwrap_or(0);

    let parish_id: Option<Uuid> = match auth.role {
    crate::models::user::UserRole::SuperAdmin => query.parish_id,
    _ => {
        // ParishAdmin must be scoped to their own parish
        Some(auth.parish_id.ok_or((
            StatusCode::FORBIDDEN,
            "Parish admin must have a parish assigned".to_string(),
        ))?)
    }
};

    let logs = sqlx::query_as::<_, AuditLog>(
        r#"
        SELECT a.*
        FROM audit_log a
        WHERE ($1::uuid IS NULL OR a.parish_id = $1)
          AND ($2::uuid IS NULL OR a.user_id = $2)
          AND ($3::text IS NULL OR a.action_type = $3)
          AND ($4::text IS NULL OR a.table_name = $4)
        ORDER BY a.created_at DESC
        LIMIT $5 OFFSET $6
        "#
    )
    .bind(parish_id)
    .bind(query.user_id)
    .bind(&query.action_type)
    .bind(&query.table_name)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(logs))
}

// Add this helper function at the bottom of audit.rs
pub async fn write_audit_log(
    db: &sqlx::PgPool,
    user_id: Option<uuid::Uuid>,
    parish_id: Option<uuid::Uuid>,
    action_type: &str,
    table_name: &str,
    record_id: Option<uuid::Uuid>,
    old_values: Option<serde_json::Value>,
    new_values: Option<serde_json::Value>,
) {
    // Fire and forget — don't fail the main request if audit fails
    let _ = sqlx::query(
        r#"INSERT INTO audit_log
           (user_id, parish_id, action_type, table_name, record_id, old_values, new_values)
           VALUES ($1, $2, $3, $4, $5, $6, $7)"#
    )
    .bind(user_id)
    .bind(parish_id)
    .bind(action_type)
    .bind(table_name)
    .bind(record_id)
    .bind(old_values)
    .bind(new_values)
    .execute(db)
    .await;
}
