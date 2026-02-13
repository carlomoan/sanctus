use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use serde::Deserialize;
use crate::{AppState, models::scc::{Scc, CreateSccRequest, UpdateSccRequest}, handlers::auth::AuthUser, handlers::rbac};

#[derive(Debug, Deserialize)]
pub struct SccQuery {
    pub parish_id: Option<Uuid>,
    pub cluster_id: Option<Uuid>,
}

pub async fn list_sccs(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<SccQuery>,
) -> Result<Json<Vec<Scc>>, (StatusCode, String)> {
    let sccs = if let Some(cluster_id) = query.cluster_id {
        sqlx::query_as::<_, Scc>(
            "SELECT * FROM scc WHERE cluster_id = $1 AND deleted_at IS NULL ORDER BY scc_name"
        )
        .bind(cluster_id)
        .fetch_all(&state.db)
        .await
    } else {
        let parish_id = rbac::resolve_parish_id(&auth, query.parish_id)?;
        sqlx::query_as::<_, Scc>(
            "SELECT * FROM scc WHERE parish_id = $1 AND deleted_at IS NULL ORDER BY scc_name"
        )
        .bind(parish_id)
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(sccs))
}

pub async fn get_scc(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Scc>, (StatusCode, String)> {
    let scc = sqlx::query_as::<_, Scc>(
        "SELECT * FROM scc WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "SCC not found".to_string()))?;

    Ok(Json(scc))
}

pub async fn create_scc(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateSccRequest>,
) -> Result<Json<Scc>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let parish_id = rbac::resolve_parish_id(&auth, Some(payload.parish_id))?;

    let scc = sqlx::query_as::<_, Scc>(
        r#"
        INSERT INTO scc (parish_id, cluster_id, scc_code, scc_name, patron_saint, leader_name, location_description, meeting_day, meeting_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#
    )
    .bind(parish_id)
    .bind(payload.cluster_id)
    .bind(payload.scc_code)
    .bind(payload.scc_name)
    .bind(payload.patron_saint)
    .bind(payload.leader_name)
    .bind(payload.location_description)
    .bind(payload.meeting_day)
    .bind(payload.meeting_time)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(scc))
}

pub async fn update_scc(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateSccRequest>,
) -> Result<Json<Scc>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let existing = sqlx::query_as::<_, Scc>(
        "SELECT * FROM scc WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "SCC not found".to_string()))?;

    let scc = sqlx::query_as::<_, Scc>(
        r#"
        UPDATE scc SET
            cluster_id = $1,
            scc_name = $2,
            patron_saint = $3,
            leader_name = $4,
            location_description = $5,
            meeting_day = $6,
            meeting_time = $7,
            is_active = $8,
            updated_at = NOW()
        WHERE id = $9
        RETURNING *
        "#
    )
    .bind(payload.cluster_id.or(existing.cluster_id))
    .bind(payload.scc_name.unwrap_or(existing.scc_name))
    .bind(payload.patron_saint.or(existing.patron_saint))
    .bind(payload.leader_name.or(existing.leader_name))
    .bind(payload.location_description.or(existing.location_description))
    .bind(payload.meeting_day.or(existing.meeting_day))
    .bind(payload.meeting_time.or(existing.meeting_time))
    .bind(payload.is_active.or(existing.is_active))
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(scc))
}

pub async fn delete_scc(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let result = sqlx::query(
        "UPDATE scc SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "SCC not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
