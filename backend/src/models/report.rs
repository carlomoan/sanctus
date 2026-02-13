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
pub struct ReportEntry {
    pub category: String,
    pub amount: Decimal,
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
pub struct BudgetVsActualEntry {
    pub category: String,
    pub budget: Decimal,
    pub actual: Decimal,
    pub variance: Decimal,
}

#[derive(Debug, Serialize)]
pub struct BudgetVsActualReport {
    pub entries: Vec<BudgetVsActualEntry>,
    pub total_budget: Decimal,
    pub total_actual: Decimal,
    pub total_variance: Decimal,
}

#[derive(Debug, Serialize)]
pub struct BalanceSheetEntry {
    pub name: String,
    pub amount: Decimal,
}

#[derive(Debug, Serialize)]
pub struct BalanceSheetSection {
    pub section_name: String,
    pub entries: Vec<BalanceSheetEntry>,
    pub total: Decimal,
}

#[derive(Debug, Serialize)]
pub struct BalanceSheet {
    pub assets: BalanceSheetSection,
    pub liabilities: BalanceSheetSection,
    pub equity: BalanceSheetSection,
}

#[derive(Debug, Serialize)]
pub struct CashFlowEntry {
    pub description: String,
    pub amount: Decimal,
}

#[derive(Debug, Serialize)]
pub struct CashFlowSection {
    pub section_name: String,
    pub entries: Vec<CashFlowEntry>,
    pub total: Decimal,
}

#[derive(Debug, Serialize)]
pub struct CashFlowStatement {
    pub sections: Vec<CashFlowSection>,
    pub net_cash_flow: Decimal,
    // For now we might assume opening balance is 0 or calculated elsewhere
    pub opening_balance: Decimal,
    pub closing_balance: Decimal,
}
