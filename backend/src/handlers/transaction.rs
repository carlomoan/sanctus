use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::transaction::{IncomeTransaction, ExpenseVoucher, TransactionCategory, PaymentMethod}, handlers::auth::AuthUser};
use serde::Deserialize;
use rust_decimal::Decimal;
use chrono::NaiveDate;

#[derive(Debug, Deserialize)]
pub struct ListTransactionsQuery {
    pub parish_id: Option<Uuid>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateIncomeRequest {
    pub parish_id: Uuid,
    pub member_id: Option<Uuid>,
    pub category: TransactionCategory,
    pub amount: Decimal,
    pub payment_method: PaymentMethod,
    pub transaction_date: NaiveDate,
    pub description: Option<String>,
    pub reference_number: Option<String>,
    pub received_by: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CreateExpenseRequest {
    pub parish_id: Uuid,
    pub category: TransactionCategory,
    pub amount: Decimal,
    pub payment_method: PaymentMethod,
    pub payee_name: String,
    pub payee_phone: Option<String>,
    pub expense_date: NaiveDate,
    pub description: String,
    pub reference_number: Option<String>,
    pub requested_by: Uuid,
}

// Income Transactions Handlers

pub async fn list_income_transactions(
    _auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ListTransactionsQuery>,
) -> Result<Json<Vec<IncomeTransaction>>, (StatusCode, String)> {
    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let transactions = if let Some(parish_id) = query.parish_id {
        sqlx::query_as::<_, IncomeTransaction>(
            "SELECT * FROM income_transaction WHERE parish_id = $1 AND deleted_at IS NULL ORDER BY transaction_date DESC LIMIT $2 OFFSET $3"
        )
        .bind(parish_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as::<_, IncomeTransaction>(
            "SELECT * FROM income_transaction WHERE deleted_at IS NULL ORDER BY transaction_date DESC LIMIT $1 OFFSET $2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    };

    let transactions = transactions.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(transactions))
}

pub async fn create_income_transaction(
    _auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateIncomeRequest>,
) -> Result<Json<IncomeTransaction>, (StatusCode, String)> {
    // Note: transaction_number generation is handled by DB trigger
    let transaction = sqlx::query_as::<_, IncomeTransaction>(
        r#"
        INSERT INTO income_transaction (
            parish_id, member_id, category, amount, payment_method,
            transaction_date, description, reference_number, received_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#
    )
    .bind(payload.parish_id)
    .bind(payload.member_id)
    .bind(payload.category)
    .bind(payload.amount)
    .bind(payload.payment_method)
    .bind(payload.transaction_date)
    .bind(payload.description)
    .bind(payload.reference_number)
    .bind(payload.received_by)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(transaction))
}

// Expense Vouchers Handlers

pub async fn list_expense_vouchers(
    _auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ListTransactionsQuery>,
) -> Result<Json<Vec<ExpenseVoucher>>, (StatusCode, String)> {
    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let vouchers = if let Some(parish_id) = query.parish_id {
        sqlx::query_as::<_, ExpenseVoucher>(
            "SELECT * FROM expense_voucher WHERE parish_id = $1 AND deleted_at IS NULL ORDER BY expense_date DESC LIMIT $2 OFFSET $3"
        )
        .bind(parish_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as::<_, ExpenseVoucher>(
            "SELECT * FROM expense_voucher WHERE deleted_at IS NULL ORDER BY expense_date DESC LIMIT $1 OFFSET $2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    };

    let vouchers = vouchers.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(vouchers))
}

pub async fn create_expense_voucher(
    _auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateExpenseRequest>,
) -> Result<Json<ExpenseVoucher>, (StatusCode, String)> {
    // Note: voucher_number generation is handled by DB trigger
    // Default approval_status is 'PENDING' handled by DB default
    let voucher = sqlx::query_as::<_, ExpenseVoucher>(
        r#"
        INSERT INTO expense_voucher (
            parish_id, category, amount, payment_method,
            payee_name, payee_phone, expense_date, description,
            reference_number, requested_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        "#
    )
    .bind(payload.parish_id)
    .bind(payload.category)
    .bind(payload.amount)
    .bind(payload.payment_method)
    .bind(payload.payee_name)
    .bind(payload.payee_phone)
    .bind(payload.expense_date)
    .bind(payload.description)
    .bind(payload.reference_number)
    .bind(payload.requested_by)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(voucher))
}

pub async fn get_income_transaction(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<IncomeTransaction>, (StatusCode, String)> {
    let transaction = sqlx::query_as::<_, IncomeTransaction>(
        "SELECT * FROM income_transaction WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Transaction not found".to_string()))?;

    Ok(Json(transaction))
}

pub async fn get_expense_voucher(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ExpenseVoucher>, (StatusCode, String)> {
    let voucher = sqlx::query_as::<_, ExpenseVoucher>(
        "SELECT * FROM expense_voucher WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Voucher not found".to_string()))?;

    Ok(Json(voucher))
}
