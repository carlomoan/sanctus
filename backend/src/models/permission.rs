use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Permission {
    pub id: Uuid,
    pub permission_key: String,
    pub permission_group: String,
    pub display_name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct CustomRole {
    pub id: Uuid,
    pub role_name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct RolePermission {
    pub id: Uuid,
    pub role_id: Uuid,
    pub permission_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct UserPermissionOverride {
    pub id: Uuid,
    pub user_id: Uuid,
    pub permission_id: Uuid,
    pub granted_by: Uuid,
    pub reason: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

// --- Request types ---

#[derive(Debug, Deserialize)]
pub struct CreateRoleRequest {
    pub role_name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub permission_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRoleRequest {
    pub display_name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AssignPermissionsRequest {
    pub permission_ids: Vec<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct GrantUserOverrideRequest {
    pub user_id: Uuid,
    pub permission_ids: Vec<Uuid>,
    pub reason: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct RevokeUserOverrideRequest {
    pub user_id: Uuid,
    pub permission_ids: Vec<Uuid>,
}

// --- Response types ---

#[derive(Debug, Serialize)]
pub struct RoleWithPermissions {
    pub id: Uuid,
    pub role_name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub is_system: bool,
    pub permissions: Vec<Permission>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct UserOverrideInfo {
    pub id: Uuid,
    pub user_id: Uuid,
    pub permission_key: String,
    pub permission_display_name: String,
    pub granted_by: Uuid,
    pub reason: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}
