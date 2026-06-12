use crate::{
    handlers::auth::AuthUser,
    handlers::rbac,
    models::attendance::{AttendanceRecord, CreateAttendanceRequest},
    AppState,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::NaiveDate;
use uuid::Uuid;

#[derive(Debug, serde::Deserialize)]
pub struct AttendanceQuery {
    pub parish_id: Option<Uuid>,
    pub member_id: Option<Uuid>,
    pub scc_id: Option<Uuid>,
    pub event_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Debug, serde::Serialize)]
pub struct AttendanceStats {
    pub total_present: i64,
    pub total_absent: i64,
    pub total_excused: i64,
    pub attendance_rate: f64,
    pub total_records: i64,
}

// ============================================================================
// Attendance Management
// ============================================================================

pub async fn list_attendance(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<AttendanceQuery>,
) -> Result<Json<Vec<AttendanceRecord>>, (StatusCode, String)> {
    let mut sql_builder =
        sqlx::QueryBuilder::new("SELECT * FROM attendance_record WHERE parish_id = ");

    // Get parish_id based on user role
    let parish_id = match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            if let Some(pid) = query.parish_id {
                pid
            } else if let Some(pid) = auth.parish_id {
                pid
            } else {
                return Err((
                    StatusCode::BAD_REQUEST,
                    "Parish ID required for SuperAdmin".to_string(),
                ));
            }
        }
        _ => auth
            .parish_id
            .ok_or((StatusCode::FORBIDDEN, "No parish assigned".to_string()))?,
    };

    sql_builder.push_bind(parish_id);
    sql_builder.push(" AND deleted_at IS NULL");

    // Apply filters
    if let Some(member_id) = query.member_id {
        sql_builder.push(" AND member_id = ");
        sql_builder.push_bind(member_id);
    }
    if let Some(scc_id) = query.scc_id {
        sql_builder.push(" AND scc_id = ");
        sql_builder.push_bind(scc_id);
    }
    if let Some(event_id) = query.event_id {
        sql_builder.push(" AND event_id = ");
        sql_builder.push_bind(event_id);
    }
    if let Some(start_date) = query.start_date {
        sql_builder.push(" AND attendance_date >= ");
        sql_builder.push_bind(start_date);
    }
    if let Some(end_date) = query.end_date {
        sql_builder.push(" AND attendance_date <= ");
        sql_builder.push_bind(end_date);
    }
    if let Some(status) = &query.status {
        sql_builder.push(" AND status = ");
        sql_builder.push_bind(status);
    }

    sql_builder.push(" ORDER BY attendance_date DESC, created_at DESC");

    let attendance_records: Vec<AttendanceRecord> = sql_builder
        .build_query_as()
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(attendance_records))
}

pub async fn get_attendance(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<AttendanceRecord>, (StatusCode, String)> {
    let record = sqlx::query_as::<_, AttendanceRecord>(
        "SELECT * FROM attendance_record WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    match record {
        Some(rec) => {
            // Check parish access
            match auth.role {
                crate::models::user::UserRole::SuperAdmin => {
                    // SuperAdmin can view all
                }
                _ => {
                    if auth.parish_id.is_some() && rec.parish_id != auth.parish_id.unwrap() {
                        return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
                    }
                }
            }
            Ok(Json(rec))
        }
        None => Err((
            StatusCode::NOT_FOUND,
            "Attendance record not found".to_string(),
        )),
    }
}

pub async fn create_attendance(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(req): Json<CreateAttendanceRequest>,
) -> Result<Json<AttendanceRecord>, (StatusCode, String)> {
    // Check permissions
    rbac::require_admin(&auth)?;

    let parish_id = auth
        .parish_id
        .ok_or((StatusCode::BAD_REQUEST, "No parish assigned".to_string()))?;

    // Validate that at least one of member_id, scc_id, or event_id is provided
    if req.member_id.is_none() && req.scc_id.is_none() && req.event_id.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            "At least one of member_id, scc_id, or event_id must be provided".to_string(),
        ));
    }

    let id = Uuid::new_v4();

    let record = sqlx::query_as::<_, AttendanceRecord>(
        r#"
        INSERT INTO attendance_record (
            id, parish_id, member_id, scc_id, event_id,
            attendance_date, status, check_in_time, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(parish_id)
    .bind(req.member_id)
    .bind(req.scc_id)
    .bind(req.event_id)
    .bind(req.attendance_date)
    .bind(req.status)
    .bind(req.check_in_time)
    .bind(req.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(record))
}

pub async fn update_attendance(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<CreateAttendanceRequest>,
) -> Result<Json<AttendanceRecord>, (StatusCode, String)> {
    // Check permissions
    rbac::require_admin(&auth)?;

    // Get existing record
    let existing = sqlx::query_as::<_, AttendanceRecord>(
        "SELECT * FROM attendance_record WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let existing = existing.ok_or((
        StatusCode::NOT_FOUND,
        "Attendance record not found".to_string(),
    ))?;

    // Check parish access
    match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            // SuperAdmin can edit all
        }
        _ => {
            if auth.parish_id.is_some() && existing.parish_id != auth.parish_id.unwrap() {
                return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
            }
        }
    }

    let record = sqlx::query_as::<_, AttendanceRecord>(
        r#"
        UPDATE attendance_record
        SET member_id = $2, scc_id = $3, event_id = $4,
            attendance_date = $5, status = $6, check_in_time = $7, notes = $8,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(req.member_id)
    .bind(req.scc_id)
    .bind(req.event_id)
    .bind(req.attendance_date)
    .bind(req.status)
    .bind(req.check_in_time)
    .bind(req.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(record))
}

pub async fn delete_attendance(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Check permissions
    rbac::require_admin(&auth)?;

    // Get existing record
    let existing = sqlx::query_as::<_, AttendanceRecord>(
        "SELECT * FROM attendance_record WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let existing = existing.ok_or((
        StatusCode::NOT_FOUND,
        "Attendance record not found".to_string(),
    ))?;

    // Check parish access
    match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            // SuperAdmin can delete all
        }
        _ => {
            if auth.parish_id.is_some() && existing.parish_id != auth.parish_id.unwrap() {
                return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
            }
        }
    }

    sqlx::query("UPDATE attendance_record SET deleted_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_attendance_stats(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(query): Query<AttendanceQuery>,
) -> Result<Json<AttendanceStats>, (StatusCode, String)> {
    let parish_id = match auth.role {
        crate::models::user::UserRole::SuperAdmin => {
            if let Some(pid) = auth.parish_id {
                pid
            } else {
                return Err((StatusCode::BAD_REQUEST, "Parish ID required".to_string()));
            }
        }
        _ => auth
            .parish_id
            .ok_or((StatusCode::FORBIDDEN, "No parish assigned".to_string()))?,
    };

    let mut where_clause = String::from("WHERE parish_id = $1 AND deleted_at IS NULL");
    let mut param_count = 1;

    if let Some(_start_date) = query.start_date {
        param_count += 1;
        where_clause.push_str(&format!(" AND attendance_date = ${}", param_count));
    }
    if let Some(_end_date) = query.end_date {
        param_count += 1;
        where_clause.push_str(&format!(" AND attendance_date <= ${}", param_count));
    }

    let total_present: i64 = sqlx::query_scalar(&format!(
        "SELECT COUNT(*) FROM attendance_record {} AND status = 'PRESENT'",
        where_clause
    ))
    .bind(parish_id)
    .bind(query.start_date)
    .bind(query.end_date)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_absent: i64 = sqlx::query_scalar(&format!(
        "SELECT COUNT(*) FROM attendance_record {} AND status = 'ABSENT'",
        where_clause
    ))
    .bind(parish_id)
    .bind(query.start_date)
    .bind(query.end_date)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_excused: i64 = sqlx::query_scalar(&format!(
        "SELECT COUNT(*) FROM attendance_record {} AND status = 'EXCUSED'",
        where_clause
    ))
    .bind(parish_id)
    .bind(query.start_date)
    .bind(query.end_date)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_records = total_present + total_absent + total_excused;
    let attendance_rate = if total_records > 0 {
        (total_present as f64 / total_records as f64) * 100.0
    } else {
        0.0
    };

    Ok(Json(AttendanceStats {
        total_present,
        total_absent,
        total_excused,
        attendance_rate,
        total_records,
    }))
}

pub async fn bulk_create_attendance(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(records): Json<Vec<CreateAttendanceRequest>>,
) -> Result<Json<Vec<AttendanceRecord>>, (StatusCode, String)> {
    // Check permissions
    rbac::require_admin(&auth)?;

    let parish_id = auth
        .parish_id
        .ok_or((StatusCode::BAD_REQUEST, "No parish assigned".to_string()))?;

    let mut created_records = Vec::new();

    for req in records {
        // Validate that at least one of member_id, scc_id, or event_id is provided
        if req.member_id.is_none() && req.scc_id.is_none() && req.event_id.is_none() {
            continue;
        }

        let id = Uuid::new_v4();

        let record = sqlx::query_as::<_, AttendanceRecord>(
            r#"
            INSERT INTO attendance_record (
                id, parish_id, member_id, scc_id, event_id,
                attendance_date, status, check_in_time, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(parish_id)
        .bind(req.member_id)
        .bind(req.scc_id)
        .bind(req.event_id)
        .bind(req.attendance_date)
        .bind(req.status)
        .bind(req.check_in_time)
        .bind(req.notes)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        created_records.push(record);
    }

    Ok(Json(created_records))
}
