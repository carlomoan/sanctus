use axum::{
    extract::{State, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use serde::Deserialize;
use crate::{AppState, models::setting::{AppSetting, UpsertSettingRequest, BulkUpsertSettingsRequest}, handlers::auth::AuthUser};

#[derive(Debug, Deserialize)]
pub struct SettingsQuery {
    pub parish_id: Option<Uuid>,
    pub setting_group: Option<String>,
}

pub async fn list_settings(
    _auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<SettingsQuery>,
) -> Result<Json<Vec<AppSetting>>, (StatusCode, String)> {
    let settings = if let Some(parish_id) = query.parish_id {
        if let Some(group) = query.setting_group {
            sqlx::query_as::<_, AppSetting>(
                "SELECT * FROM app_setting WHERE parish_id = $1 AND setting_group = $2 ORDER BY setting_key"
            )
            .bind(parish_id).bind(group)
            .fetch_all(&state.db).await
        } else {
            sqlx::query_as::<_, AppSetting>(
                "SELECT * FROM app_setting WHERE parish_id = $1 ORDER BY setting_group, setting_key"
            )
            .bind(parish_id)
            .fetch_all(&state.db).await
        }
    } else if let Some(group) = query.setting_group {
        sqlx::query_as::<_, AppSetting>(
            "SELECT * FROM app_setting WHERE parish_id IS NULL AND setting_group = $1 ORDER BY setting_key"
        )
        .bind(group)
        .fetch_all(&state.db).await
    } else {
        sqlx::query_as::<_, AppSetting>(
            "SELECT * FROM app_setting WHERE parish_id IS NULL ORDER BY setting_group, setting_key"
        )
        .fetch_all(&state.db).await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(settings))
}

pub async fn upsert_setting(
    _auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<UpsertSettingRequest>,
) -> Result<Json<AppSetting>, (StatusCode, String)> {
    let group = payload.setting_group.unwrap_or_else(|| "general".to_string());

    let setting = if let Some(parish_id) = payload.parish_id {
        sqlx::query_as::<_, AppSetting>(
            r#"
            INSERT INTO app_setting (parish_id, setting_key, setting_value, setting_group, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (parish_id, setting_key) DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                setting_group = EXCLUDED.setting_group,
                description = COALESCE(EXCLUDED.description, app_setting.description),
                updated_at = NOW()
            RETURNING *
            "#
        )
        .bind(parish_id)
        .bind(&payload.setting_key)
        .bind(&payload.setting_value)
        .bind(&group)
        .bind(&payload.description)
        .fetch_one(&state.db).await
    } else {
        sqlx::query_as::<_, AppSetting>(
            r#"
            INSERT INTO app_setting (parish_id, setting_key, setting_value, setting_group, description)
            VALUES (NULL, $1, $2, $3, $4)
            ON CONFLICT (setting_key) WHERE parish_id IS NULL DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                setting_group = EXCLUDED.setting_group,
                description = COALESCE(EXCLUDED.description, app_setting.description),
                updated_at = NOW()
            RETURNING *
            "#
        )
        .bind(&payload.setting_key)
        .bind(&payload.setting_value)
        .bind(&group)
        .bind(&payload.description)
        .fetch_one(&state.db).await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(setting))
}

pub async fn bulk_upsert_settings(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<BulkUpsertSettingsRequest>,
) -> Result<Json<Vec<AppSetting>>, (StatusCode, String)> {
    let mut results = Vec::new();

    for s in payload.settings {
        let req = UpsertSettingRequest {
            parish_id: s.parish_id,
            setting_key: s.setting_key,
            setting_value: s.setting_value,
            setting_group: s.setting_group,
            description: s.description,
        };
        let result = upsert_setting(
            AuthUser { user_id: auth.user_id, role: auth.role, parish_id: auth.parish_id },
            State(state.clone()),
            Json(req),
        ).await?;
        results.push(result.0);
    }

    Ok(Json(results))
}
