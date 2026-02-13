use axum::http::StatusCode;
use uuid::Uuid;
use crate::models::user::UserRole;
use crate::handlers::auth::AuthUser;

/// Returns the parish_id the user is allowed to operate on.
/// - SuperAdmin: can operate on any parish (uses the requested parish_id)
/// - All others: must have a parish_id in their token and it must match the request
pub fn resolve_parish_id(
    auth: &AuthUser,
    requested_parish_id: Option<Uuid>,
) -> Result<Uuid, (StatusCode, String)> {
    match auth.role {
        UserRole::SuperAdmin => {
            // Diocese admin can target any parish; use requested or their own
            requested_parish_id
                .or(auth.parish_id)
                .ok_or((StatusCode::BAD_REQUEST, "parish_id is required".to_string()))
        }
        _ => {
            // Parish-scoped users MUST use their own parish_id
            let user_parish = auth.parish_id.ok_or((
                StatusCode::FORBIDDEN,
                "User is not assigned to a parish".to_string(),
            ))?;
            // If a parish_id was requested, it must match the user's parish
            if let Some(req) = requested_parish_id {
                if req != user_parish {
                    return Err((
                        StatusCode::FORBIDDEN,
                        "You can only access your own parish data".to_string(),
                    ));
                }
            }
            Ok(user_parish)
        }
    }
}

/// Check that the user has one of the allowed roles
pub fn require_role(
    auth: &AuthUser,
    allowed: &[UserRole],
) -> Result<(), (StatusCode, String)> {
    if allowed.contains(&auth.role) {
        Ok(())
    } else {
        Err((StatusCode::FORBIDDEN, "Insufficient permissions".to_string()))
    }
}

/// Check that the user can write (create/update/delete) data.
/// Viewers cannot write.
pub fn require_write(auth: &AuthUser) -> Result<(), (StatusCode, String)> {
    match auth.role {
        UserRole::Viewer => Err((StatusCode::FORBIDDEN, "Viewers have read-only access".to_string())),
        _ => Ok(()),
    }
}

/// Check that the user can manage finance operations
pub fn require_finance(auth: &AuthUser) -> Result<(), (StatusCode, String)> {
    require_role(auth, &[UserRole::SuperAdmin, UserRole::ParishAdmin, UserRole::Accountant])
}

/// Check that the user can manage admin operations (parishes, users, settings)
pub fn require_admin(auth: &AuthUser) -> Result<(), (StatusCode, String)> {
    require_role(auth, &[UserRole::SuperAdmin, UserRole::ParishAdmin])
}
