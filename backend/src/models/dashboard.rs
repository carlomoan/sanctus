use rust_decimal::Decimal;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub total_members: i64,
    pub active_parishes: i64,
    pub total_families: i64,
    pub total_clusters: i64,
    pub total_income: Decimal,
    pub total_expenses: Decimal,
    pub pending_approvals: i64,
}
