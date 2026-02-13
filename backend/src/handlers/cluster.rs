use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use serde::Deserialize;
use crate::{AppState, models::cluster::{Cluster, CreateClusterRequest, UpdateClusterRequest}, handlers::auth::AuthUser, handlers::rbac};

#[derive(Debug, Deserialize)]
pub struct ClusterQuery {
    pub parish_id: Option<Uuid>,
}

pub async fn list_clusters(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ClusterQuery>,
) -> Result<Json<Vec<Cluster>>, (StatusCode, String)> {
    let parish_id = rbac::resolve_parish_id(&auth, query.parish_id)?;
    let clusters = sqlx::query_as::<_, Cluster>(
        "SELECT * FROM cluster WHERE parish_id = $1 AND deleted_at IS NULL ORDER BY cluster_name"
    )
    .bind(parish_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(clusters))
}

pub async fn get_cluster(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Cluster>, (StatusCode, String)> {
    let cluster = sqlx::query_as::<_, Cluster>(
        "SELECT * FROM cluster WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Cluster not found".to_string()))?;

    Ok(Json(cluster))
}

pub async fn create_cluster(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateClusterRequest>,
) -> Result<Json<Cluster>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let parish_id = rbac::resolve_parish_id(&auth, Some(payload.parish_id))?;

    let cluster = sqlx::query_as::<_, Cluster>(
        r#"
        INSERT INTO cluster (parish_id, cluster_code, cluster_name, location_description, leader_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#
    )
    .bind(parish_id)
    .bind(payload.cluster_code)
    .bind(payload.cluster_name)
    .bind(payload.location_description)
    .bind(payload.leader_name)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(cluster))
}

pub async fn update_cluster(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateClusterRequest>,
) -> Result<Json<Cluster>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let existing = sqlx::query_as::<_, Cluster>(
        "SELECT * FROM cluster WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Cluster not found".to_string()))?;

    let cluster = sqlx::query_as::<_, Cluster>(
        r#"
        UPDATE cluster SET
            cluster_name = $1,
            location_description = $2,
            leader_name = $3,
            is_active = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING *
        "#
    )
    .bind(payload.cluster_name.unwrap_or(existing.cluster_name))
    .bind(payload.location_description.or(existing.location_description))
    .bind(payload.leader_name.or(existing.leader_name))
    .bind(payload.is_active.or(existing.is_active))
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(cluster))
}

pub async fn delete_cluster(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let result = sqlx::query(
        "UPDATE cluster SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Cluster not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
