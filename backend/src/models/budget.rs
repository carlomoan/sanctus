use crate::models::transaction::TransactionCategory;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct BudgetUtilization {
    pub category: TransactionCategory,
    pub budget_amount: Decimal,
    pub actual_spent: Decimal,
    pub remaining: Decimal,
    pub utilization_percentage: f64,
    pub fiscal_year: i32,
    pub fiscal_month: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BudgetPerformance {
    pub total_budget: Decimal,
    pub total_spent: Decimal,
    pub total_remaining: Decimal,
    pub overall_utilization: f64,
    pub categories: Vec<BudgetUtilization>,
    pub fiscal_year: i32,
}
