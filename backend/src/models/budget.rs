use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use rust_decimal::Decimal;
use crate::models::transaction::TransactionCategory;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Budget {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub category: TransactionCategory,
    pub amount: Decimal,
    pub fiscal_year: i32,
    pub fiscal_month: Option<i32>,
    pub description: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBudgetRequest {
    pub parish_id: Uuid,
    pub category: TransactionCategory,
    pub amount: Decimal,
    pub fiscal_year: i32,
    pub fiscal_month: Option<i32>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBudgetRequest {
    pub amount: Option<Decimal>,
    pub description: Option<String>,
}
