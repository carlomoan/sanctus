use crate::{
    handlers::auth::AuthUser,
    handlers::rbac,
    models::notification::{
        BulkSendSmsRequest, Notification, NotificationStatus, NotificationType, SendSmsRequest,
        SmsResponse,
    },
    AppState,
};
use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct NotificationQuery {
    pub parish_id: Option<Uuid>,
    pub notification_type: Option<String>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

// Africa's Talking API client
struct AfricaTalkingClient {
    api_key: String,
    username: String,
    sender_id: Option<String>,
}

impl AfricaTalkingClient {
    fn new(api_key: String, username: String, sender_id: Option<String>) -> Self {
        Self {
            api_key,
            username,
            sender_id,
        }
    }

    async fn send_sms(&self, recipient: &str, message: &str) -> Result<SmsResponse, String> {
        let client = reqwest::Client::new();

        let mut params = vec![
            ("username", self.username.clone()),
            ("to", recipient.to_string()),
            ("message", message.to_string()),
        ];

        if let Some(sender_id) = &self.sender_id {
            params.push(("from", sender_id.clone()));
        }

        let response = client
            .post("https://api.africastalking.com/version1/messaging")
            .header("apiKey", &self.api_key)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to send SMS: {}", e))?;

        if response.status().is_success() {
            Ok(SmsResponse {
                success: true,
                message_id: Uuid::new_v4().to_string(),
                recipient: recipient.to_string(),
                status: "SENT".to_string(),
                cost: None,
            })
        } else {
            Err(format!(
                "SMS sending failed with status: {}",
                response.status()
            ))
        }
    }
}

// ============================================================================
// Notification Management
// ============================================================================

pub async fn list_notifications(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<NotificationQuery>,
) -> Result<Json<Vec<Notification>>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let parish_id = match auth.role {
        crate::models::user::UserRole::SuperAdmin => query.parish_id.or(auth.parish_id),
        _ => auth.parish_id,
    };

    let parish_id = parish_id.ok_or((StatusCode::BAD_REQUEST, "Parish ID required".to_string()))?;

    let mut sql_builder = sqlx::QueryBuilder::new(
        "SELECT * FROM notifications WHERE parish_id = $1 AND deleted_at IS NULL",
    );

    if let Some(notification_type) = &query.notification_type {
        sql_builder.push(" AND notification_type = ");
        sql_builder.push_bind(notification_type);
    }
    if let Some(status) = &query.status {
        sql_builder.push(" AND status = ");
        sql_builder.push_bind(status);
    }

    sql_builder.push(" ORDER BY created_at DESC");

    let notifications: Vec<Notification> = sql_builder
        .build_query_as()
        .bind(parish_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(notifications))
}

pub async fn send_sms(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(req): Json<SendSmsRequest>,
) -> Result<Json<SmsResponse>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let parish_id = match auth.role {
        crate::models::user::UserRole::SuperAdmin => req.parish_id,
        _ => auth
            .parish_id
            .ok_or((StatusCode::BAD_REQUEST, "No parish assigned".to_string()))?,
    };

    // Get Africa's Talking credentials from environment or settings
    let api_key =
        std::env::var("AFRICASTALKING_API_KEY").unwrap_or_else(|_| "sandbox_api_key".to_string());
    let username =
        std::env::var("AFRICASTALKING_USERNAME").unwrap_or_else(|_| "sandbox".to_string());
    let sender_id = std::env::var("AFRICASTALKING_SENDER_ID").ok();

    let client = AfricaTalkingClient::new(api_key, username, sender_id);

    let sms_result = client.send_sms(&req.recipient, &req.message).await;

    let (status, reference_id, error_message) = match &sms_result {
        Ok(response) => (
            NotificationStatus::Sent,
            Some(response.message_id.clone()),
            None,
        ),
        Err(e) => (NotificationStatus::Failed, None, Some(e.clone())),
    };

    // Save notification record
    let notification_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO notifications (
            id, parish_id, notification_type, recipient, subject, message,
            status, sent_at, error_message, reference_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        "#,
    )
    .bind(notification_id)
    .bind(parish_id)
    .bind(NotificationType::Sms)
    .bind(&req.recipient)
    .bind("SMS")
    .bind(&req.message)
    .bind(&status)
    .bind(chrono::Utc::now())
    .bind(&error_message)
    .bind(&reference_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    match sms_result {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn bulk_send_sms(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(req): Json<BulkSendSmsRequest>,
) -> Result<Json<Vec<SmsResponse>>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let parish_id = match auth.role {
        crate::models::user::UserRole::SuperAdmin => req.parish_id,
        _ => auth
            .parish_id
            .ok_or((StatusCode::BAD_REQUEST, "No parish assigned".to_string()))?,
    };

    let mut results = Vec::new();

    for recipient in &req.recipients {
        let sms_req = SendSmsRequest {
            recipient: recipient.clone(),
            message: req.message.clone(),
            parish_id,
        };

        match send_sms(auth.clone(), State(state.clone()), Json(sms_req)).await {
            Ok(Json(response)) => results.push(response),
            Err(_) => {
                results.push(SmsResponse {
                    success: false,
                    message_id: Uuid::new_v4().to_string(),
                    recipient: recipient.clone(),
                    status: "FAILED".to_string(),
                    cost: None,
                });
            }
        }
    }

    Ok(Json(results))
}
