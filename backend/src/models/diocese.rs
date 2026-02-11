use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{NaiveDate, DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Diocese {
    pub id: Uuid,
    pub diocese_code: String,
    pub diocese_name: String,
    pub bishop_name: Option<String>,
    pub established_date: Option<NaiveDate>,
    pub headquarters_address: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub country: Option<String>,
    pub currency_code: Option<String>,
    pub logo_url: Option<String>,
    pub is_active: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}
