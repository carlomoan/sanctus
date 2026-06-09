use crate::{
    handlers::auth::AuthUser,
    handlers::rbac,
    models::budget::{
        Budget, BudgetPerformance, BudgetUtilization, CreateBudgetRequest, UpdateBudgetRequest,
    },
    AppState,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

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
    rbac::require_finance(&auth)?;
    let parish_id = rbac::resolve_parish_id(&auth, Some(query.parish_id))?;

    let year = query
        .fiscal_year
        .unwrap_or(chrono::Utc::now().format("%Y").to_string().parse().unwrap());

    let budgets = sqlx::query_as::<_, Budget>(
        "SELECT * FROM budget WHERE parish_id = $1 AND fiscal_year = $2 AND deleted_at IS NULL ORDER BY category"
    )
    .bind(parish_id)
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
    rbac::require_finance(&auth)?;
    let parish_id = rbac::resolve_parish_id(&auth, Some(payload.parish_id))?;

    let budget = sqlx::query_as::<_, Budget>(
        r#"
        INSERT INTO budget (
            parish_id, category, amount, fiscal_year, fiscal_month, description, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#,
    )
    .bind(parish_id)
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
    rbac::require_finance(&auth)?;

    let mut budget =
        sqlx::query_as::<_, Budget>("SELECT * FROM budget WHERE id = $1 AND deleted_at IS NULL")
            .bind(id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, "Budget not found".to_string()))?;

    if let Some(amt) = payload.amount {
        budget.amount = amt;
    }
    if let Some(desc) = payload.description {
        budget.description = Some(desc);
    }

    let updated = sqlx::query_as::<_, Budget>(
        r#"
        UPDATE budget
        SET amount = $1, description = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
        "#,
    )
    .bind(budget.amount)
    .bind(budget.description)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

pub async fn get_budget_utilization(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ListBudgetQuery>,
) -> Result<Json<BudgetPerformance>, (StatusCode, String)> {
    rbac::require_finance(&auth)?;
    let parish_id = rbac::resolve_parish_id(&auth, Some(query.parish_id))?;

    let year = query
        .fiscal_year
        .unwrap_or(chrono::Utc::now().format("%Y").to_string().parse().unwrap());

    // Get all budgets for the parish and year
    let budgets = sqlx::query_as::<_, Budget>(
        "SELECT * FROM budget WHERE parish_id = $1 AND fiscal_year = $2 AND deleted_at IS NULL ORDER BY category"
    )
    .bind(parish_id)
    .bind(year)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut total_budget = Decimal::ZERO;
    let mut total_spent = Decimal::ZERO;
    let mut categories = Vec::new();

    for budget in &budgets {
        total_budget += budget.amount;

        // Get actual spending for this category
        let actual_spent: Decimal = sqlx::query_scalar(
            r#"
            SELECT COALESCE(SUM(amount), 0)
            FROM expense_voucher
            WHERE parish_id = $1
            AND category = $2
            AND EXTRACT(YEAR FROM voucher_date) = $3
            AND deleted_at IS NULL
            "#,
        )
        .bind(parish_id)
        .bind(&budget.category)
        .bind(year)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        total_spent += actual_spent;

        let remaining = budget.amount - actual_spent;
        let utilization_percentage = if budget.amount > Decimal::ZERO {
            (actual_spent / budget.amount * Decimal::from(100))
                .to_f64()
                .unwrap_or(0.0)
        } else {
            0.0
        };

        categories.push(BudgetUtilization {
            category: budget.category.clone(),
            budget_amount: budget.amount,
            actual_spent,
            remaining,
            utilization_percentage,
            fiscal_year: budget.fiscal_year,
            fiscal_month: budget.fiscal_month,
        });
    }

    let total_remaining = total_budget - total_spent;
    let overall_utilization = if total_budget > Decimal::ZERO {
        (total_spent / total_budget * Decimal::from(100))
            .to_f64()
            .unwrap_or(0.0)
    } else {
        0.0
    };

    Ok(Json(BudgetPerformance {
        total_budget,
        total_spent,
        total_remaining,
        overall_utilization,
        categories,
        fiscal_year: year,
    }))
}
