use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AppSetting {
    pub id: Uuid,
    pub parish_id: Option<Uuid>,
    pub setting_key: String,
    pub setting_value: String,
    pub setting_group: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSettingRequest {
    pub parish_id: Option<Uuid>,
    pub setting_key: String,
    pub setting_value: String,
    pub setting_group: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkUpsertSettingsRequest {
    pub settings: Vec<UpsertSettingRequest>,
}
