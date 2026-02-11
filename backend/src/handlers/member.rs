use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::member::{Member, GenderType, MaritalStatus}, handlers::auth::AuthUser};
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
    pub is_head_of_family: Option<bool>,
    pub notes: Option<String>,
}

pub async fn list_members(
    _auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ListMembersQuery>,
) -> Result<Json<Vec<Member>>, (StatusCode, String)> {
    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let members = if let Some(parish_id) = query.parish_id {
        sqlx::query_as::<_, Member>(
            "SELECT * FROM member WHERE parish_id = $1 AND deleted_at IS NULL ORDER BY last_name, first_name LIMIT $2 OFFSET $3"
        )
        .bind(parish_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as::<_, Member>(
            "SELECT * FROM member WHERE deleted_at IS NULL ORDER BY last_name, first_name LIMIT $1 OFFSET $2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    };

    let members = members.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

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
    _auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateMemberRequest>,
) -> Result<Json<Member>, (StatusCode, String)> {
    let member = sqlx::query_as::<_, Member>(
        r#"
        INSERT INTO member (
            parish_id, family_id, scc_id, member_code, first_name, middle_name, last_name,
            date_of_birth, gender, marital_status, national_id, occupation,
            email, phone_number, physical_address, photo_url, is_head_of_family, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
        "#
    )
    .bind(payload.parish_id)
    .bind(payload.family_id)
    .bind(payload.scc_id)
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
    .bind(payload.is_head_of_family)
    .bind(payload.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(member))
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemberRequest {
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
    pub is_head_of_family: Option<bool>,
    pub notes: Option<String>,
    pub is_active: Option<bool>,
}

pub async fn update_member(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateMemberRequest>,
) -> Result<Json<Member>, (StatusCode, String)> {
    let mut member = sqlx::query_as::<_, Member>(
        "SELECT * FROM member WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Member not found".to_string()))?;

    // In a real app, we might use a helper or macro to avoid this boilerplate
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
    if let Some(val) = payload.is_head_of_family { member.is_head_of_family = Some(val); }
    if let Some(val) = payload.notes { member.notes = Some(val); }
    if let Some(val) = payload.is_active { member.is_active = Some(val); }

    let updated_member = sqlx::query_as::<_, Member>(
        r#"
        UPDATE member
        SET 
            first_name = $1, middle_name = $2, last_name = $3,
            date_of_birth = $4, gender = $5, marital_status = $6,
            national_id = $7, occupation = $8, email = $9,
            phone_number = $10, physical_address = $11, photo_url = $12,
            is_head_of_family = $13, notes = $14, is_active = $15,
            updated_at = NOW()
        WHERE id = $16
        RETURNING *
        "#
    )
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
    .bind(member.is_head_of_family)
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
