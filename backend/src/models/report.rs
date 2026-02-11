use serde::Serialize;
use rust_decimal::Decimal;

#[derive(Debug, Serialize)]
pub struct TrialBalanceEntry {
    pub category: String,
    pub debit: Decimal,
    pub credit: Decimal,
}

#[derive(Debug, Serialize)]
pub struct TrialBalance {
    pub entries: Vec<TrialBalanceEntry>,
    pub total_debit: Decimal,
    pub total_credit: Decimal,
}

#[derive(Debug, Serialize)]
pub struct IncomeExpenditureStatement {
    pub income_entries: Vec<ReportEntry>,
    pub expenditure_entries: Vec<ReportEntry>,
    pub total_income: Decimal,
    pub total_expenditure: Decimal,
    pub net_surplus_deficit: Decimal,
}

#[derive(Debug, Serialize)]
pub struct ReportEntry {
    pub category: String,
    pub amount: Decimal,
}
