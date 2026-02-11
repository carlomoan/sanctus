use axum::{
    extract::{State, Multipart},
    http::StatusCode,
    Json,
};
use crate::{AppState, handlers::auth::AuthUser, models::user::UserRole};
use serde::Serialize;
use std::io::Cursor;
use csv::ReaderBuilder;
use calamine::{Reader, Xlsx, open_workbook_from_rs, Data, XlsxError};
use chrono::NaiveDate;
use rust_decimal::Decimal;

#[derive(Debug, Serialize)]
pub struct ImportResponse {
    pub success_count: usize,
    pub errors: Vec<String>,
}

pub async fn import_members(
    auth: AuthUser,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<ImportResponse>, (StatusCode, String)> {
    if auth.role == UserRole::Viewer {
        return Err((StatusCode::FORBIDDEN, "Unauthorized to import data".to_string()));
    }

    let mut success_count = 0;
    let mut errors = Vec::new();
    let mut data = Vec::new();
    let mut file_name = String::new();
    let mut target_parish_id = auth.parish_id;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or_default().to_string();
        if name == "file" {
            file_name = field.file_name().unwrap_or_default().to_string();
            let bytes = field.bytes().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            data = bytes.to_vec();
        } else if name == "parish_id" {
            let text = field.text().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            if let Ok(id) = uuid::Uuid::parse_str(&text) {
                target_parish_id = Some(id);
            }
        }
    }

    if data.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "No file uploaded".to_string()));
    }

    let parish_id = target_parish_id.ok_or((StatusCode::BAD_REQUEST, "User must be assigned to a parish or specify parish_id to import members".to_string()))?;

    if file_name.ends_with(".csv") {
        let mut rdr = ReaderBuilder::new()
            .has_headers(true)
            .from_reader(Cursor::new(data));

        for (i, result) in rdr.records().enumerate() {
            let record = match result {
                Ok(r) => r,
                Err(e) => {
                    errors.push(format!("Row {}: Invalid CSV record: {}", i + 2, e));
                    continue;
                }
            };

            let member_code = record.get(0).unwrap_or_default();
            let first_name = record.get(1).unwrap_or_default();
            let last_name = record.get(2).unwrap_or_default();
            
            if first_name.is_empty() || last_name.is_empty() {
                errors.push(format!("Row {}: Missing required names", i + 2));
                continue;
            }

            let res = sqlx::query!(
                r#"
                INSERT INTO member (parish_id, member_code, first_name, last_name)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (parish_id, member_code) DO NOTHING
                "#,
                parish_id, member_code, first_name, last_name
            )
            .execute(&state.db)
            .await;

            match res {
                Ok(_) => success_count += 1,
                Err(e) => errors.push(format!("Row {}: DB Error: {}", i + 2, e)),
            }
        }
    } else if file_name.ends_with(".xlsx") {
        let cursor = Cursor::new(data);
        let mut workbook: Xlsx<_> = open_workbook_from_rs(cursor).map_err(|e: XlsxError| (StatusCode::BAD_REQUEST, e.to_string()))?;
        
        if let Some(Ok(range)) = workbook.worksheet_range_at(0) {
            let rows = range.rows();
            for (i, row) in rows.skip(1).enumerate() {
                let get_str = |data: &Data| -> String {
                    match data {
                        Data::String(s) => s.clone(),
                        Data::Float(f) => f.to_string(),
                        Data::Int(i) => i.to_string(),
                        _ => String::new(),
                    }
                };

                let member_code = row.get(0).map(get_str).unwrap_or_default();
                let first_name = row.get(1).map(get_str).unwrap_or_default();
                let last_name = row.get(2).map(get_str).unwrap_or_default();

                if first_name.is_empty() || last_name.is_empty() {
                    errors.push(format!("Row {}: Missing required names", i + 2));
                    continue;
                }

                let res = sqlx::query(
                    r#"
                    INSERT INTO member (parish_id, member_code, first_name, last_name)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (parish_id, member_code) DO NOTHING
                    "#
                )
                .bind(parish_id)
                .bind(member_code)
                .bind(first_name)
                .bind(last_name)
                .execute(&state.db)
                .await;

                match res {
                    Ok(_) => success_count += 1,
                    Err(e) => errors.push(format!("Row {}: DB Error: {}", i + 2, e)),
                }
            }
        }
    } else {
        return Err((StatusCode::BAD_REQUEST, "Unsupported file format. Use .csv or .xlsx".to_string()));
    }

    Ok(Json(ImportResponse { success_count, errors }))
}

pub async fn import_transactions(
    auth: AuthUser,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<ImportResponse>, (StatusCode, String)> {
    if auth.role == UserRole::Viewer {
        return Err((StatusCode::FORBIDDEN, "Unauthorized to import data".to_string()));
    }

    let mut success_count = 0;
    let mut errors = Vec::new();
    let mut data = Vec::new();
    let mut file_name = String::new();
    let mut target_parish_id = auth.parish_id;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or_default().to_string();
        if name == "file" {
            file_name = field.file_name().unwrap_or_default().to_string();
            let bytes = field.bytes().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            data = bytes.to_vec();
        } else if name == "parish_id" {
            let text = field.text().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            if let Ok(id) = uuid::Uuid::parse_str(&text) {
                target_parish_id = Some(id);
            }
        }
    }

    if data.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "No file uploaded".to_string()));
    }

    let parish_id = target_parish_id.ok_or((StatusCode::BAD_REQUEST, "User must be assigned to a parish or specify parish_id to import transactions".to_string()))?;

    if file_name.ends_with(".csv") {
        let mut rdr = ReaderBuilder::new()
            .has_headers(true)
            .from_reader(Cursor::new(data));

        for (i, result) in rdr.records().enumerate() {
            let record = match result {
                Ok(r) => r,
                Err(e) => {
                    errors.push(format!("Row {}: Invalid CSV record: {}", i + 2, e));
                    continue;
                }
            };

            let category = record.get(0).unwrap_or_default();
            let amount_str = record.get(1).unwrap_or_default();
            let payment_method = record.get(2).unwrap_or_default();
            let date_str = record.get(3).unwrap_or_default();
            let description = record.get(4).unwrap_or_default();

            let amount = match amount_str.parse::<Decimal>() {
                Ok(a) => a,
                Err(_) => {
                    errors.push(format!("Row {}: Invalid amount: {}", i + 2, amount_str));
                    continue;
                }
            };

            let date = match NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
                Ok(d) => d,
                Err(_) => {
                    errors.push(format!("Row {}: Invalid date: {}", i + 2, date_str));
                    continue;
                }
            };

            let res = sqlx::query(
                r#"
                INSERT INTO income_transaction (parish_id, category, amount, payment_method, transaction_date, description, transaction_number)
                VALUES ($1, $2::transaction_category, $3, $4::payment_method, $5, $6, 'IMP-' || uuid_generate_v4())
                "#
            )
            .bind(parish_id)
            .bind(category)
            .bind(amount)
            .bind(payment_method)
            .bind(date)
            .bind(description)
            .execute(&state.db)
            .await;

            match res {
                Ok(_) => success_count += 1,
                Err(e) => errors.push(format!("Row {}: DB Error: {}", i + 2, e)),
            }
        }
    } else if file_name.ends_with(".xlsx") {
        let cursor = Cursor::new(data);
        let mut workbook: Xlsx<_> = open_workbook_from_rs(cursor).map_err(|e: XlsxError| (StatusCode::BAD_REQUEST, e.to_string()))?;
        
        if let Some(Ok(range)) = workbook.worksheet_range_at(0) {
            let rows = range.rows();
            for (i, row) in rows.skip(1).enumerate() {
                let get_str = |data: &Data| -> String {
                    match data {
                        Data::String(s) => s.clone(),
                        Data::Float(f) => f.to_string(),
                        Data::Int(i) => i.to_string(),
                        _ => String::new(),
                    }
                };

                let category = row.get(0).map(get_str).unwrap_or_default();
                let amount_str = row.get(1).map(get_str).unwrap_or_default();
                let payment_method = row.get(2).map(get_str).unwrap_or_default();
                let date_str = row.get(3).map(get_str).unwrap_or_default();
                let description = row.get(4).map(get_str).unwrap_or_default();

                let amount = match amount_str.parse::<Decimal>() {
                    Ok(a) => a,
                    Err(_) => {
                        errors.push(format!("Row {}: Invalid amount: {}", i + 2, amount_str));
                        continue;
                    }
                };

                let date = match NaiveDate::parse_from_str(&date_str, "%Y-%m-%d") {
                    Ok(d) => d,
                    Err(_) => {
                        errors.push(format!("Row {}: Invalid date: {}", i + 2, date_str));
                        continue;
                    }
                };

                let res = sqlx::query(
                    r#"
                    INSERT INTO income_transaction (parish_id, category, amount, payment_method, transaction_date, description, transaction_number)
                    VALUES ($1, $2::transaction_category, $3, $4::payment_method, $5, $6, 'IMP-' || uuid_generate_v4())
                    "#
                )
                .bind(parish_id)
                .bind(category)
                .bind(amount)
                .bind(payment_method)
                .bind(date)
                .bind(description)
                .execute(&state.db)
                .await;

                match res {
                    Ok(_) => success_count += 1,
                    Err(e) => errors.push(format!("Row {}: DB Error: {}", i + 2, e)),
                }
            }
        }
    } else {
        return Err((StatusCode::BAD_REQUEST, "Unsupported file format. Use .csv or .xlsx".to_string()));
    }

    Ok(Json(ImportResponse { success_count, errors }))
}
