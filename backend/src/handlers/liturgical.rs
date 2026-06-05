use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use chrono::Datelike;
use crate::{
    AppState,
    models::liturgical::{
        LiturgicalCalendar, CreateLiturgicalCalendarRequest, UpdateLiturgicalCalendarRequest, LiturgicalQuery,
        RecurringEventPattern, CreateRecurringEventPatternRequest,
        GeneratedEvent, GenerateEventsRequest
    },
    handlers::auth::AuthUser,
    handlers::rbac,
};

// ============================================================================
// Liturgical Calendar Management
// ============================================================================

pub async fn list_liturgical_calendar(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<LiturgicalQuery>,
) -> Result<Json<Vec<LiturgicalCalendar>>, (StatusCode, String)> {
    rbac::require_write(&auth)?;

    let mut sql_builder = sqlx::QueryBuilder::new(
        "SELECT * FROM liturgical_calendar"
    );

    let mut has_where = false;

    if let Some(year) = query.year {
        sql_builder.push(" WHERE EXTRACT(YEAR FROM date) = ");
        sql_builder.push_bind(year);
        has_where = true;
    }

    if let Some(season) = &query.season {
        if has_where {
            sql_builder.push(" AND liturgical_season = ");
        } else {
            sql_builder.push(" WHERE liturgical_season = ");
        }
        sql_builder.push_bind(season);
        has_where = true;
    }

    if let Some(feast_type) = &query.feast_type {
        if has_where {
            sql_builder.push(" AND feast_type = ");
        } else {
            sql_builder.push(" WHERE feast_type = ");
        }
        sql_builder.push_bind(feast_type);
        has_where = true;
    }

    if let Some(date_from) = query.date_from {
        if has_where {
            sql_builder.push(" AND date >= ");
        } else {
            sql_builder.push(" WHERE date >= ");
        }
        sql_builder.push_bind(date_from);
        has_where = true;
    }

    if let Some(date_to) = query.date_to {
        if has_where {
            sql_builder.push(" AND date <= ");
        } else {
            sql_builder.push(" WHERE date <= ");
        }
        sql_builder.push_bind(date_to);
    }

    sql_builder.push(" ORDER BY date ASC, rank ASC");

    if let Some(limit) = query.limit {
        sql_builder.push(" LIMIT ");
        sql_builder.push_bind(limit);
        
        if let Some(page) = query.page {
            let offset = (page - 1) * limit;
            sql_builder.push(" OFFSET ");
            sql_builder.push_bind(offset);
        }
    }

    let calendar = sql_builder
        .build_query_as::<LiturgicalCalendar>()
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(calendar))
}

pub async fn create_liturgical_entry(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateLiturgicalCalendarRequest>,
) -> Result<(StatusCode, Json<LiturgicalCalendar>), (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let entry_id = Uuid::new_v4();
    let now = chrono::Utc::now();

    let entry = sqlx::query_as::<_, LiturgicalCalendar>(
        r#"
        INSERT INTO liturgical_calendar (
            id, year, date, title, description, feast_type, liturgical_season,
            liturgical_color, rank, is_movable, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        "#
    )
    .bind(entry_id)
    .bind(payload.year)
    .bind(payload.date)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(payload.feast_type)
    .bind(payload.liturgical_season)
    .bind(payload.liturgical_color)
    .bind(payload.rank)
    .bind(payload.is_movable)
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(entry)))
}

pub async fn update_liturgical_entry(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateLiturgicalCalendarRequest>,
) -> Result<Json<LiturgicalCalendar>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let now = chrono::Utc::now();

    let mut updates = Vec::new();
    let mut params = 1;

    if payload.year.is_some() { updates.push(format!("year = ${}", params)); params += 1; }
    if payload.date.is_some() { updates.push(format!("date = ${}", params)); params += 1; }
    if payload.title.is_some() { updates.push(format!("title = ${}", params)); params += 1; }
    if payload.description.is_some() { updates.push(format!("description = ${}", params)); params += 1; }
    if payload.feast_type.is_some() { updates.push(format!("feast_type = ${}", params)); params += 1; }
    if payload.liturgical_season.is_some() { updates.push(format!("liturgical_season = ${}", params)); params += 1; }
    if payload.liturgical_color.is_some() { updates.push(format!("liturgical_color = ${}", params)); params += 1; }
    if payload.rank.is_some() { updates.push(format!("rank = ${}", params)); params += 1; }
    if payload.is_movable.is_some() { updates.push(format!("is_movable = ${}", params)); params += 1; }

    if updates.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "No fields to update".to_string()));
    }

    updates.push(format!("updated_at = ${}", params));

    let query_str = format!(
        "UPDATE liturgical_calendar SET {} WHERE id = ${} RETURNING *",
        updates.join(", "),
        params + 1
    );

    let mut query = sqlx::query_as::<_, LiturgicalCalendar>(&query_str);

    if let Some(year) = payload.year { query = query.bind(year); }
    if let Some(date) = payload.date { query = query.bind(date); }
    if let Some(title) = payload.title { query = query.bind(title); }
    if let Some(description) = payload.description { query = query.bind(description); }
    if let Some(feast_type) = payload.feast_type { query = query.bind(feast_type); }
    if let Some(liturgical_season) = payload.liturgical_season { query = query.bind(liturgical_season); }
    if let Some(liturgical_color) = payload.liturgical_color { query = query.bind(liturgical_color); }
    if let Some(rank) = payload.rank { query = query.bind(rank); }
    if let Some(is_movable) = payload.is_movable { query = query.bind(is_movable); }

    query = query.bind(now);
    query = query.bind(id);

    let entry = query
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(entry))
}

pub async fn delete_liturgical_entry(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let result = sqlx::query("DELETE FROM liturgical_calendar WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Liturgical entry not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ============================================================================
// Recurring Event Patterns Management
// ============================================================================

pub async fn list_recurring_patterns(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<RecurringEventPattern>>, (StatusCode, String)> {
    rbac::require_write(&auth)?;

    let patterns = sqlx::query_as::<_, RecurringEventPattern>(
        "SELECT * FROM recurring_event_pattern ORDER BY name ASC"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(patterns))
}

pub async fn create_recurring_pattern(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateRecurringEventPatternRequest>,
) -> Result<(StatusCode, Json<RecurringEventPattern>), (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    let pattern_id = Uuid::new_v4();
    let now = chrono::Utc::now();

    let pattern = sqlx::query_as::<_, RecurringEventPattern>(
        r#"
        INSERT INTO recurring_event_pattern (
            id, name, description, pattern_type, pattern_config, is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#
    )
    .bind(pattern_id)
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.pattern_type)
    .bind(&payload.pattern_config)
    .bind(payload.is_active.unwrap_or(true))
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(pattern)))
}

pub async fn generate_events_from_pattern(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<GenerateEventsRequest>,
) -> Result<(StatusCode, Json<Vec<GeneratedEvent>>), (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    // Check if user has access to this parish
    let _ = rbac::resolve_parish_id(&auth, Some(payload.parish_id))?;

    // Get the pattern
    let pattern = sqlx::query_as::<_, RecurringEventPattern>(
        "SELECT * FROM recurring_event_pattern WHERE id = $1 AND is_active = true"
    )
    .bind(payload.pattern_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Pattern not found or inactive".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    let mut generated_events = Vec::new();
    let now = chrono::Utc::now();

    match pattern.pattern_type.as_str() {
        "weekly" => {
            // Generate weekly events
            let config: crate::models::liturgical::WeeklyPatternConfig = 
                serde_json::from_value(pattern.pattern_config)
                .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid pattern config: {}", e)))?;

            let mut current_date = payload.start_date;
            while current_date <= payload.end_date {
                if current_date.weekday().num_days_from_sunday() == config.day_of_week as u32 {
                    let event_id = Uuid::new_v4();
                    
                    let event = sqlx::query_as::<_, GeneratedEvent>(
                        r#"
                        INSERT INTO generated_event (
                            id, pattern_id, date, time, title, description, is_liturgical, generated_at
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                        "#
                    )
                    .bind(event_id)
                    .bind(pattern.id)
                    .bind(current_date)
                    .bind(&config.time)
                    .bind(&pattern.name)
                    .bind(&pattern.description)
                    .bind(false)
                    .bind(now)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

                    generated_events.push(event);
                }
                current_date += chrono::Duration::days(1);
            }
        },
        "monthly" => {
            // Generate monthly events
            let config: crate::models::liturgical::MonthlyPatternConfig = 
                serde_json::from_value(pattern.pattern_config)
                .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid pattern config: {}", e)))?;

            let mut current_date = payload.start_date;
            while current_date <= payload.end_date {
                if current_date.day() == config.day_of_month as u32 {
                    let event_id = Uuid::new_v4();
                    
                    let event = sqlx::query_as::<_, GeneratedEvent>(
                        r#"
                        INSERT INTO generated_event (
                            id, pattern_id, date, time, title, description, is_liturgical, generated_at
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                        "#
                    )
                    .bind(event_id)
                    .bind(pattern.id)
                    .bind(current_date)
                    .bind(&config.time)
                    .bind(&pattern.name)
                    .bind(&pattern.description)
                    .bind(false)
                    .bind(now)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

                    generated_events.push(event);
                }
                current_date += chrono::Duration::days(1);
            }
        },
        "yearly" => {
            // Generate yearly events
            let config: crate::models::liturgical::YearlyPatternConfig = 
                serde_json::from_value(pattern.pattern_config)
                .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid pattern config: {}", e)))?;

            let mut current_date = payload.start_date;
            while current_date <= payload.end_date {
                if current_date.month() == config.month as u32 && current_date.day() == config.day as u32 {
                    let event_id = Uuid::new_v4();
                    
                    let event = sqlx::query_as::<_, GeneratedEvent>(
                        r#"
                        INSERT INTO generated_event (
                            id, pattern_id, date, time, title, description, is_liturgical, generated_at
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                        "#
                    )
                    .bind(event_id)
                    .bind(pattern.id)
                    .bind(current_date)
                    .bind(&config.time)
                    .bind(&pattern.name)
                    .bind(&pattern.description)
                    .bind(false)
                    .bind(now)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

                    generated_events.push(event);
                }
                current_date += chrono::Duration::days(1);
            }
        },
        "liturgical" => {
            // Generate liturgical events based on the liturgical calendar
            let config: crate::models::liturgical::LiturgicalPatternConfig = 
                serde_json::from_value(pattern.pattern_config)
                .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid pattern config: {}", e)))?;

            // Find matching liturgical calendar entries
            let liturgical_entries = sqlx::query_as::<_, LiturgicalCalendar>(
                r#"
                SELECT * FROM liturgical_calendar 
                WHERE title ILIKE $1 
                AND date >= $2 AND date <= $3
                ORDER BY date ASC
                "#
            )
            .bind(format!("%{}%", config.feast_name))
            .bind(payload.start_date)
            .bind(payload.end_date)
            .fetch_all(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            for entry in liturgical_entries {
                let event_date = if let Some(offset) = config.offset_days {
                    entry.date + chrono::Duration::days(offset as i64)
                } else {
                    entry.date
                };

                if event_date >= payload.start_date && event_date <= payload.end_date {
                    let event_id = Uuid::new_v4();
                    
                    let event = sqlx::query_as::<_, GeneratedEvent>(
                        r#"
                        INSERT INTO generated_event (
                            id, pattern_id, date, time, title, description, is_liturgical, generated_at
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                        "#
                    )
                    .bind(event_id)
                    .bind(pattern.id)
                    .bind(event_date)
                    .bind(&config.time)
                    .bind(&entry.title)
                    .bind(&entry.description)
                    .bind(true)
                    .bind(now)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

                    generated_events.push(event);
                }
            }
        },
        _ => {
            return Err((StatusCode::BAD_REQUEST, "Unsupported pattern type".to_string()));
        }
    }

    Ok((StatusCode::CREATED, Json(generated_events)))
}

pub async fn get_generated_events(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<LiturgicalQuery>,
) -> Result<Json<Vec<GeneratedEvent>>, (StatusCode, String)> {
    rbac::require_write(&auth)?;

    let mut sql_builder = sqlx::QueryBuilder::new(
        "SELECT * FROM generated_event"
    );

    let mut has_where = false;

    if let Some(date_from) = query.date_from {
        sql_builder.push(" WHERE date >= ");
        sql_builder.push_bind(date_from);
        has_where = true;
    }

    if let Some(date_to) = query.date_to {
        if has_where {
            sql_builder.push(" AND date <= ");
        } else {
            sql_builder.push(" WHERE date <= ");
        }
        sql_builder.push_bind(date_to);
        has_where = true;
    }

    if has_where {
        sql_builder.push(" OR is_liturgical = true");
    } else {
        sql_builder.push(" WHERE is_liturgical = true");
    }

    sql_builder.push(" ORDER BY date ASC, generated_at ASC");

    if let Some(limit) = query.limit {
        sql_builder.push(" LIMIT ");
        sql_builder.push_bind(limit);
        
        if let Some(page) = query.page {
            let offset = (page - 1) * limit;
            sql_builder.push(" OFFSET ");
            sql_builder.push_bind(offset);
        }
    }

    let events = sql_builder
        .build_query_as::<GeneratedEvent>()
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(events))
}
