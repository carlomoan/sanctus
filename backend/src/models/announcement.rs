use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Announcement {
    pub id: Uuid,
    pub diocese_id: Option<Uuid>,
    pub parish_id: Option<Uuid>,
    pub title: String,
    pub content: String,
    pub announcement_type: String,
    pub scope: String,
    pub priority: String,
    pub status: String,
    pub author_id: Option<Uuid>,
    pub author_name: Option<String>,
    pub publish_date: Option<DateTime<Utc>>,
    pub expiry_date: Option<DateTime<Utc>>,
    pub target_audience: Option<String>,
    pub attachment_url: Option<String>,
    pub view_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAnnouncementRequest {
    pub title: String,
    pub content: String,
    pub announcement_type: String,
    pub scope: String,
    pub priority: String,
    pub target_audience: Option<String>,
    pub attachment_url: Option<String>,
    pub publish_date: Option<DateTime<Utc>>,
    pub expiry_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAnnouncementRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub announcement_type: Option<String>,
    pub scope: Option<String>,
    pub priority: Option<String>,
    pub status: Option<String>,
    pub target_audience: Option<String>,
    pub attachment_url: Option<String>,
    pub publish_date: Option<DateTime<Utc>>,
    pub expiry_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnnouncementListResponse {
    pub announcements: Vec<Announcement>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
}
