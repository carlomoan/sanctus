use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use crate::{AppState, models::dashboard::DashboardStats, handlers::auth::AuthUser, models::user::UserRole};
use rust_decimal::Decimal;
use sqlx::Row;

pub async fn get_dashboard_stats(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<DashboardStats>, (StatusCode, String)> {
    let is_super = auth.role == UserRole::SuperAdmin;
    let parish_id = auth.parish_id;

    // Total Members
    let total_members: i64 = if is_super {
        sqlx::query("SELECT COUNT(*) as count FROM member WHERE deleted_at IS NULL AND is_active = TRUE")
            .fetch_one(&state.db).await
    } else {
        sqlx::query("SELECT COUNT(*) as count FROM member WHERE parish_id = $1 AND deleted_at IS NULL AND is_active = TRUE")
            .bind(parish_id).fetch_one(&state.db).await
    }.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .try_get("count").unwrap_or(0);

    // Active Parishes
    let active_parishes: i64 = if is_super {
        sqlx::query("SELECT COUNT(*) as count FROM parish WHERE deleted_at IS NULL AND is_active = TRUE")
            .fetch_one(&state.db).await
    } else {
        sqlx::query("SELECT COUNT(*) as count FROM parish WHERE id = $1 AND deleted_at IS NULL AND is_active = TRUE")
            .bind(parish_id).fetch_one(&state.db).await
    }.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .try_get("count").unwrap_or(0);

    // Financials
    let income_record = if is_super {
        sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM income_transaction WHERE deleted_at IS NULL")
            .fetch_one(&state.db).await
    } else {
        sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM income_transaction WHERE parish_id = $1 AND deleted_at IS NULL")
            .bind(parish_id).fetch_one(&state.db).await
    }.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let total_income: Decimal = income_record.try_get("total").unwrap_or(Decimal::ZERO);

    let expense_record = if is_super {
        sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM expense_voucher WHERE deleted_at IS NULL AND approval_status = 'APPROVED'")
            .fetch_one(&state.db).await
    } else {
        sqlx::query("SELECT COALESCE(SUM(amount), 0) as total FROM expense_voucher WHERE parish_id = $1 AND deleted_at IS NULL AND approval_status = 'APPROVED'")
            .bind(parish_id).fetch_one(&state.db).await
    }.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let total_expenses: Decimal = expense_record.try_get("total").unwrap_or(Decimal::ZERO);

    // Pending Approvals
    let pending_approvals: i64 = if is_super {
        sqlx::query("SELECT COUNT(*) as count FROM expense_voucher WHERE deleted_at IS NULL AND approval_status = 'PENDING'")
            .fetch_one(&state.db).await
    } else {
        sqlx::query("SELECT COUNT(*) as count FROM expense_voucher WHERE parish_id = $1 AND deleted_at IS NULL AND approval_status = 'PENDING'")
            .bind(parish_id).fetch_one(&state.db).await
    }.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .try_get("count").unwrap_or(0);

    let stats = DashboardStats {
        total_members,
        active_parishes,
        total_income,
        total_expenses,
        pending_approvals,
    };

    Ok(Json(stats))
}
