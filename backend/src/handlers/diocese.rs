use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use crate::{AppState, models::diocese::Diocese, handlers::auth::AuthUser};

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
