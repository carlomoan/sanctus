use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use serde::Deserialize;
use crate::{AppState, models::family::{Family, CreateFamilyRequest, UpdateFamilyRequest}, handlers::auth::AuthUser, handlers::rbac};

#[derive(Debug, Deserialize)]
pub struct FamilyQuery {
    pub parish_id: Option<Uuid>,
    pub scc_id: Option<Uuid>,
}

pub async fn list_families(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<FamilyQuery>,
) -> Result<Json<Vec<Family>>, (StatusCode, String)> {
    let families = if let Some(scc_id) = query.scc_id {
        sqlx::query_as::<_, Family>(
            "SELECT * FROM family WHERE scc_id = $1 AND deleted_at IS NULL ORDER BY family_name"
        )
        .bind(scc_id)
        .fetch_all(&state.db)
        .await
    } else {
        let parish_id = rbac::resolve_parish_id(&auth, query.parish_id)?;
        sqlx::query_as::<_, Family>(
            "SELECT * FROM family WHERE parish_id = $1 AND deleted_at IS NULL ORDER BY family_name"
        )
        .bind(parish_id)
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(families))
}

pub async fn get_family(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Family>, (StatusCode, String)> {
    let family = sqlx::query_as::<_, Family>(
        "SELECT * FROM family WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Family not found".to_string()))?;

    Ok(Json(family))
}

pub async fn create_family(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateFamilyRequest>,
) -> Result<Json<Family>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let parish_id = rbac::resolve_parish_id(&auth, Some(payload.parish_id))?;

    let family = sqlx::query_as::<_, Family>(
        r#"
        INSERT INTO family (parish_id, scc_id, family_code, family_name, physical_address, primary_phone, email, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#
    )
    .bind(parish_id)
    .bind(payload.scc_id)
    .bind(payload.family_code)
    .bind(payload.family_name)
    .bind(payload.physical_address)
    .bind(payload.primary_phone)
    .bind(payload.email)
    .bind(payload.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(family))
}

pub async fn update_family(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateFamilyRequest>,
) -> Result<Json<Family>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let existing = sqlx::query_as::<_, Family>(
        "SELECT * FROM family WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Family not found".to_string()))?;

    let family = sqlx::query_as::<_, Family>(
        r#"
        UPDATE family SET
            scc_id = $1,
            family_name = $2,
            head_of_family_id = $3,
            physical_address = $4,
            postal_address = $5,
            primary_phone = $6,
            secondary_phone = $7,
            email = $8,
            notes = $9,
            is_active = $10,
            updated_at = NOW()
        WHERE id = $11
        RETURNING *
        "#
    )
    .bind(payload.scc_id.or(existing.scc_id))
    .bind(payload.family_name.unwrap_or(existing.family_name))
    .bind(payload.head_of_family_id.or(existing.head_of_family_id))
    .bind(payload.physical_address.or(existing.physical_address))
    .bind(payload.postal_address.or(existing.postal_address))
    .bind(payload.primary_phone.or(existing.primary_phone))
    .bind(payload.secondary_phone.or(existing.secondary_phone))
    .bind(payload.email.or(existing.email))
    .bind(payload.notes.or(existing.notes))
    .bind(payload.is_active.or(existing.is_active))
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(family))
}

pub async fn delete_family(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let result = sqlx::query(
        "UPDATE family SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Family not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
