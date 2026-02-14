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

    let parish_id = rbac::resolve_parish_id(&auth, query.parish_id).ok();

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
