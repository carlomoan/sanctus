use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Family {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub scc_id: Option<Uuid>,
    pub family_code: String,
    pub family_name: String,
    pub head_of_family_id: Option<Uuid>,
    pub physical_address: Option<String>,
    pub postal_address: Option<String>,
    pub primary_phone: Option<String>,
    pub secondary_phone: Option<String>,
    pub email: Option<String>,
    pub notes: Option<String>,
    pub is_active: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFamilyRequest {
    pub parish_id: Uuid,
    pub scc_id: Option<Uuid>,
    pub family_code: String,
    pub family_name: String,
    pub physical_address: Option<String>,
    pub primary_phone: Option<String>,
    pub email: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFamilyRequest {
    pub scc_id: Option<Uuid>,
    pub family_name: Option<String>,
    pub head_of_family_id: Option<Uuid>,
    pub physical_address: Option<String>,
    pub postal_address: Option<String>,
    pub primary_phone: Option<String>,
    pub secondary_phone: Option<String>,
    pub email: Option<String>,
    pub notes: Option<String>,
    pub is_active: Option<bool>,
}
