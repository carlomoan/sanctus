use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{NaiveDate, DateTime, Utc};
use rust_decimal::Decimal;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Parish {
    pub id: Uuid,
    pub diocese_id: Uuid,
    pub parish_code: String,
    pub parish_name: String,
    pub patron_saint: Option<String>,
    pub priest_name: Option<String>,
    pub priest_id: Option<Uuid>,
    pub established_date: Option<NaiveDate>,
    pub physical_address: Option<String>,
    pub postal_address: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub bank_account_name: Option<String>,
    pub bank_account_number: Option<String>,
    pub bank_name: Option<String>,
    pub bank_branch: Option<String>,
    pub mobile_money_name: Option<String>,
    pub mobile_money_number: Option<String>,
    pub mobile_money_account_name: Option<String>,
    pub latitude: Option<Decimal>,
    pub longitude: Option<Decimal>,
    pub timezone: Option<String>,
    pub logo_url: Option<String>,
    pub is_active: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateParishRequest {
    pub diocese_id: Uuid,
    pub parish_code: String,
    pub parish_name: String,
    pub patron_saint: Option<String>,
    pub priest_name: Option<String>,
    pub priest_id: Option<Uuid>,
    pub established_date: Option<NaiveDate>,
    pub physical_address: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateParishRequest {
    pub parish_name: Option<String>,
    pub patron_saint: Option<String>,
    pub priest_name: Option<String>,
    pub priest_id: Option<Uuid>,
    pub physical_address: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub is_active: Option<bool>,
}
