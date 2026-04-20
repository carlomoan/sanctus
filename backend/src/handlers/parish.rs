use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::parish::{Parish, CreateParishRequest, UpdateParishRequest}, handlers::auth::AuthUser, models::user::UserRole, models::dashboard::DashboardStats};
use rust_decimal::Decimal;
use sqlx::Row;

pub async fn list_parishes(
    _auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Parish>>, (StatusCode, String)> {
    let parishes = sqlx::query_as::<_, Parish>(
        "SELECT * FROM parish WHERE deleted_at IS NULL ORDER BY parish_name"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(parishes))
}

pub async fn get_parish(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Parish>, (StatusCode, String)> {
    let parish = sqlx::query_as::<_, Parish>(
        "SELECT * FROM parish WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Parish not found".to_string()))?;

    Ok(Json(parish))
}

pub async fn create_parish(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateParishRequest>,
) -> Result<Json<Parish>, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin {
        return Err((StatusCode::FORBIDDEN, "Only SuperAdmins can create parishes".to_string()));
    }
    let parish = sqlx::query_as::<_, Parish>(
        r#"
        INSERT INTO parish (
            diocese_id, parish_code, parish_name, patron_saint, 
            priest_name, priest_id, established_date, physical_address, 
            contact_email, contact_phone
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        "#
    )
    .bind(payload.diocese_id)
    .bind(payload.parish_code)
    .bind(payload.parish_name)
    .bind(payload.patron_saint)
    .bind(payload.priest_name)
    .bind(payload.priest_id)
    .bind(payload.established_date)
    .bind(payload.physical_address)
    .bind(payload.contact_email)
    .bind(payload.contact_phone)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(parish))
}

pub async fn update_parish(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateParishRequest>,
) -> Result<Json<Parish>, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin && auth.role != UserRole::ParishAdmin {
        return Err((StatusCode::FORBIDDEN, "Unauthorized to update parish".to_string()));
    }
    let mut parish = sqlx::query_as::<_, Parish>(
        "SELECT * FROM parish WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Parish not found".to_string()))?;

    if let Some(name) = payload.parish_name { parish.parish_name = name; }
    if let Some(saint) = payload.patron_saint { parish.patron_saint = Some(saint); }
    if let Some(priest) = payload.priest_name { parish.priest_name = Some(priest); }
    if let Some(pid) = payload.priest_id { parish.priest_id = Some(pid); }
    if let Some(addr) = payload.physical_address { parish.physical_address = Some(addr); }
    if let Some(email) = payload.contact_email { parish.contact_email = Some(email); }
    if let Some(phone) = payload.contact_phone { parish.contact_phone = Some(phone); }
    if let Some(active) = payload.is_active { parish.is_active = Some(active); }

    let updated_parish = sqlx::query_as::<_, Parish>(
        r#"
        UPDATE parish
        SET 
            parish_name = $1,
            patron_saint = $2,
            priest_name = $3,
            priest_id = $4,
            physical_address = $5,
            contact_email = $6,
            contact_phone = $7,
            is_active = $8,
            updated_at = NOW()
        WHERE id = $9
        RETURNING *
        "#
    )
    .bind(parish.parish_name)
    .bind(parish.patron_saint)
    .bind(parish.priest_name)
    .bind(parish.priest_id)
    .bind(parish.physical_address)
    .bind(parish.contact_email)
    .bind(parish.contact_phone)
    .bind(parish.is_active)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated_parish))
}

pub async fn delete_parish(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin {
        return Err((StatusCode::FORBIDDEN, "Only SuperAdmins can delete parishes".to_string()));
    }
    let result = sqlx::query(
        "UPDATE parish SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Parish not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_parish_stats(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(parish_id): Path<Uuid>,
) -> Result<Json<DashboardStats>, (StatusCode, String)> {
    // Check permissions - SuperAdmin can see any parish, others only their own
    if auth.role != UserRole::SuperAdmin && auth.parish_id != Some(parish_id) {
        return Err((StatusCode::FORBIDDEN, "You don't have permission to view this parish's stats".to_string()));
    }

    // Total Members
    let total_members: i64 = sqlx::query("SELECT COUNT(*) as count FROM member WHERE parish_id = $1 AND deleted_at IS NULL AND is_active = TRUE")
        .bind(parish_id).fetch_one(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .try_get("count").unwrap_or(0);

    // Active Parishes (will be 1 for specific parish)
    let active_parishes: i64 = sqlx::query("SELECT COUNT(*) as count FROM parish WHERE id = $1 AND deleted_at IS NULL AND is_active = TRUE")
        .bind(parish_id).fetch_one(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .try_get("count").unwrap_or(0);

    // Total Families
    let total_families: i64 = sqlx::query("SELECT COUNT(*) as count FROM family WHERE parish_id = $1 AND deleted_at IS NULL AND is_active = TRUE")
        .bind(parish_id).fetch_one(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .try_get("count").unwrap_or(0);

    // Total Clusters
    let total_clusters: i64 = sqlx::query("SELECT COUNT(*) as count FROM cluster WHERE parish_id = $1 AND deleted_at IS NULL AND is_active = TRUE")
        .bind(parish_id).fetch_one(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .try_get("count").unwrap_or(0);

    // Financials
    let income_record = sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM income_transaction WHERE parish_id = $1 AND deleted_at IS NULL")
        .bind(parish_id).fetch_one(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let total_income: Decimal = income_record.try_get("total").unwrap_or(Decimal::ZERO);

    let expense_record = sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM expense_voucher WHERE parish_id = $1 AND deleted_at IS NULL AND approval_status = 'APPROVED'")
        .bind(parish_id).fetch_one(&state.db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let total_expenses: Decimal = expense_record.try_get("total").unwrap_or(Decimal::ZERO);

    let stats = DashboardStats {
        total_members,
        active_parishes,
        total_families,
        total_clusters,
        total_income,
        total_expenses,
        pending_approvals: 0, // TODO: Calculate actual pending approvals
    };

    Ok(Json(stats))
}
