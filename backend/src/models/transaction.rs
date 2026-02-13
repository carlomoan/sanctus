use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{NaiveDate, DateTime, Utc, NaiveTime};
use rust_decimal::Decimal;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "transaction_category", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TransactionCategory {
    Tithe,
    Offertory,
    Thanksgiving,
    Donation,
    Fundraising,
    MassOffering,
    WeddingFee,
    BaptismFee,
    FuneralFee,
    CertificateFee,
    RentIncome,
    InvestmentIncome,
    OtherIncome,
    SalaryExpense,
    UtilitiesExpense,
    MaintenanceExpense,
    SuppliesExpense,
    DiocesanLevy,
    CharityExpense,
    ConstructionExpense,
    OtherExpense,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "payment_method", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PaymentMethod {
    Cash,
    Cheque,
    BankTransfer,
    Mpesa,
    TigoPesa,
    AirtelMoney,
    Halopesa,
    CreditCard,
    Other,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "approval_status", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
    Cancelled,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct IncomeTransaction {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub member_id: Option<Uuid>,
    pub family_id: Option<Uuid>,
    pub transaction_number: String,
    pub category: TransactionCategory,
    pub amount: Decimal,
    pub payment_method: PaymentMethod,
    pub transaction_date: NaiveDate,
    pub transaction_time: Option<NaiveTime>,
    pub description: Option<String>,
    pub reference_number: Option<String>,
    pub received_by: Option<Uuid>,
    pub receipt_printed: Option<bool>,
    pub receipt_printed_at: Option<DateTime<Utc>>,
    pub is_synced: Option<bool>,
    pub synced_at: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ExpenseVoucher {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub voucher_number: String,
    pub category: TransactionCategory,
    pub amount: Decimal,
    pub payment_method: PaymentMethod,
    pub payee_name: String,
    pub payee_phone: Option<String>,
    pub expense_date: NaiveDate,
    pub description: String,
    pub reference_number: Option<String>,
    pub approval_status: Option<ApprovalStatus>,
    pub requested_by: Uuid,
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub paid: Option<bool>,
    pub paid_at: Option<DateTime<Utc>>,
    pub is_synced: Option<bool>,
    pub synced_at: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

