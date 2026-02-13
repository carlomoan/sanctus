use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Cluster {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub cluster_code: String,
    pub cluster_name: String,
    pub location_description: Option<String>,
    pub leader_name: Option<String>,
    pub is_active: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateClusterRequest {
    pub parish_id: Uuid,
    pub cluster_code: String,
    pub cluster_name: String,
    pub location_description: Option<String>,
    pub leader_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateClusterRequest {
    pub cluster_name: Option<String>,
    pub location_description: Option<String>,
    pub leader_name: Option<String>,
    pub is_active: Option<bool>,
}
