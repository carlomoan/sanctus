// backend/src/handlers/setting.rs — COMPLETE FINAL VERSION
// Fix: Uses WHERE clause conflict target for diocese rows (partial index)

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{handlers::auth::AuthUser, models::user::UserRole, AppState};

// ── Types ─────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct ListSettingsQuery {
    pub parish_id: Option<Uuid>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SettingRow {
    pub id: Uuid,
    pub parish_id: Option<Uuid>,
    pub setting_key: String,
    pub setting_value: String,
    pub setting_group: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpsertSettingRequest {
    pub parish_id: Option<Uuid>,
    pub setting_key: String,
    pub setting_value: String,
    pub setting_group: Option<String>,
    pub description: Option<String>,
}

// ── GET /api/settings ─────────────────────────────────────────────────────────

pub async fn list_settings(
    auth_user: AuthUser,
    State(state): State<AppState>,
    Query(q): Query<ListSettingsQuery>,
) -> Result<Json<Vec<SettingRow>>, (StatusCode, String)> {
    let queried_parish = match q.parish_id {
        Some(pid) => {
            enforce_parish_access(&auth_user, pid)?;
            Some(pid)
        }
        None => {
            if auth_user.role == UserRole::Viewer {
                return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
            }
            None
        }
    };

    let rows = match queried_parish {
        Some(pid) => sqlx::query_as!(
            SettingRow,
            r#"SELECT id, parish_id, setting_key, setting_value,
                          setting_group, description
                   FROM app_setting
                   WHERE parish_id = $1
                   ORDER BY setting_group, setting_key"#,
            pid
        )
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?,
        None => sqlx::query_as!(
            SettingRow,
            r#"SELECT id, parish_id, setting_key, setting_value,
                          setting_group, description
                   FROM app_setting
                   WHERE parish_id IS NULL
                   ORDER BY setting_group, setting_key"#
        )
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?,
    };

    Ok(Json(rows))
}

// ── POST /api/settings/bulk ───────────────────────────────────────────────────
//
// Key fix: PostgreSQL partial indexes cannot be used with
// "ON CONFLICT ON CONSTRAINT" directly. Instead use the
// "ON CONFLICT (col) WHERE condition" syntax which matches
// the partial index definition exactly.
//
// For diocese rows (parish_id IS NULL):
//   ON CONFLICT (setting_key) WHERE parish_id IS NULL
//
// For parish rows (parish_id IS NOT NULL):
//   ON CONFLICT (parish_id, setting_key)

pub async fn bulk_upsert_settings(
    auth_user: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<Vec<UpsertSettingRequest>>,
) -> Result<StatusCode, (StatusCode, String)> {
    if payload.is_empty() {
        return Ok(StatusCode::NO_CONTENT);
    }

    let mut tx = state
        .db
        .begin()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for item in &payload {
        // Enforce access
        match item.parish_id {
            Some(pid) => enforce_parish_access(&auth_user, pid)?,
            None => {
                if auth_user.role != UserRole::SuperAdmin {
                    return Err((
                        StatusCode::FORBIDDEN,
                        format!(
                            "Only Diocese Administrator can set diocese-level setting '{}'",
                            item.setting_key
                        ),
                    ));
                }
            }
        }

        let group = item.setting_group.as_deref().unwrap_or("general");

        match item.parish_id {
            // ── Parish-level: composite unique (parish_id, setting_key) ──────
            Some(pid) => {
                sqlx::query!(
                    r#"
                    INSERT INTO app_setting
                        (parish_id, setting_key, setting_value, setting_group, description)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (parish_id, setting_key)
                    DO UPDATE SET
                        setting_value = EXCLUDED.setting_value,
                        setting_group = EXCLUDED.setting_group,
                        description   = COALESCE(EXCLUDED.description, app_setting.description),
                        updated_at    = NOW()
                    "#,
                    pid,
                    item.setting_key,
                    item.setting_value,
                    group,
                    item.description.as_deref(),
                )
                .execute(&mut *tx)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }

            // ── Diocese-level: partial index (setting_key WHERE parish_id IS NULL)
            // This syntax EXACTLY matches the partial index definition:
            //   CREATE UNIQUE INDEX idx_app_setting_system_key
            //   ON app_setting(setting_key) WHERE parish_id IS NULL;
            None => {
                sqlx::query!(
                    r#"
                    INSERT INTO app_setting
                        (parish_id, setting_key, setting_value, setting_group, description)
                    VALUES (NULL, $1, $2, $3, $4)
                    ON CONFLICT (setting_key) WHERE parish_id IS NULL
                    DO UPDATE SET
                        setting_value = EXCLUDED.setting_value,
                        setting_group = EXCLUDED.setting_group,
                        description   = COALESCE(EXCLUDED.description, app_setting.description),
                        updated_at    = NOW()
                    "#,
                    item.setting_key,
                    item.setting_value,
                    group,
                    item.description.as_deref(),
                )
                .execute(&mut *tx)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }
        }
    }

    tx.commit()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

// ── DELETE /api/settings/parish/:parish_id ────────────────────────────────────

pub async fn reset_parish_settings(
    auth_user: AuthUser,
    State(state): State<AppState>,
    Path(parish_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    enforce_parish_access(&auth_user, parish_id)?;

    sqlx::query!("DELETE FROM app_setting WHERE parish_id = $1", parish_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

// ── Access enforcement ────────────────────────────────────────────────────────

fn enforce_parish_access(
    auth_user: &AuthUser,
    target_parish_id: Uuid,
) -> Result<(), (StatusCode, String)> {
    match auth_user.role {
        UserRole::SuperAdmin => Ok(()),
        UserRole::ParishAdmin => {
            if auth_user.parish_id == Some(target_parish_id) {
                Ok(())
            } else {
                Err((
                    StatusCode::FORBIDDEN,
                    "You can only manage settings for your own parish".to_string(),
                ))
            }
        }
        _ => Err((StatusCode::FORBIDDEN, "Access denied".to_string())),
    }
}
