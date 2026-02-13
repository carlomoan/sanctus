use axum::{
    extract::{State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{AppState, models::report::{
    TrialBalance, TrialBalanceEntry, IncomeExpenditureStatement, ReportEntry,
    BudgetVsActualReport, BudgetVsActualEntry, BalanceSheet, BalanceSheetSection,
    BalanceSheetEntry, CashFlowStatement, CashFlowSection, CashFlowEntry
}, handlers::auth::AuthUser, handlers::rbac};
use serde::Deserialize;
use chrono::{NaiveDate, Datelike};
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
    let parish_id = rbac::resolve_parish_id(&auth, Some(query.parish_id))?;

    let income_entries = sqlx::query!(
        r#"
        SELECT category as "category: String", SUM(amount) as "total!"
        FROM income_transaction 
        WHERE parish_id = $1 AND transaction_date BETWEEN $2 AND $3 AND deleted_at IS NULL
        GROUP BY category
        "#,
        parish_id, query.start_date, query.end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let expense_entries = sqlx::query!(
        r#"
        SELECT category as "category: String", SUM(amount) as "total!"
        FROM expense_voucher
        WHERE parish_id = $1 AND expense_date BETWEEN $2 AND $3 AND deleted_at IS NULL AND approval_status = 'APPROVED'
        GROUP BY category
        "#,
        parish_id, query.start_date, query.end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut entries = Vec::new();
    let mut total_debit = Decimal::ZERO;
    let mut total_credit = Decimal::ZERO;

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
    let parish_id = rbac::resolve_parish_id(&auth, Some(query.parish_id))?;

    let income_data = sqlx::query!(
        r#"
        SELECT category as "category: String", SUM(amount) as "total!"
        FROM income_transaction 
        WHERE parish_id = $1 AND transaction_date BETWEEN $2 AND $3 AND deleted_at IS NULL
        GROUP BY category
        "#,
        parish_id, query.start_date, query.end_date
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
        parish_id, query.start_date, query.end_date
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

pub async fn get_budget_vs_actual(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<BudgetVsActualReport>, (StatusCode, String)> {
    let parish_id = rbac::resolve_parish_id(&auth, Some(query.parish_id))?;

    let year = query.start_date.year();
    let budgets = sqlx::query!(
        r#"
        SELECT category as "category: String", SUM(amount) as "total!"
        FROM budget
        WHERE parish_id = $1 AND fiscal_year = $2 AND deleted_at IS NULL
        GROUP BY category
        "#,
        parish_id, year
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let income = sqlx::query!(
        r#"SELECT category as "category: String", SUM(amount) as "total!"
           FROM income_transaction 
           WHERE parish_id = $1 AND transaction_date BETWEEN $2 AND $3 AND deleted_at IS NULL
           GROUP BY category"#,
        parish_id, query.start_date, query.end_date
    ).fetch_all(&state.db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let expenses = sqlx::query!(
        r#"SELECT category as "category: String", SUM(amount) as "total!"
           FROM expense_voucher
           WHERE parish_id = $1 AND expense_date BETWEEN $2 AND $3 AND deleted_at IS NULL AND approval_status = 'APPROVED'
           GROUP BY category"#,
        parish_id, query.start_date, query.end_date
    ).fetch_all(&state.db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Merge
    use std::collections::HashMap;
    let mut map: HashMap<String, (Decimal, Decimal)> = HashMap::new(); // Category -> (Budget, Actual)

    for b in budgets { map.insert(b.category, (b.total, Decimal::ZERO)); }
    for i in income { 
        let entry = map.entry(i.category).or_insert((Decimal::ZERO, Decimal::ZERO));
        entry.1 += i.total;
    }
    for e in expenses {
        let entry = map.entry(e.category).or_insert((Decimal::ZERO, Decimal::ZERO));
        entry.1 += e.total; // Actual spending
    }

    let mut entries = Vec::new();
    let mut total_budget = Decimal::ZERO;
    let mut total_actual = Decimal::ZERO;

    for (cat, (bud, act)) in map {
        entries.push(BudgetVsActualEntry {
            category: cat,
            budget: bud,
            actual: act,
            variance: bud - act, // Positive variance means under budget (good for expenses) or under revenue (bad for income) - simplified here
        });
        total_budget += bud;
        total_actual += act;
    }

    Ok(Json(BudgetVsActualReport {
        entries,
        total_budget,
        total_actual,
        total_variance: total_budget - total_actual,
    }))
}

pub async fn get_balance_sheet(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<BalanceSheet>, (StatusCode, String)> {
    let parish_id = rbac::resolve_parish_id(&auth, Some(query.parish_id))?;

    let total_income = sqlx::query!(
        r#"SELECT COALESCE(SUM(amount), 0) as "total!" FROM income_transaction 
           WHERE parish_id = $1 AND transaction_date <= $2 AND deleted_at IS NULL"#,
        parish_id, query.end_date
    ).fetch_one(&state.db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?.total;

    let total_paid_expenses = sqlx::query!(
        r#"SELECT COALESCE(SUM(amount), 0) as "total!" FROM expense_voucher
           WHERE parish_id = $1 AND expense_date <= $2 AND paid = TRUE AND deleted_at IS NULL"#,
        parish_id, query.end_date
    ).fetch_one(&state.db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?.total;

    let cash_on_hand = total_income - total_paid_expenses;

    let unpaid_expenses = sqlx::query!(
        r#"SELECT COALESCE(SUM(amount), 0) as "total!" FROM expense_voucher
           WHERE parish_id = $1 AND approval_status = 'APPROVED' AND paid = FALSE AND deleted_at IS NULL"#,
        parish_id
    ).fetch_one(&state.db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?.total;

    let assets = BalanceSheetSection {
        section_name: "Assets".to_string(),
        entries: vec![BalanceSheetEntry { name: "Cash on Hand".to_string(), amount: cash_on_hand }],
        total: cash_on_hand,
    };

    let liabilities = BalanceSheetSection {
        section_name: "Liabilities".to_string(),
        entries: vec![BalanceSheetEntry { name: "Accounts Payable".to_string(), amount: unpaid_expenses }],
        total: unpaid_expenses,
    };

    let equity_amount = cash_on_hand - unpaid_expenses;
    let equity = BalanceSheetSection {
        section_name: "Equity".to_string(),
        entries: vec![BalanceSheetEntry { name: "Net Assets".to_string(), amount: equity_amount }],
        total: equity_amount,
    };

    Ok(Json(BalanceSheet { assets, liabilities, equity }))
}

pub async fn get_cash_flow(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<ReportQuery>,
) -> Result<Json<CashFlowStatement>, (StatusCode, String)> {
    let parish_id = rbac::resolve_parish_id(&auth, Some(query.parish_id))?;

    let income_sum = sqlx::query!(
        r#"SELECT COALESCE(SUM(amount), 0) as "total!" FROM income_transaction 
           WHERE parish_id = $1 AND transaction_date BETWEEN $2 AND $3 AND deleted_at IS NULL"#,
        parish_id, query.start_date, query.end_date
    ).fetch_one(&state.db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?.total;

    let expense_sum = sqlx::query!(
        r#"SELECT COALESCE(SUM(amount), 0) as "total!" FROM expense_voucher
           WHERE parish_id = $1 AND expense_date BETWEEN $2 AND $3 AND paid = TRUE AND deleted_at IS NULL"#,
        parish_id, query.start_date, query.end_date
    ).fetch_one(&state.db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?.total;

    let operating = CashFlowSection {
        section_name: "Operating Activities".to_string(),
        entries: vec![
            CashFlowEntry { description: "Cash Receipts from Donors".to_string(), amount: income_sum },
            CashFlowEntry { description: "Cash Paid for Expenses".to_string(), amount: -expense_sum },
        ],
        total: income_sum - expense_sum,
    };

    Ok(Json(CashFlowStatement {
        sections: vec![operating],
        net_cash_flow: income_sum - expense_sum,
        opening_balance: Decimal::ZERO, // Need proper accounting period close logic for this
        closing_balance: income_sum - expense_sum,
    }))
}
