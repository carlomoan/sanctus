use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NotificationType {
    Sms,
    Email,
    InApp,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NotificationStatus {
    Pending,
    Sent,
    Failed,
    Delivered,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub notification_type: NotificationType,
    pub recipient: String,
    pub subject: String,
    pub message: String,
    pub status: NotificationStatus,
    pub sent_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub reference_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SendSmsRequest {
    pub recipient: String,
    pub message: String,
    pub parish_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct BulkSendSmsRequest {
    pub recipients: Vec<String>,
    pub message: String,
    pub parish_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct SmsResponse {
    pub success: bool,
    pub message_id: String,
    pub recipient: String,
    pub status: String,
    pub cost: Option<String>,
}
