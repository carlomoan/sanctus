use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::member::{Member, GenderType, MaritalStatus, FamilyRole}, handlers::auth::AuthUser, handlers::rbac};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ListMembersQuery {
    pub parish_id: Option<Uuid>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemberRequest {
    pub parish_id: Uuid,
    pub family_id: Option<Uuid>,
    pub scc_id: Option<Uuid>,
    pub family_role: Option<FamilyRole>,
    pub member_code: String,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub date_of_birth: Option<chrono::NaiveDate>,
    pub gender: Option<GenderType>,
    pub marital_status: Option<MaritalStatus>,
    pub national_id: Option<String>,
    pub occupation: Option<String>,
    pub email: Option<String>,
    pub phone_number: Option<String>,
    pub physical_address: Option<String>,
    pub photo_url: Option<String>,
    pub notes: Option<String>,
}

pub async fn list_members(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ListMembersQuery>,
) -> Result<Json<Vec<Member>>, (StatusCode, String)> {
    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let parish_id = rbac::resolve_parish_id(&auth, query.parish_id)?;

    let members = sqlx::query_as::<_, Member>(
        "SELECT * FROM member WHERE parish_id = $1 AND deleted_at IS NULL ORDER BY last_name, first_name LIMIT $2 OFFSET $3"
    )
    .bind(parish_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(members))
}

pub async fn get_member(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Member>, (StatusCode, String)> {
    let member = sqlx::query_as::<_, Member>(
        "SELECT * FROM member WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Member not found".to_string()))?;

    Ok(Json(member))
}

pub async fn create_member(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateMemberRequest>,
) -> Result<Json<Member>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let parish_id = rbac::resolve_parish_id(&auth, Some(payload.parish_id))?;

    let member = sqlx::query_as::<_, Member>(
        r#"
        INSERT INTO member (
            parish_id, family_id, scc_id, family_role, member_code, first_name, middle_name, last_name,
            date_of_birth, gender, marital_status, national_id, occupation,
            email, phone_number, physical_address, photo_url, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
        "#
    )
    .bind(parish_id)
    .bind(payload.family_id)
    .bind(payload.scc_id)
    .bind(payload.family_role)
    .bind(payload.member_code)
    .bind(payload.first_name)
    .bind(payload.middle_name)
    .bind(payload.last_name)
    .bind(payload.date_of_birth)
    .bind(payload.gender)
    .bind(payload.marital_status)
    .bind(payload.national_id)
    .bind(payload.occupation)
    .bind(payload.email)
    .bind(payload.phone_number)
    .bind(payload.physical_address)
    .bind(payload.photo_url)
    .bind(payload.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(member))
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemberRequest {
    pub family_id: Option<Uuid>,
    pub scc_id: Option<Uuid>,
    pub family_role: Option<FamilyRole>,
    pub first_name: Option<String>,
    pub middle_name: Option<String>,
    pub last_name: Option<String>,
    pub date_of_birth: Option<chrono::NaiveDate>,
    pub gender: Option<GenderType>,
    pub marital_status: Option<MaritalStatus>,
    pub national_id: Option<String>,
    pub occupation: Option<String>,
    pub email: Option<String>,
    pub phone_number: Option<String>,
    pub physical_address: Option<String>,
    pub photo_url: Option<String>,
    pub notes: Option<String>,
    pub is_active: Option<bool>,
}

pub async fn update_member(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateMemberRequest>,
) -> Result<Json<Member>, (StatusCode, String)> {
    rbac::require_write(&auth)?;
    let mut member = sqlx::query_as::<_, Member>(
        "SELECT * FROM member WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Member not found".to_string()))?;

    // In a real app, we might use a helper or macro to avoid this boilerplate
    if let Some(val) = payload.family_id { member.family_id = Some(val); }
    if let Some(val) = payload.scc_id { member.scc_id = Some(val); }
    if let Some(val) = payload.family_role { member.family_role = Some(val); }
    if let Some(val) = payload.first_name { member.first_name = val; }
    if let Some(val) = payload.middle_name { member.middle_name = Some(val); }
    if let Some(val) = payload.last_name { member.last_name = val; }
    if let Some(val) = payload.date_of_birth { member.date_of_birth = Some(val); }
    if let Some(val) = payload.gender { member.gender = Some(val); }
    if let Some(val) = payload.marital_status { member.marital_status = Some(val); }
    if let Some(val) = payload.national_id { member.national_id = Some(val); }
    if let Some(val) = payload.occupation { member.occupation = Some(val); }
    if let Some(val) = payload.email { member.email = Some(val); }
    if let Some(val) = payload.phone_number { member.phone_number = Some(val); }
    if let Some(val) = payload.physical_address { member.physical_address = Some(val); }
    if let Some(val) = payload.photo_url { member.photo_url = Some(val); }
    if let Some(val) = payload.notes { member.notes = Some(val); }
    if let Some(val) = payload.is_active { member.is_active = Some(val); }

    let updated_member = sqlx::query_as::<_, Member>(
        r#"
        UPDATE member
        SET 
            family_id = $1, scc_id = $2, family_role = $3,
            first_name = $4, middle_name = $5, last_name = $6,
            date_of_birth = $7, gender = $8, marital_status = $9,
            national_id = $10, occupation = $11, email = $12,
            phone_number = $13, physical_address = $14, photo_url = $15,
            notes = $16, is_active = $17,
            updated_at = NOW()
        WHERE id = $18
        RETURNING *
        "#
    )
    .bind(member.family_id)
    .bind(member.scc_id)
    .bind(member.family_role)
    .bind(member.first_name)
    .bind(member.middle_name)
    .bind(member.last_name)
    .bind(member.date_of_birth)
    .bind(member.gender)
    .bind(member.marital_status)
    .bind(member.national_id)
    .bind(member.occupation)
    .bind(member.email)
    .bind(member.phone_number)
    .bind(member.physical_address)
    .bind(member.photo_url)
    .bind(member.notes)
    .bind(member.is_active)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated_member))
}

pub async fn delete_member(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    let result = sqlx::query(
        "UPDATE member SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Member not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
