use axum::{
    extract::{FromRequestParts, State},
    http::{header, request::Parts, StatusCode},
    async_trait,
    Json,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use crate::models::user::{UserRole, UserProfile, LoginRequest, AuthResponse, User};
use crate::AppState;
use uuid::Uuid;
use chrono::Utc;
use bcrypt::verify;
use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;
use base64::{Engine as _, engine::general_purpose};

fn verify_password(password: &str, hash: &str) -> bool {
    if hash.starts_with("pbkdf2_sha256$") {
        let parts: Vec<&str> = hash.split('$').collect();
        if parts.len() != 4 {
            return false;
        }
        let iterations: u32 = parts[1].parse().unwrap_or(0);
        let salt = parts[2];
        let expected_hash_b64 = parts[3];

        let mut dk = [0u8; 32];
        pbkdf2_hmac::<Sha256>(
            password.as_bytes(),
            salt.as_bytes(),
            iterations,
            &mut dk,
        );

        let dk_b64 = general_purpose::STANDARD.encode(dk);
        tracing::debug!("PBKDF2 verification: iterations={}, salt={}, expected={}, actual={}", iterations, salt, expected_hash_b64, dk_b64);
        return dk_b64 == expected_hash_b64;
    }
    
    let result = verify(password, hash).unwrap_or(false);
    tracing::debug!("Bcrypt verification result: {}", result);
    result
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub role: UserRole,
    pub parish_id: Option<Uuid>,
    pub exp: usize,
}

pub fn create_jwt(user_id: Uuid, role: UserRole, parish_id: Option<Uuid>) -> Result<String, StatusCode> {
    let expiration = Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        role,
        parish_id,
        exp: expiration,
    };

    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

pub struct AuthUser {
    pub user_id: Uuid,
    pub role: UserRole,
    pub parish_id: Option<Uuid>,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or((StatusCode::UNAUTHORIZED, "Missing authorization header".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err((StatusCode::UNAUTHORIZED, "Invalid authorization header".to_string()));
        }

        let token = &auth_header[7..];
        let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

        Ok(AuthUser {
            user_id: token_data.claims.sub,
            role: token_data.claims.role,
            parish_id: token_data.claims.parish_id,
        })
    }
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, String)> {
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM app_user WHERE (username = $1 OR email = $1) AND is_active = TRUE AND deleted_at IS NULL"
    )
    .bind(&payload.username_or_email)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::UNAUTHORIZED, "Invalid credentials".to_string()))?;

    if !verify_password(&payload.password, &user.password_hash) {
        return Err((StatusCode::UNAUTHORIZED, "Invalid credentials".to_string()));
    }

    let token = create_jwt(user.id, user.role, user.parish_id).map_err(|s| (s, "Internal server error".to_string()))?;

    Ok(Json(AuthResponse {
        token,
        user: UserProfile {
            id: user.id,
            parish_id: user.parish_id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            phone_number: user.phone_number,
            role: user.role,
            profile_photo_url: user.profile_photo_url,
        },
    }))
}
