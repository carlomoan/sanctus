use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::member::{SacramentRecord, SacramentType}, handlers::auth::AuthUser, handlers::rbac};
use serde::Deserialize;
use chrono::NaiveDate;

#[derive(Debug, Deserialize)]
pub struct ListSacramentsQuery {
    pub member_id: Option<Uuid>,
    pub parish_id: Option<Uuid>,
    pub _sacrament_type: Option<SacramentType>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSacramentRequest {
    pub member_id: Uuid,
    pub sacrament_type: SacramentType,
    pub sacrament_date: NaiveDate,
    pub officiating_minister: Option<String>,
    pub parish_id: Uuid,
    pub church_name: Option<String>,
    pub certificate_number: Option<String>,
    pub godparent_1_name: Option<String>,
    pub godparent_2_name: Option<String>,
    pub spouse_id: Option<Uuid>,
    pub spouse_name: Option<String>,
    pub witnesses: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSacramentRequest {
    pub sacrament_date: Option<NaiveDate>,
    pub officiating_minister: Option<String>,
    pub church_name: Option<String>,
    pub certificate_number: Option<String>,
    pub godparent_1_name: Option<String>,
    pub godparent_2_name: Option<String>,
    pub spouse_id: Option<Uuid>,
    pub spouse_name: Option<String>,
    pub witnesses: Option<String>,
    pub notes: Option<String>,
}

pub async fn list_sacraments(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ListSacramentsQuery>,
) -> Result<Json<Vec<SacramentRecord>>, (StatusCode, String)> {
    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let sacraments = if let Some(member_id) = query.member_id {
        sqlx::query_as::<_, SacramentRecord>(
            "SELECT * FROM sacrament_record WHERE member_id = $1 AND deleted_at IS NULL ORDER BY sacrament_date DESC"
        )
        .bind(member_id)
        .fetch_all(&state.db)
        .await
    } else {
        let parish_id = rbac::resolve_parish_id(&auth, query.parish_id)?;
        sqlx::query_as::<_, SacramentRecord>(
            "SELECT * FROM sacrament_record WHERE parish_id = $1 AND deleted_at IS NULL ORDER BY sacrament_date DESC LIMIT $2 OFFSET $3"
        )
        .bind(parish_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    };

    let sacraments = sacraments.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(sacraments))
}

pub async fn get_sacrament(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<SacramentRecord>, (StatusCode, String)> {
    let sacrament = sqlx::query_as::<_, SacramentRecord>(
        "SELECT * FROM sacrament_record WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Sacrament record not found".to_string()))?;

    Ok(Json(sacrament))
}

pub async fn create_sacrament(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateSacramentRequest>,
) -> Result<Json<SacramentRecord>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let parish_id = rbac::resolve_parish_id(&auth, Some(payload.parish_id))?;

    let sacrament = sqlx::query_as::<_, SacramentRecord>(
        r#"
        INSERT INTO sacrament_record (
            member_id, sacrament_type, sacrament_date, officiating_minister,
            parish_id, church_name, certificate_number, godparent_1_name,
            godparent_2_name, spouse_id, spouse_name, witnesses, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
        "#
    )
    .bind(payload.member_id)
    .bind(payload.sacrament_type)
    .bind(payload.sacrament_date)
    .bind(payload.officiating_minister)
    .bind(parish_id)
    .bind(payload.church_name)
    .bind(payload.certificate_number)
    .bind(payload.godparent_1_name)
    .bind(payload.godparent_2_name)
    .bind(payload.spouse_id)
    .bind(payload.spouse_name)
    .bind(payload.witnesses)
    .bind(payload.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(sacrament))
}

pub async fn update_sacrament(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateSacramentRequest>,
) -> Result<Json<SacramentRecord>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let mut sacrament = sqlx::query_as::<_, SacramentRecord>(
        "SELECT * FROM sacrament_record WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Sacrament record not found".to_string()))?;

    if let Some(val) = payload.sacrament_date { sacrament.sacrament_date = val; }
    if let Some(val) = payload.officiating_minister { sacrament.officiating_minister = Some(val); }
    if let Some(val) = payload.church_name { sacrament.church_name = Some(val); }
    if let Some(val) = payload.certificate_number { sacrament.certificate_number = Some(val); }
    if let Some(val) = payload.godparent_1_name { sacrament.godparent_1_name = Some(val); }
    if let Some(val) = payload.godparent_2_name { sacrament.godparent_2_name = Some(val); }
    if let Some(val) = payload.spouse_id { sacrament.spouse_id = Some(val); }
    if let Some(val) = payload.spouse_name { sacrament.spouse_name = Some(val); }
    if let Some(val) = payload.witnesses { sacrament.witnesses = Some(val); }
    if let Some(val) = payload.notes { sacrament.notes = Some(val); }

    let updated_sacrament = sqlx::query_as::<_, SacramentRecord>(
        r#"
        UPDATE sacrament_record
        SET 
            sacrament_date = $1, officiating_minister = $2, church_name = $3,
            certificate_number = $4, godparent_1_name = $5, godparent_2_name = $6,
            spouse_id = $7, spouse_name = $8, witnesses = $9, notes = $10,
            updated_at = NOW()
        WHERE id = $11
        RETURNING *
        "#
    )
    .bind(sacrament.sacrament_date)
    .bind(sacrament.officiating_minister)
    .bind(sacrament.church_name)
    .bind(sacrament.certificate_number)
    .bind(sacrament.godparent_1_name)
    .bind(sacrament.godparent_2_name)
    .bind(sacrament.spouse_id)
    .bind(sacrament.spouse_name)
    .bind(sacrament.witnesses)
    .bind(sacrament.notes)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated_sacrament))
}

pub async fn delete_sacrament(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let result = sqlx::query(
        "UPDATE sacrament_record SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Sacrament record not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
