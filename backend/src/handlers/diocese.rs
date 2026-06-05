use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use sqlx::Row;
use crate::{AppState, models::diocese::Diocese, handlers::auth::AuthUser, handlers::rbac};

pub async fn list_dioceses(
    _auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Diocese>>, (StatusCode, String)> {
    let dioceses = sqlx::query_as::<_, Diocese>(
        "SELECT * FROM diocese WHERE deleted_at IS NULL"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(dioceses))
}

pub async fn get_diocese(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Diocese>, (StatusCode, String)> {
    let diocese = sqlx::query_as::<_, Diocese>(
        "SELECT * FROM diocese WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Diocese not found".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    Ok(Json(diocese))
}

pub async fn create_diocese(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(mut diocese): Json<Diocese>,
) -> Result<Json<Diocese>, (StatusCode, String)> {
    // Only SuperAdmin can create dioceses
    rbac::require_super_admin(&auth)?;
    
    // Generate a new ID if not provided
    if diocese.id == Uuid::nil() {
        diocese.id = Uuid::new_v4();
    }
    
    let result = sqlx::query(
        r#"
        INSERT INTO diocese (id, diocese_code, diocese_name, bishop_name, headquarters_address, contact_phone, contact_email, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, diocese_code, diocese_name, bishop_name, established_date, headquarters_address, contact_email, contact_phone, country, currency_code, logo_url, is_active, created_at, updated_at
        "#
    )
    .bind(diocese.id)
    .bind(&diocese.diocese_code)
    .bind(&diocese.diocese_name)
    .bind(&diocese.bishop_name)
    .bind(&diocese.headquarters_address)
    .bind(&diocese.contact_phone)
    .bind(&diocese.contact_email)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let created_diocese = Diocese {
        id: result.get("id"),
        diocese_code: result.get("diocese_code"),
        diocese_name: result.get("diocese_name"),
        bishop_name: result.get("bishop_name"),
        established_date: result.get("established_date"),
        headquarters_address: result.get("headquarters_address"),
        contact_email: result.get("contact_email"),
        contact_phone: result.get("contact_phone"),
        country: result.get("country"),
        currency_code: result.get("currency_code"),
        logo_url: result.get("logo_url"),
        is_active: result.get("is_active"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
        deleted_at: result.get("deleted_at"),
    };

    Ok(Json(created_diocese))
}

pub async fn update_diocese(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(mut diocese): Json<Diocese>,
) -> Result<Json<Diocese>, (StatusCode, String)> {
    // Only SuperAdmin can update dioceses
    rbac::require_super_admin(&auth)?;
    
    // Ensure the ID in the path matches the ID in the body
    diocese.id = id;
    
    let result = sqlx::query(
        r#"
        UPDATE diocese 
        SET diocese_code = $2, diocese_name = $3, bishop_name = $4, headquarters_address = $5, contact_phone = $6, contact_email = $7, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, diocese_code, diocese_name, bishop_name, established_date, headquarters_address, contact_email, contact_phone, country, currency_code, logo_url, is_active, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(&diocese.diocese_code)
    .bind(&diocese.diocese_name)
    .bind(&diocese.bishop_name)
    .bind(&diocese.headquarters_address)
    .bind(&diocese.contact_phone)
    .bind(&diocese.contact_email)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows returned") {
            (StatusCode::NOT_FOUND, "Diocese not found".to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    let updated_diocese = Diocese {
        id: result.get("id"),
        diocese_code: result.get("diocese_code"),
        diocese_name: result.get("diocese_name"),
        bishop_name: result.get("bishop_name"),
        established_date: result.get("established_date"),
        headquarters_address: result.get("headquarters_address"),
        contact_email: result.get("contact_email"),
        contact_phone: result.get("contact_phone"),
        country: result.get("country"),
        currency_code: result.get("currency_code"),
        logo_url: result.get("logo_url"),
        is_active: result.get("is_active"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
        deleted_at: result.get("deleted_at"),
    };

    Ok(Json(updated_diocese))
}

pub async fn delete_diocese(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Only SuperAdmin can delete dioceses
    rbac::require_super_admin(&auth)?;
    
    let result = sqlx::query(
        "UPDATE diocese SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Diocese not found or already deleted".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
