use serde::Serialize;
use rust_decimal::Decimal;

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub total_members: i64,
    pub active_parishes: i64,
    pub total_income: Decimal,
    pub total_expenses: Decimal,
    pub pending_approvals: i64,
}
