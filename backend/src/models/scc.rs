use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveTime};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Scc {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub cluster_id: Option<Uuid>,
    pub scc_code: String,
    pub scc_name: String,
    pub patron_saint: Option<String>,
    pub leader_name: Option<String>,
    pub location_description: Option<String>,
    pub meeting_day: Option<String>,
    pub meeting_time: Option<NaiveTime>,
    pub is_active: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSccRequest {
    pub parish_id: Uuid,
    pub cluster_id: Option<Uuid>,
    pub scc_code: String,
    pub scc_name: String,
    pub patron_saint: Option<String>,
    pub leader_name: Option<String>,
    pub location_description: Option<String>,
    pub meeting_day: Option<String>,
    pub meeting_time: Option<NaiveTime>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSccRequest {
    pub cluster_id: Option<Uuid>,
    pub scc_name: Option<String>,
    pub patron_saint: Option<String>,
    pub leader_name: Option<String>,
    pub location_description: Option<String>,
    pub meeting_day: Option<String>,
    pub meeting_time: Option<NaiveTime>,
    pub is_active: Option<bool>,
}
