use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::{
    AppState,
    models::event::{
        Event, CreateEventRequest, UpdateEventRequest, EventQuery,
        EventParticipant, AddParticipantRequest
    },
    handlers::auth::AuthUser,
    handlers::rbac,
};

// ============================================================================
// Event Management
// ============================================================================

pub async fn list_events(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<EventQuery>,
) -> Result<Json<Vec<Event>>, (StatusCode, String)> {
    // Build query based on user role and requested scope
    let mut sql_builder = sqlx::QueryBuilder::new(
        "SELECT * FROM events WHERE deleted_at IS NULL"
    );

    // Handle SAAS hierarchy logic
    match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            // SuperAdmin can see all events
            if let Some(diocese_id) = query.diocese_id {
                sql_builder.push(" AND diocese_id = ");
                sql_builder.push_bind(diocese_id);
            }
            if let Some(parish_id) = query.parish_id {
                sql_builder.push(" AND parish_id = ");
                sql_builder.push_bind(parish_id);
            }
        },
        crate::models::user::UserRole::ParishAdmin => {
            // ParishAdmin can see diocese events for their diocese + their parish events
            if let Some(parish_id) = auth.parish_id {
                sql_builder.push(" AND (scope = 'DIOCESE' AND diocese_id = (SELECT diocese_id FROM parishes WHERE id = ");
                sql_builder.push_bind(parish_id);
                sql_builder.push(") OR parish_id = ");
                sql_builder.push_bind(parish_id);
                sql_builder.push(")");
            }
        },
        _ => {
            // Other roles can only see events from their parish
            let parish_id = rbac::resolve_parish_id(&auth, query.parish_id)?;
            sql_builder.push(" AND (scope = 'DIOCESE' AND diocese_id = (SELECT diocese_id FROM parishes WHERE id = ");
            sql_builder.push_bind(parish_id);
            sql_builder.push(") OR parish_id = ");
            sql_builder.push_bind(parish_id);
            sql_builder.push(")");
        }
    }

    // Add scope filter if specified
    if let Some(scope) = query.scope {
        sql_builder.push(" AND scope = ");
        sql_builder.push_bind(scope);
    }

    if let Some(event_type) = query.event_type {
        sql_builder.push(" AND event_type = ");
        sql_builder.push_bind(event_type);
    }

    if let Some(event_status) = query.event_status {
        sql_builder.push(" AND event_status = ");
        sql_builder.push_bind(event_status);
    }

    if let Some(start_date_from) = query.start_date_from {
        sql_builder.push(" AND start_date >= ");
        sql_builder.push_bind(start_date_from);
    }

    if let Some(start_date_to) = query.start_date_to {
        sql_builder.push(" AND start_date <= ");
        sql_builder.push_bind(start_date_to);
    }

    if let Some(is_liturgical) = query.is_liturgical {
        sql_builder.push(" AND is_liturgical = ");
        sql_builder.push_bind(is_liturgical);
    }

    sql_builder.push(" ORDER BY start_date ASC, start_time ASC");

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
        .build_query_as::<Event>()
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(events))
}

pub async fn get_event(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Event>, (StatusCode, String)> {
    rbac::require_read(&auth)?;

    let event = sqlx::query_as::<_, Event>(
        "SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Event not found".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    // Check if user has access to this event based on scope
    match event.scope {
        crate::models::event::EventScope::Diocese => {
            // Diocese events: SuperAdmin can access all, others must be in the same diocese
            if auth.role != crate::models::user::UserRole::SuperAdmin {
                if let Some(parish_id) = auth.parish_id {
                    let diocese_id = sqlx::query_scalar::<_, Uuid>(
                        "SELECT diocese_id FROM parishes WHERE id = $1"
                    )
                    .bind(parish_id)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
                    
                    if event.diocese_id != Some(diocese_id) {
                        return Err((StatusCode::FORBIDDEN, "Access denied: You don't have access to this diocese event".to_string()));
                    }
                } else {
                    return Err((StatusCode::FORBIDDEN, "Access denied: No parish assigned".to_string()));
                }
            }
        },
        crate::models::event::EventScope::Parish => {
            // Parish events: User must have access to the specific parish
            if let Some(event_parish_id) = event.parish_id {
                let _ = rbac::resolve_parish_id(&auth, Some(event_parish_id))?;
            } else {
                return Err((StatusCode::FORBIDDEN, "Access denied: Parish event has no parish assigned".to_string()));
            }
        }
    }

    Ok(Json(event))
}

pub async fn create_event(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateEventRequest>,
) -> Result<(StatusCode, Json<Event>), (StatusCode, String)> {
    let event_id = Uuid::new_v4();
    let now = chrono::Utc::now();

    // Handle SAAS hierarchy permissions
    let (parish_id, diocese_id) = match payload.scope {
        crate::models::event::EventScope::Diocese => {
            // Only SuperAdmin and Diocese staff can create diocese events
            match auth.role {
                crate::models::user::UserRole::SuperAdmin => {
                    // SuperAdmin can create diocese events for any diocese
                    (None, payload.diocese_id)
                },
                crate::models::user::UserRole::ParishAdmin => {
                    // ParishAdmin can create diocese events for their diocese
                    if let Some(parish_id) = auth.parish_id {
                        let diocese_id = sqlx::query_scalar::<_, Uuid>(
                            "SELECT diocese_id FROM parishes WHERE id = $1"
                        )
                        .bind(parish_id)
                        .fetch_one(&state.db)
                        .await
                        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
                        
                        (None, Some(diocese_id))
                    } else {
                        return Err((StatusCode::FORBIDDEN, "Access denied: No parish assigned".to_string()));
                    }
                },
                _ => {
                    return Err((StatusCode::FORBIDDEN, "Access denied: Only SuperAdmin and ParishAdmin can create diocese events".to_string()));
                }
            }
        },
        crate::models::event::EventScope::Parish => {
            // Only parish staff can create parish events
            let parish_id = rbac::resolve_parish_id(&auth, payload.parish_id)?;
            (Some(parish_id), None)
        }
    };

    let event = sqlx::query_as::<_, Event>(
        r#"
        INSERT INTO events (
            id, parish_id, diocese_id, scope, title, description, event_type, event_status,
            start_date, start_time, end_date, end_time, location, organizer_id,
            organizer_name, max_participants, current_participants, registration_required,
            registration_deadline, fee_amount, is_public, is_liturgical,
            recurrence_pattern, recurrence_end_date, parent_event_id, notes,
            created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        RETURNING *
        "#
    )
    .bind(event_id)
    .bind(parish_id)
    .bind(diocese_id)
    .bind(payload.scope)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(payload.event_type)
    .bind(crate::models::event::EventStatus::Planned)
    .bind(payload.start_date)
    .bind(payload.start_time)
    .bind(payload.end_date)
    .bind(payload.end_time)
    .bind(&payload.location)
    .bind(payload.organizer_id)
    .bind(&payload.organizer_name)
    .bind(payload.max_participants)
    .bind(0) // current_participants starts at 0
    .bind(payload.registration_required)
    .bind(payload.registration_deadline)
    .bind(payload.fee_amount)
    .bind(payload.is_public.unwrap_or(true))
    .bind(payload.is_liturgical)
    .bind(payload.recurrence_pattern)
    .bind(payload.recurrence_end_date)
    .bind(payload.parent_event_id)
    .bind(&payload.notes)
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(event)))
}

pub async fn update_event(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateEventRequest>,
) -> Result<Json<Event>, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    // First check if event exists and user has access
    let existing_event = sqlx::query_as::<_, Event>(
        "SELECT * FROM event WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Event not found".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    // Check if user has access to this event's parish
    let _ = rbac::resolve_parish_id(&auth, existing_event.parish_id)?;

    let now = chrono::Utc::now();

    // Simplified update approach - build query manually
    let mut updates = Vec::new();
    let mut params = 1;

    if let Some(_) = &payload.title { updates.push(format!("title = ${}", params)); params += 1; }
    if let Some(_) = &payload.description { updates.push(format!("description = ${}", params)); params += 1; }
    if let Some(_) = &payload.event_type { updates.push(format!("event_type = ${}", params)); params += 1; }
    if let Some(_) = &payload.event_status { updates.push(format!("event_status = ${}", params)); params += 1; }
    if let Some(_) = &payload.start_date { updates.push(format!("start_date = ${}", params)); params += 1; }
    if let Some(_) = &payload.start_time { updates.push(format!("start_time = ${}", params)); params += 1; }
    if let Some(_) = &payload.end_date { updates.push(format!("end_date = ${}", params)); params += 1; }
    if let Some(_) = &payload.end_time { updates.push(format!("end_time = ${}", params)); params += 1; }
    if let Some(_) = &payload.location { updates.push(format!("location = ${}", params)); params += 1; }
    if let Some(_) = &payload.organizer_id { updates.push(format!("organizer_id = ${}", params)); params += 1; }
    if let Some(_) = &payload.organizer_name { updates.push(format!("organizer_name = ${}", params)); params += 1; }
    if let Some(_) = &payload.max_participants { updates.push(format!("max_participants = ${}", params)); params += 1; }
    if let Some(_) = &payload.current_participants { updates.push(format!("current_participants = ${}", params)); params += 1; }
    if let Some(_) = &payload.registration_required { updates.push(format!("registration_required = ${}", params)); params += 1; }
    if let Some(_) = &payload.registration_deadline { updates.push(format!("registration_deadline = ${}", params)); params += 1; }
    if let Some(_) = &payload.fee_amount { updates.push(format!("fee_amount = ${}", params)); params += 1; }
    if let Some(_) = &payload.is_public { updates.push(format!("is_public = ${}", params)); params += 1; }
    if let Some(_) = &payload.is_liturgical { updates.push(format!("is_liturgical = ${}", params)); params += 1; }
    if let Some(_) = &payload.recurrence_pattern { updates.push(format!("recurrence_pattern = ${}", params)); params += 1; }
    if let Some(_) = &payload.recurrence_end_date { updates.push(format!("recurrence_end_date = ${}", params)); params += 1; }
    if let Some(_) = &payload.notes { updates.push(format!("notes = ${}", params)); params += 1; }

    if updates.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "No fields to update".to_string()));
    }

    updates.push(format!("updated_at = ${}", params));
    params += 1;

    let query_str = format!(
        "UPDATE event SET {} WHERE id = ${} RETURNING *",
        updates.join(", "),
        params
    );

    let mut query = sqlx::query_as::<_, Event>(&query_str);

    // Bind all values in order
    if let Some(title) = &payload.title { query = query.bind(title); }
    if let Some(description) = &payload.description { query = query.bind(description); }
    if let Some(event_type) = &payload.event_type { query = query.bind(event_type); }
    if let Some(event_status) = &payload.event_status { query = query.bind(event_status); }
    if let Some(start_date) = &payload.start_date { query = query.bind(start_date); }
    if let Some(start_time) = &payload.start_time { query = query.bind(start_time); }
    if let Some(end_date) = &payload.end_date { query = query.bind(end_date); }
    if let Some(end_time) = &payload.end_time { query = query.bind(end_time); }
    if let Some(location) = &payload.location { query = query.bind(location); }
    if let Some(organizer_id) = &payload.organizer_id { query = query.bind(organizer_id); }
    if let Some(organizer_name) = &payload.organizer_name { query = query.bind(organizer_name); }
    if let Some(max_participants) = &payload.max_participants { query = query.bind(max_participants); }
    if let Some(current_participants) = &payload.current_participants { query = query.bind(current_participants); }
    if let Some(registration_required) = &payload.registration_required { query = query.bind(registration_required); }
    if let Some(registration_deadline) = &payload.registration_deadline { query = query.bind(registration_deadline); }
    if let Some(fee_amount) = &payload.fee_amount { query = query.bind(fee_amount); }
    if let Some(is_public) = &payload.is_public { query = query.bind(is_public); }
    if let Some(is_liturgical) = &payload.is_liturgical { query = query.bind(is_liturgical); }
    if let Some(recurrence_pattern) = &payload.recurrence_pattern { query = query.bind(recurrence_pattern); }
    if let Some(recurrence_end_date) = &payload.recurrence_end_date { query = query.bind(recurrence_end_date); }
    if let Some(notes) = &payload.notes { query = query.bind(notes); }

    query = query.bind(now);
    query = query.bind(id);

    let event = query
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(event))
}

pub async fn delete_event(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    // First check if event exists and user has access
    let existing_event = sqlx::query_as::<_, Event>(
        "SELECT * FROM event WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Event not found".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    // Check if user has access to this event's parish
    let _ = rbac::resolve_parish_id(&auth, existing_event.parish_id)?;

    let result = sqlx::query(
        "UPDATE event SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Event not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ============================================================================
// Event Participants Management
// ============================================================================

pub async fn list_event_participants(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(event_id): Path<Uuid>,
) -> Result<Json<Vec<EventParticipant>>, (StatusCode, String)> {
    rbac::require_write(&auth)?;

    // First check if event exists and user has access
    let existing_event = sqlx::query_as::<_, Event>(
        "SELECT * FROM event WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(event_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Event not found".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    // Check if user has access to this event's parish
    let _ = rbac::resolve_parish_id(&auth, existing_event.parish_id)?;

    let participants = sqlx::query_as::<_, EventParticipant>(
        "SELECT * FROM event_participant WHERE event_id = $1 ORDER BY registration_date ASC"
    )
    .bind(event_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(participants))
}

pub async fn add_event_participant(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(event_id): Path<Uuid>,
    Json(payload): Json<AddParticipantRequest>,
) -> Result<(StatusCode, Json<EventParticipant>), (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    // First check if event exists and user has access
    let existing_event = sqlx::query_as::<_, Event>(
        "SELECT * FROM event WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(event_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Event not found".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    // Check if user has access to this event's parish
    let _ = rbac::resolve_parish_id(&auth, existing_event.parish_id)?;

    // Check if event requires registration and if deadline has passed
    if existing_event.registration_required.unwrap_or(false) {
        if let Some(deadline) = existing_event.registration_deadline {
            if chrono::Utc::now().date_naive() > deadline {
                return Err((StatusCode::BAD_REQUEST, "Registration deadline has passed".to_string()));
            }
        }
    }

    // Check if event has max participants limit
    if let Some(max_participants) = existing_event.max_participants {
        let current_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM event_participant WHERE event_id = $1"
        )
        .bind(event_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))? as i32;

        if current_count >= max_participants {
            return Err((StatusCode::BAD_REQUEST, "Event is full".to_string()));
        }
    }

    let participant_id = Uuid::new_v4();
    let now = chrono::Utc::now();

    let participant = sqlx::query_as::<_, EventParticipant>(
        r#"
        INSERT INTO event_participant (
            id, event_id, member_id, family_id, participant_name, participant_phone,
            participant_email, registration_date, fee_paid, fee_amount, notes,
            created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
        "#
    )
    .bind(participant_id)
    .bind(event_id)
    .bind(payload.member_id)
    .bind(payload.family_id)
    .bind(&payload.participant_name)
    .bind(&payload.participant_phone)
    .bind(&payload.participant_email)
    .bind(chrono::Utc::now().date_naive())
    .bind(false) // fee_paid defaults to false
    .bind(payload.fee_amount)
    .bind(&payload.notes)
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Update current participants count
    sqlx::query(
        "UPDATE event SET current_participants = current_participants + 1 WHERE id = $1"
    )
    .bind(event_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(participant)))
}

pub async fn remove_event_participant(
    auth: AuthUser,
    State(state): State<AppState>,
    Path((event_id, participant_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, (StatusCode, String)> {
    rbac::require_admin(&auth)?;

    // First check if event exists and user has access
    let existing_event = sqlx::query_as::<_, Event>(
        "SELECT * FROM event WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(event_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Event not found".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    // Check if user has access to this event's parish
    let _ = rbac::resolve_parish_id(&auth, existing_event.parish_id)?;

    let result = sqlx::query(
        "DELETE FROM event_participant WHERE id = $1 AND event_id = $2"
    )
    .bind(participant_id)
    .bind(event_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Participant not found".to_string()));
    }

    // Update current participants count
    sqlx::query(
        "UPDATE event SET current_participants = current_participants - 1 WHERE id = $1 AND current_participants > 0"
    )
    .bind(event_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}
