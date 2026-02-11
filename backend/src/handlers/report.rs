use axum::{
    extract::{State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::report::{TrialBalance, TrialBalanceEntry, IncomeExpenditureStatement, ReportEntry}, handlers::auth::AuthUser, models::user::UserRole};
use serde::Deserialize;
use chrono::NaiveDate;
use rust_decimal::Decimal;

#[derive(Debug, Deserialize)]
pub struct ReportQuery {
    pub parish_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
}

pub async fn get_trial_balance(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<TrialBalance>, (StatusCode, String)> {
    if auth.role == UserRole::Viewer || (auth.role != UserRole::SuperAdmin && auth.parish_id != Some(query.parish_id)) {
        return Err((StatusCode::FORBIDDEN, "Unauthorized to view reports for this parish".to_string()));
    }

    // Get income by category
    let income_entries = sqlx::query!(
        r#"
        SELECT category as "category: String", SUM(amount) as "total!"
        FROM income_transaction 
        WHERE parish_id = $1 AND transaction_date BETWEEN $2 AND $3 AND deleted_at IS NULL
        GROUP BY category
        "#,
        query.parish_id, query.start_date, query.end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Get expenses by category
    let expense_entries = sqlx::query!(
        r#"
        SELECT category as "category: String", SUM(amount) as "total!"
        FROM expense_voucher
        WHERE parish_id = $1 AND expense_date BETWEEN $2 AND $3 AND deleted_at IS NULL AND approval_status = 'APPROVED'
        GROUP BY category
        "#,
        query.parish_id, query.start_date, query.end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut entries = Vec::new();
    let mut total_debit = Decimal::ZERO;
    let mut total_credit = Decimal::ZERO;

    // Map income to credit, expenses to debit
    for inc in income_entries {
        entries.push(TrialBalanceEntry {
            category: inc.category.clone(),
            debit: Decimal::ZERO,
            credit: inc.total,
        });
        total_credit += inc.total;
    }

    for exp in expense_entries {
        entries.push(TrialBalanceEntry {
            category: exp.category.clone(),
            debit: exp.total,
            credit: Decimal::ZERO,
        });
        total_debit += exp.total;
    }

    // Simplified Trial Balance for demo
    Ok(Json(TrialBalance {
        entries,
        total_debit,
        total_credit,
    }))
}

pub async fn get_income_expenditure(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<IncomeExpenditureStatement>, (StatusCode, String)> {
    if auth.role == UserRole::Viewer || (auth.role != UserRole::SuperAdmin && auth.parish_id != Some(query.parish_id)) {
        return Err((StatusCode::FORBIDDEN, "Unauthorized to view reports for this parish".to_string()));
    }

    // This would typically involve more complex logic, but we'll use the same queries as above
    let income_data = sqlx::query!(
        r#"
        SELECT category as "category: String", SUM(amount) as "total!"
        FROM income_transaction 
        WHERE parish_id = $1 AND transaction_date BETWEEN $2 AND $3 AND deleted_at IS NULL
        GROUP BY category
        "#,
        query.parish_id, query.start_date, query.end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let expense_data = sqlx::query!(
        r#"
        SELECT category as "category: String", SUM(amount) as "total!"
        FROM expense_voucher
        WHERE parish_id = $1 AND expense_date BETWEEN $2 AND $3 AND deleted_at IS NULL AND approval_status = 'APPROVED'
        GROUP BY category
        "#,
        query.parish_id, query.start_date, query.end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut income_entries = Vec::new();
    let mut total_income = Decimal::ZERO;
    for row in income_data {
        income_entries.push(ReportEntry {
            category: row.category.clone(),
            amount: row.total,
        });
        total_income += row.total;
    }

    let mut expenditure_entries = Vec::new();
    let mut total_expenditure = Decimal::ZERO;
    for row in expense_data {
        expenditure_entries.push(ReportEntry {
            category: row.category.clone(),
            amount: row.total,
        });
        total_expenditure += row.total;
    }

    Ok(Json(IncomeExpenditureStatement {
        income_entries,
        expenditure_entries,
        total_income,
        total_expenditure,
        net_surplus_deficit: total_income - total_expenditure,
    }))
}
