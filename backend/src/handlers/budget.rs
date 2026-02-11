use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::budget::{Budget, CreateBudgetRequest, UpdateBudgetRequest}, handlers::auth::AuthUser, models::user::UserRole};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ListBudgetQuery {
    pub parish_id: Uuid,
    pub fiscal_year: Option<i32>,
}

pub async fn list_budgets(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ListBudgetQuery>,
) -> Result<Json<Vec<Budget>>, (StatusCode, String)> {
    // Basic RBAC check
    if auth.role != UserRole::SuperAdmin && auth.role != UserRole::ParishAdmin && auth.role != UserRole::Accountant {
        return Err((StatusCode::FORBIDDEN, "Unauthorized to view budgets".to_string()));
    }

    let year = query.fiscal_year.unwrap_or(chrono::Utc::now().format("%Y").to_string().parse().unwrap());

    let budgets = sqlx::query_as::<_, Budget>(
        "SELECT * FROM budget WHERE parish_id = $1 AND fiscal_year = $2 AND deleted_at IS NULL ORDER BY category"
    )
    .bind(query.parish_id)
    .bind(year)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(budgets))
}

pub async fn create_budget(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateBudgetRequest>,
) -> Result<Json<Budget>, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin && auth.role != UserRole::ParishAdmin && auth.role != UserRole::Accountant {
        return Err((StatusCode::FORBIDDEN, "Unauthorized to create budgets".to_string()));
    }

    let budget = sqlx::query_as::<_, Budget>(
        r#"
        INSERT INTO budget (
            parish_id, category, amount, fiscal_year, fiscal_month, description, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#
    )
    .bind(payload.parish_id)
    .bind(payload.category)
    .bind(payload.amount)
    .bind(payload.fiscal_year)
    .bind(payload.fiscal_month)
    .bind(payload.description)
    .bind(auth.user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(budget))
}

pub async fn update_budget(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateBudgetRequest>,
) -> Result<Json<Budget>, (StatusCode, String)> {
    if auth.role != UserRole::SuperAdmin && auth.role != UserRole::ParishAdmin && auth.role != UserRole::Accountant {
        return Err((StatusCode::FORBIDDEN, "Unauthorized to update budgets".to_string()));
    }

    let mut budget = sqlx::query_as::<_, Budget>(
        "SELECT * FROM budget WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Budget not found".to_string()))?;

    if let Some(amt) = payload.amount { budget.amount = amt; }
    if let Some(desc) = payload.description { budget.description = Some(desc); }

    let updated = sqlx::query_as::<_, Budget>(
        r#"
        UPDATE budget
        SET amount = $1, description = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
        "#
    )
    .bind(budget.amount)
    .bind(budget.description)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}
