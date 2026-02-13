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

pub async fn import_clusters(
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

    let parish_id = target_parish_id.ok_or((StatusCode::BAD_REQUEST, "parish_id is required".to_string()))?;

    // CSV columns: cluster_code, cluster_name, location_description, leader_name
    let rows = parse_file_rows(&data, &file_name)?;

    for (i, row) in rows.iter().enumerate() {
        let cluster_code = row.get(0).cloned().unwrap_or_default();
        let cluster_name = row.get(1).cloned().unwrap_or_default();
        let location_description = row.get(2).cloned().unwrap_or_default();
        let leader_name = row.get(3).cloned().unwrap_or_default();

        if cluster_name.is_empty() {
            errors.push(format!("Row {}: Missing cluster_name", i + 2));
            continue;
        }

        let res = sqlx::query(
            r#"INSERT INTO cluster (parish_id, cluster_code, cluster_name, location_description, leader_name)
               VALUES ($1, $2, $3, NULLIF($4,''), NULLIF($5,''))
               ON CONFLICT DO NOTHING"#
        )
        .bind(parish_id).bind(&cluster_code).bind(&cluster_name)
        .bind(&location_description).bind(&leader_name)
        .execute(&state.db).await;

        match res {
            Ok(_) => success_count += 1,
            Err(e) => errors.push(format!("Row {}: DB Error: {}", i + 2, e)),
        }
    }

    Ok(Json(ImportResponse { success_count, errors }))
}

pub async fn import_sccs(
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

    let parish_id = target_parish_id.ok_or((StatusCode::BAD_REQUEST, "parish_id is required".to_string()))?;

    // CSV columns: scc_code, scc_name, cluster_code (optional lookup), patron_saint, leader_name, location_description, meeting_day, meeting_time
    let rows = parse_file_rows(&data, &file_name)?;

    for (i, row) in rows.iter().enumerate() {
        let scc_code = row.get(0).cloned().unwrap_or_default();
        let scc_name = row.get(1).cloned().unwrap_or_default();
        let cluster_code = row.get(2).cloned().unwrap_or_default();
        let patron_saint = row.get(3).cloned().unwrap_or_default();
        let leader_name = row.get(4).cloned().unwrap_or_default();
        let location_description = row.get(5).cloned().unwrap_or_default();
        let meeting_day = row.get(6).cloned().unwrap_or_default();
        let meeting_time = row.get(7).cloned().unwrap_or_default();

        if scc_name.is_empty() {
            errors.push(format!("Row {}: Missing scc_name", i + 2));
            continue;
        }

        // Resolve cluster_id from cluster_code if provided
        let cluster_id: Option<uuid::Uuid> = if !cluster_code.is_empty() {
            sqlx::query_scalar::<_, uuid::Uuid>(
                "SELECT id FROM cluster WHERE parish_id = $1 AND cluster_code = $2 AND deleted_at IS NULL"
            )
            .bind(parish_id).bind(&cluster_code)
            .fetch_optional(&state.db).await.unwrap_or(None)
        } else {
            None
        };

        let res = sqlx::query(
            r#"INSERT INTO scc (parish_id, cluster_id, scc_code, scc_name, patron_saint, leader_name, location_description, meeting_day, meeting_time)
               VALUES ($1, $2, $3, $4, NULLIF($5,''), NULLIF($6,''), NULLIF($7,''), NULLIF($8,''), NULLIF($9,''))
               ON CONFLICT DO NOTHING"#
        )
        .bind(parish_id).bind(cluster_id).bind(&scc_code).bind(&scc_name)
        .bind(&patron_saint).bind(&leader_name).bind(&location_description)
        .bind(&meeting_day).bind(&meeting_time)
        .execute(&state.db).await;

        match res {
            Ok(_) => success_count += 1,
            Err(e) => errors.push(format!("Row {}: DB Error: {}", i + 2, e)),
        }
    }

    Ok(Json(ImportResponse { success_count, errors }))
}

pub async fn import_families(
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

    let parish_id = target_parish_id.ok_or((StatusCode::BAD_REQUEST, "parish_id is required".to_string()))?;

    // CSV columns: family_code, family_name, scc_code (optional lookup), physical_address, primary_phone, email, notes
    let rows = parse_file_rows(&data, &file_name)?;

    for (i, row) in rows.iter().enumerate() {
        let family_code = row.get(0).cloned().unwrap_or_default();
        let family_name = row.get(1).cloned().unwrap_or_default();
        let scc_code = row.get(2).cloned().unwrap_or_default();
        let physical_address = row.get(3).cloned().unwrap_or_default();
        let primary_phone = row.get(4).cloned().unwrap_or_default();
        let email = row.get(5).cloned().unwrap_or_default();
        let notes = row.get(6).cloned().unwrap_or_default();

        if family_name.is_empty() {
            errors.push(format!("Row {}: Missing family_name", i + 2));
            continue;
        }

        // Resolve scc_id from scc_code if provided
        let scc_id: Option<uuid::Uuid> = if !scc_code.is_empty() {
            sqlx::query_scalar::<_, uuid::Uuid>(
                "SELECT id FROM scc WHERE parish_id = $1 AND scc_code = $2 AND deleted_at IS NULL"
            )
            .bind(parish_id).bind(&scc_code)
            .fetch_optional(&state.db).await.unwrap_or(None)
        } else {
            None
        };

        let res = sqlx::query(
            r#"INSERT INTO family (parish_id, scc_id, family_code, family_name, physical_address, primary_phone, email, notes)
               VALUES ($1, $2, $3, $4, NULLIF($5,''), NULLIF($6,''), NULLIF($7,''), NULLIF($8,''))
               ON CONFLICT DO NOTHING"#
        )
        .bind(parish_id).bind(scc_id).bind(&family_code).bind(&family_name)
        .bind(&physical_address).bind(&primary_phone).bind(&email).bind(&notes)
        .execute(&state.db).await;

        match res {
            Ok(_) => success_count += 1,
            Err(e) => errors.push(format!("Row {}: DB Error: {}", i + 2, e)),
        }
    }

    Ok(Json(ImportResponse { success_count, errors }))
}

/// Helper: parse CSV or XLSX file into Vec of rows (each row is Vec<String>)
fn parse_file_rows(data: &[u8], file_name: &str) -> Result<Vec<Vec<String>>, (StatusCode, String)> {
    let mut rows = Vec::new();

    if file_name.ends_with(".csv") {
        let mut rdr = ReaderBuilder::new()
            .has_headers(true)
            .from_reader(Cursor::new(data));

        for result in rdr.records() {
            let record = result.map_err(|e| (StatusCode::BAD_REQUEST, format!("CSV parse error: {}", e)))?;
            let row: Vec<String> = record.iter().map(|s| s.to_string()).collect();
            rows.push(row);
        }
    } else if file_name.ends_with(".xlsx") {
        let cursor = Cursor::new(data);
        let mut workbook: Xlsx<_> = open_workbook_from_rs(cursor).map_err(|e: XlsxError| (StatusCode::BAD_REQUEST, e.to_string()))?;

        if let Some(Ok(range)) = workbook.worksheet_range_at(0) {
            let get_str = |d: &Data| -> String {
                match d {
                    Data::String(s) => s.clone(),
                    Data::Float(f) => f.to_string(),
                    Data::Int(i) => i.to_string(),
                    _ => String::new(),
                }
            };
            for row in range.rows().skip(1) {
                let r: Vec<String> = row.iter().map(get_str).collect();
                rows.push(r);
            }
        }
    } else {
        return Err((StatusCode::BAD_REQUEST, "Unsupported file format. Use .csv or .xlsx".to_string()));
    }

    Ok(rows)
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
