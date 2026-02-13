use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq)]
#[sqlx(type_name = "user_role", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserRole {
    SuperAdmin,
    ParishAdmin,
    Accountant,
    Secretary,
    Viewer,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub parish_id: Option<Uuid>,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub full_name: String,
    pub phone_number: Option<String>,
    pub role: UserRole,
    pub profile_photo_url: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub parish_id: Option<Uuid>,
    pub username: String,
    pub email: String,
    pub full_name: String,
    pub phone_number: Option<String>,
    pub role: UserRole,
    pub profile_photo_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username_or_email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserProfile,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub parish_id: Option<Uuid>,
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub phone_number: Option<String>,
    pub role: UserRole,
}
