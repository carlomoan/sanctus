use crate::{
    handlers::auth::AuthUser,
    handlers::rbac,
    models::announcement::{
        Announcement, AnnouncementListResponse, CreateAnnouncementRequest,
        UpdateAnnouncementRequest,
    },
    AppState,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug, serde::Deserialize)]
pub struct AnnouncementQuery {
    pub scope: Option<String>,
    pub status: Option<String>,
    pub announcement_type: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

// ============================================================================
// Announcement Management
// ============================================================================

pub async fn list_announcements(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<AnnouncementQuery>,
) -> Result<Json<AnnouncementListResponse>, (StatusCode, String)> {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(20).min(100);
    let offset = (page - 1) * page_size;

    let mut sql_builder =
        sqlx::QueryBuilder::new("SELECT * FROM announcements WHERE deleted_at IS NULL");

    // Handle SAAS hierarchy logic
    match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            // SuperAdmin can see all announcements
        }
        _ => {
            // Other roles can only see their parish announcements
            if let Some(parish_id) = auth.parish_id {
                sql_builder.push(" AND parish_id = ");
                sql_builder.push_bind(parish_id);
            }
        }
    }

    // Apply filters
    if let Some(scope) = &query.scope {
        sql_builder.push(" AND scope = ");
        sql_builder.push_bind(scope);
    }
    if let Some(status) = &query.status {
        sql_builder.push(" AND status = ");
        sql_builder.push_bind(status);
    }
    if let Some(announcement_type) = &query.announcement_type {
        sql_builder.push(" AND announcement_type = ");
        sql_builder.push_bind(announcement_type);
    }

    // Get total count
    let count_query = sql_builder.sql().replace("SELECT *", "SELECT COUNT(*)");
    let total: i64 = sqlx::query_scalar(&count_query)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Add ordering and pagination
    sql_builder.push(" ORDER BY created_at DESC LIMIT ");
    sql_builder.push_bind(page_size);
    sql_builder.push(" OFFSET ");
    sql_builder.push_bind(offset);

    let announcements: Vec<Announcement> = sql_builder
        .build_query_as()
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(AnnouncementListResponse {
        announcements,
        total,
        page,
        page_size,
    }))
}

pub async fn get_announcement(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Announcement>, (StatusCode, String)> {
    let announcement = sqlx::query_as::<_, Announcement>(
        "SELECT * FROM announcements WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    match announcement {
        Some(ann) => {
            // Check permissions based on scope
            match auth.role {
                crate::models::user::UserRole::SuperAdmin => {
                    // SuperAdmin can view all
                }
                crate::models::user::UserRole::ParishAdmin => {
                    if let Some(parish_id) = auth.parish_id {
                        if ann.scope == "PARISH" && ann.parish_id != Some(parish_id) {
                            return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
                        }
                    }
                }
                _ => {
                    if let Some(parish_id) = auth.parish_id {
                        if ann.parish_id != Some(parish_id) {
                            return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
                        }
                    } else {
                        return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
                    }
                }
            }

            // Increment view count
            sqlx::query("UPDATE announcements SET view_count = view_count + 1 WHERE id = $1")
                .bind(id)
                .execute(&state.db)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            Ok(Json(ann))
        }
        None => Err((StatusCode::NOT_FOUND, "Announcement not found".to_string())),
    }
}

pub async fn create_announcement(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(req): Json<CreateAnnouncementRequest>,
) -> Result<Json<Announcement>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let parish_id = match req.scope.as_str() {
        "PARISH" => auth.parish_id,
        _ => None,
    };
    let diocese_id: Option<Uuid> = None;

    let id = Uuid::new_v4();
    let now = Utc::now();

    let announcement = sqlx::query_as::<_, Announcement>(
        r#"
        INSERT INTO announcements (
            id, diocese_id, parish_id, title, content, announcement_type,
            scope, priority, status, author_id, author_name,
            publish_date, expiry_date, target_audience, attachment_url,
            view_count, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(diocese_id)
    .bind(parish_id)
    .bind(&req.title)
    .bind(&req.content)
    .bind(&req.announcement_type)
    .bind(&req.scope)
    .bind(&req.priority)
    .bind("DRAFT")
    .bind(auth.user_id)
    .bind("Admin")
    .bind(req.publish_date)
    .bind(req.expiry_date)
    .bind(&req.target_audience)
    .bind(&req.attachment_url)
    .bind(0)
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(announcement))
}

pub async fn update_announcement(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateAnnouncementRequest>,
) -> Result<Json<Announcement>, (StatusCode, String)> {
    // Check permissions
    rbac::require_admin(&auth)?;

    // Get existing announcement
    let existing = sqlx::query_as::<_, Announcement>(
        "SELECT * FROM announcements WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let existing = existing.ok_or((StatusCode::NOT_FOUND, "Announcement not found".to_string()))?;

    // Check ownership
    match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            // SuperAdmin can edit all
        }
        _ => {
            if existing.parish_id != auth.parish_id {
                return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
            }
        }
    }

    // Build dynamic update query
    let mut updates = Vec::new();
    let mut param_count = 1;

    if req.title.is_some() {
        updates.push(format!("title = ${}", param_count));
        param_count += 1;
    }
    if req.content.is_some() {
        updates.push(format!("content = ${}", param_count));
        param_count += 1;
    }
    if req.announcement_type.is_some() {
        updates.push(format!("announcement_type = ${}", param_count));
        param_count += 1;
    }
    if req.scope.is_some() {
        updates.push(format!("scope = ${}", param_count));
        param_count += 1;
    }
    if req.priority.is_some() {
        updates.push(format!("priority = ${}", param_count));
        param_count += 1;
    }
    if req.status.is_some() {
        updates.push(format!("status = ${}", param_count));
        param_count += 1;
    }
    if req.target_audience.is_some() {
        updates.push(format!("target_audience = ${}", param_count));
        param_count += 1;
    }
    if req.attachment_url.is_some() {
        updates.push(format!("attachment_url = ${}", param_count));
        param_count += 1;
    }
    if req.publish_date.is_some() {
        updates.push(format!("publish_date = ${}", param_count));
        param_count += 1;
    }
    if req.expiry_date.is_some() {
        updates.push(format!("expiry_date = ${}", param_count));
        param_count += 1;
    }

    updates.push(format!("updated_at = ${}", param_count));

    let query_str = format!(
        "UPDATE announcements SET {} WHERE id = ${} RETURNING *",
        updates.join(", "),
        param_count + 1
    );

    let mut query = sqlx::query_as::<_, Announcement>(&query_str);

    if let Some(title) = req.title {
        query = query.bind(title);
    }
    if let Some(content) = req.content {
        query = query.bind(content);
    }
    if let Some(announcement_type) = req.announcement_type {
        query = query.bind(announcement_type);
    }
    if let Some(scope) = req.scope {
        query = query.bind(scope);
    }
    if let Some(priority) = req.priority {
        query = query.bind(priority);
    }
    if let Some(status) = req.status {
        query = query.bind(status);
    }
    if let Some(target_audience) = req.target_audience {
        query = query.bind(target_audience);
    }
    if let Some(attachment_url) = req.attachment_url {
        query = query.bind(attachment_url);
    }
    if let Some(publish_date) = req.publish_date {
        query = query.bind(publish_date);
    }
    if let Some(expiry_date) = req.expiry_date {
        query = query.bind(expiry_date);
    }

    query = query.bind(Utc::now()).bind(id);

    let announcement = query
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(announcement))
}

pub async fn delete_announcement(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Check permissions
    rbac::require_admin(&auth)?;

    // Get existing announcement
    let existing = sqlx::query_as::<_, Announcement>(
        "SELECT * FROM announcements WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let existing = existing.ok_or((StatusCode::NOT_FOUND, "Announcement not found".to_string()))?;

    // Check ownership
    match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            // SuperAdmin can delete all
        }
        _ => {
            if existing.parish_id != auth.parish_id {
                return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
            }
        }
    }

    sqlx::query("UPDATE announcements SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn publish_announcement(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Announcement>, (StatusCode, String)> {
    // Check permissions
    rbac::require_admin(&auth)?;

    // Get existing announcement
    let existing = sqlx::query_as::<_, Announcement>(
        "SELECT * FROM announcements WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let existing = existing.ok_or((StatusCode::NOT_FOUND, "Announcement not found".to_string()))?;

    // Check ownership
    match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            // SuperAdmin can publish all
        }
        _ => {
            if existing.parish_id != auth.parish_id {
                return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
            }
        }
    }

    let announcement = sqlx::query_as::<_, Announcement>(
        r#"
        UPDATE announcements
        SET status = 'PUBLISHED', publish_date = COALESCE(publish_date, NOW()), updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(announcement))
}
