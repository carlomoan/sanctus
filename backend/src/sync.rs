use axum::{
    extract::State,
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use crate::AppState;
use crate::models::transaction::ExpenseVoucher;
use crate::models::member::{Member, SacramentRecord};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct SyncRequest {
    pub device_id: String,
    pub changes: Vec<ChangeRecord>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChangeRecord {
    pub table: String,
    pub operation: String, // 'insert', 'update', 'delete'
    pub data: serde_json::Value,
    pub timestamp: String,
}

#[derive(Debug, Serialize)]
pub struct SyncResponse {
    pub status: String,
    pub synced_count: usize,
    pub errors: Vec<String>,
}

pub async fn sync_handler(
    State(state): State<AppState>,
    Json(payload): Json<SyncRequest>,
) -> impl IntoResponse {
    tracing::info!("Received sync request from device: {}", payload.device_id);
    tracing::info!("Processing {} changes...", payload.changes.len());

    let mut synced_count = 0;
    let mut errors = Vec::new();

    for change in payload.changes {
        let result = match change.table.as_str() {
            "income_transaction" => handle_income_transaction(&state.db, &change).await,
            "expense_voucher" => handle_expense_voucher(&state.db, &change).await,
            "member" => handle_member(&state.db, &change).await,
            "sacrament" => handle_sacrament(&state.db, &change).await,
            "family" => handle_family(&state.db, &change).await,
            "parish" => handle_parish(&state.db, &change).await,
            "diocese" => handle_diocese(&state.db, &change).await,
            "cluster" => handle_cluster(&state.db, &change).await,
            "scc" => handle_scc(&state.db, &change).await,
            "budget" => handle_budget(&state.db, &change).await,
            _ => {
                tracing::warn!("Unknown table in sync request: {}", change.table);
                Ok(()) // Skip unknown tables
            }
        };

        match result {
            Ok(_) => synced_count += 1,
            Err(e) => {
                let msg = format!("Error processing change for {}: {}", change.table, e);
                tracing::error!("{}", msg);
                errors.push(msg);
            }
        }
    }

    let response = SyncResponse {
        status: if errors.is_empty() { "success".to_string() } else { "partial_success".to_string() },
        synced_count,
        errors,
    };

    (StatusCode::OK, Json(response))
}

async fn handle_income_transaction(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    use crate::models::transaction::IncomeTransaction;
    
    match change.operation.as_str() {
        "insert" => {
            let item: IncomeTransaction = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO income_transaction (
                    id, parish_id, member_id, family_id, transaction_number, category, amount,
                    payment_method, income_type, transaction_date, transaction_time, description,
                    reference_number, received_by, receipt_printed, is_synced,
                    synced_at, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, $18)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.member_id)
            .bind(item.family_id)
            .bind(item.transaction_number)
            .bind(item.category)
            .bind(item.amount)
            .bind(item.payment_method)
            .bind(item.income_type)
            .bind(item.transaction_date)
            .bind(item.transaction_time)
            .bind(item.description)
            .bind(item.reference_number)
            .bind(item.received_by)
            .bind(item.receipt_printed)
            .bind(item.is_synced)
            .bind(item.synced_at)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
            let item: IncomeTransaction = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE income_transaction SET
                    parish_id = $2, member_id = $3, family_id = $4, transaction_number = $5, category = $6,
                    amount = $7, payment_method = $8, income_type = $9, transaction_date = $10, transaction_time = $11,
                    description = $12, reference_number = $13, received_by = $14, receipt_printed = $15,
                    is_synced = $16, updated_at = $17
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.member_id)
            .bind(item.family_id)
            .bind(item.transaction_number)
            .bind(item.category)
            .bind(item.amount)
            .bind(item.payment_method)
            .bind(item.income_type)
            .bind(item.transaction_date)
            .bind(item.transaction_time)
            .bind(item.description)
            .bind(item.reference_number)
            .bind(item.received_by)
            .bind(item.receipt_printed)
            .bind(item.is_synced)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
            let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
            let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

            sqlx::query("UPDATE income_transaction SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => return Err(format!("Unknown operation: {}", change.operation))
    }
    Ok(())
}

async fn handle_expense_voucher(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    match change.operation.as_str() {
        "insert" => {
            let item: ExpenseVoucher = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO expense_voucher (
                    id, parish_id, voucher_number, category, amount, payment_method,
                    payee_name, payee_phone, expense_date, description, reference_number,
                    approval_status, requested_by, approved_by, approved_at, rejection_reason,
                    paid, paid_at, is_synced, synced_at, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), $20, $21)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.voucher_number)
            .bind(item.category)
            .bind(item.amount)
            .bind(item.payment_method)
            .bind(item.payee_name)
            .bind(item.payee_phone)
            .bind(item.expense_date)
            .bind(item.description)
            .bind(item.reference_number)
            .bind(item.approval_status)
            .bind(item.requested_by)
            .bind(item.approved_by)
            .bind(item.approved_at)
            .bind(item.rejection_reason)
            .bind(item.paid)
            .bind(item.paid_at)
            .bind(true)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
             let item: ExpenseVoucher = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE expense_voucher SET
                    parish_id = $2, voucher_number = $3, category = $4, amount = $5,
                    payment_method = $6, payee_name = $7, payee_phone = $8, expense_date = $9,
                    description = $10, reference_number = $11, approval_status = $12,
                    requested_by = $13, approved_by = $14, approved_at = $15, rejection_reason = $16,
                    paid = $17, paid_at = $18, is_synced = $19, synced_at = NOW(), updated_at = $20
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.voucher_number)
            .bind(item.category)
            .bind(item.amount)
            .bind(item.payment_method)
            .bind(item.payee_name)
            .bind(item.payee_phone)
            .bind(item.expense_date)
            .bind(item.description)
            .bind(item.reference_number)
            .bind(item.approval_status)
            .bind(item.requested_by)
            .bind(item.approved_by)
            .bind(item.approved_at)
            .bind(item.rejection_reason)
            .bind(item.paid)
            .bind(item.paid_at)
            .bind(true)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
             let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
             let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

             sqlx::query("UPDATE expense_voucher SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => {
            return Err(format!("Unknown operation: {}", change.operation));
        }
    }
    Ok(())
}

async fn handle_member(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    match change.operation.as_str() {
        "insert" => {
            let item: Member = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO member (
                    id, parish_id, family_id, scc_id, member_code, first_name, middle_name, last_name,
                    date_of_birth, gender, marital_status, national_id, occupation, email, phone_number,
                    physical_address, photo_url, family_role, notes, is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.family_id)
            .bind(item.scc_id)
            .bind(item.member_code)
            .bind(item.first_name)
            .bind(item.middle_name)
            .bind(item.last_name)
            .bind(item.date_of_birth)
            .bind(item.gender)
            .bind(item.marital_status)
            .bind(item.national_id)
            .bind(item.occupation)
            .bind(item.email)
            .bind(item.phone_number)
            .bind(item.physical_address)
            .bind(item.photo_url)
            .bind(item.family_role)
            .bind(item.notes)
            .bind(item.is_active)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
             let item: Member = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE member SET
                    parish_id = $2, family_id = $3, scc_id = $4, member_code = $5, first_name = $6,
                    middle_name = $7, last_name = $8, date_of_birth = $9, gender = $10,
                    marital_status = $11, national_id = $12, occupation = $13, email = $14,
                    phone_number = $15, physical_address = $16, photo_url = $17,
                    family_role = $18, notes = $19, is_active = $20, updated_at = $21
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.family_id)
            .bind(item.scc_id)
            .bind(item.member_code)
            .bind(item.first_name)
            .bind(item.middle_name)
            .bind(item.last_name)
            .bind(item.date_of_birth)
            .bind(item.gender)
            .bind(item.marital_status)
            .bind(item.national_id)
            .bind(item.occupation)
            .bind(item.email)
            .bind(item.phone_number)
            .bind(item.physical_address)
            .bind(item.photo_url)
            .bind(item.family_role)
            .bind(item.notes)
            .bind(item.is_active)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
             let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
             let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

             sqlx::query("UPDATE member SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => {
            return Err(format!("Unknown operation: {}", change.operation));
        }
    }
    Ok(())
}

async fn handle_sacrament(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    match change.operation.as_str() {
        "insert" => {
            let item: SacramentRecord = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO sacrament_record (
                    id, member_id, sacrament_type, sacrament_date, officiating_minister,
                    parish_id, church_name, certificate_number, godparent_1_name, godparent_2_name,
                    spouse_id, spouse_name, witnesses, notes, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.member_id)
            .bind(item.sacrament_type)
            .bind(item.sacrament_date)
            .bind(item.officiating_minister)
            .bind(item.parish_id)
            .bind(item.church_name)
            .bind(item.certificate_number)
            .bind(item.godparent_1_name)
            .bind(item.godparent_2_name)
            .bind(item.spouse_id)
            .bind(item.spouse_name)
            .bind(item.witnesses)
            .bind(item.notes)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
             let item: SacramentRecord = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE sacrament_record SET
                    member_id = $2, sacrament_type = $3, sacrament_date = $4, officiating_minister = $5,
                    parish_id = $6, church_name = $7, certificate_number = $8, godparent_1_name = $9,
                    godparent_2_name = $10, spouse_id = $11, spouse_name = $12, witnesses = $13,
                    notes = $14, updated_at = $15
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.member_id)
            .bind(item.sacrament_type)
            .bind(item.sacrament_date)
            .bind(item.officiating_minister)
            .bind(item.parish_id)
            .bind(item.church_name)
            .bind(item.certificate_number)
            .bind(item.godparent_1_name)
            .bind(item.godparent_2_name)
            .bind(item.spouse_id)
            .bind(item.spouse_name)
            .bind(item.witnesses)
            .bind(item.notes)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
             let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
             let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

             sqlx::query("UPDATE sacrament_record SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => {
            return Err(format!("Unknown operation: {}", change.operation));
        }
    }
    Ok(())
}

async fn handle_family(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    use crate::models::family::Family;
    
    match change.operation.as_str() {
        "insert" => {
            let item: Family = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO family (
                    id, parish_id, scc_id, family_code, family_name, head_of_family_id,
                    physical_address, postal_address, primary_phone, secondary_phone, email, notes,
                    is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.scc_id)
            .bind(&item.family_code)
            .bind(&item.family_name)
            .bind(item.head_of_family_id)
            .bind(&item.physical_address)
            .bind(&item.postal_address)
            .bind(&item.primary_phone)
            .bind(&item.secondary_phone)
            .bind(&item.email)
            .bind(&item.notes)
            .bind(item.is_active)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
            let item: Family = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE family SET
                    parish_id = $2, scc_id = $3, family_code = $4, family_name = $5, head_of_family_id = $6,
                    physical_address = $7, postal_address = $8, primary_phone = $9, secondary_phone = $10,
                    email = $11, notes = $12, is_active = $13, updated_at = $14
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.scc_id)
            .bind(&item.family_code)
            .bind(&item.family_name)
            .bind(item.head_of_family_id)
            .bind(&item.physical_address)
            .bind(&item.postal_address)
            .bind(&item.primary_phone)
            .bind(&item.secondary_phone)
            .bind(&item.email)
            .bind(&item.notes)
            .bind(item.is_active)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
            let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
            let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

            sqlx::query("UPDATE family SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => return Err(format!("Unknown operation: {}", change.operation))
    }
    Ok(())
}

async fn handle_parish(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    use crate::models::parish::Parish;
    
    match change.operation.as_str() {
        "insert" => {
            let item: Parish = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO parish (
                    id, diocese_id, parish_code, parish_name, patron_saint, priest_name, priest_id,
                    established_date, physical_address, postal_address, contact_email, contact_phone,
                    bank_account_name, bank_account_number, bank_name, bank_branch, mobile_money_name,
                    mobile_money_number, mobile_money_account_name, latitude, longitude, timezone,
                    is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.diocese_id)
            .bind(&item.parish_code)
            .bind(&item.parish_name)
            .bind(&item.patron_saint)
            .bind(&item.priest_name)
            .bind(item.priest_id)
            .bind(item.established_date)
            .bind(&item.physical_address)
            .bind(&item.postal_address)
            .bind(&item.contact_email)
            .bind(&item.contact_phone)
            .bind(&item.bank_account_name)
            .bind(&item.bank_account_number)
            .bind(&item.bank_name)
            .bind(&item.bank_branch)
            .bind(&item.mobile_money_name)
            .bind(&item.mobile_money_number)
            .bind(&item.mobile_money_account_name)
            .bind(item.latitude)
            .bind(item.longitude)
            .bind(&item.timezone)
            .bind(item.is_active)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
            let item: Parish = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE parish SET
                    diocese_id = $2, parish_code = $3, parish_name = $4, patron_saint = $5, priest_name = $6,
                    priest_id = $7, established_date = $8, physical_address = $9, postal_address = $10,
                    contact_email = $11, contact_phone = $12, bank_account_name = $13, bank_account_number = $14,
                    bank_name = $15, bank_branch = $16, mobile_money_name = $17, mobile_money_number = $18,
                    mobile_money_account_name = $19, latitude = $20, longitude = $21, timezone = $22,
                    is_active = $23, updated_at = $24
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.diocese_id)
            .bind(&item.parish_code)
            .bind(&item.parish_name)
            .bind(&item.patron_saint)
            .bind(&item.priest_name)
            .bind(item.priest_id)
            .bind(item.established_date)
            .bind(&item.physical_address)
            .bind(&item.postal_address)
            .bind(&item.contact_email)
            .bind(&item.contact_phone)
            .bind(&item.bank_account_name)
            .bind(&item.bank_account_number)
            .bind(&item.bank_name)
            .bind(&item.bank_branch)
            .bind(&item.mobile_money_name)
            .bind(&item.mobile_money_number)
            .bind(&item.mobile_money_account_name)
            .bind(item.latitude)
            .bind(item.longitude)
            .bind(&item.timezone)
            .bind(item.is_active)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
            let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
            let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

            sqlx::query("UPDATE parish SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => return Err(format!("Unknown operation: {}", change.operation))
    }
    Ok(())
}

async fn handle_diocese(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    use crate::models::diocese::Diocese;
    
    match change.operation.as_str() {
        "insert" => {
            let item: Diocese = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO diocese (
                    id, diocese_code, diocese_name, bishop_name, established_date,
                    headquarters_address, contact_email, contact_phone, country, currency_code,
                    logo_url, is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(&item.diocese_code)
            .bind(&item.diocese_name)
            .bind(&item.bishop_name)
            .bind(item.established_date)
            .bind(&item.headquarters_address)
            .bind(&item.contact_email)
            .bind(&item.contact_phone)
            .bind(&item.country)
            .bind(&item.currency_code)
            .bind(&item.logo_url)
            .bind(&item.is_active)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
            let item: Diocese = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE diocese SET
                    diocese_code = $2, diocese_name = $3, bishop_name = $4, established_date = $5,
                    headquarters_address = $6, contact_email = $7, contact_phone = $8, country = $9,
                    currency_code = $10, logo_url = $11, is_active = $12, updated_at = $13
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(&item.diocese_code)
            .bind(&item.diocese_name)
            .bind(&item.bishop_name)
            .bind(item.established_date)
            .bind(&item.headquarters_address)
            .bind(&item.contact_email)
            .bind(&item.contact_phone)
            .bind(&item.country)
            .bind(&item.currency_code)
            .bind(&item.logo_url)
            .bind(&item.is_active)
            .bind(&item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
            let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
            let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

            sqlx::query("UPDATE diocese SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => return Err(format!("Unknown operation: {}", change.operation))
    }
    Ok(())
}

async fn handle_cluster(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    use crate::models::cluster::Cluster;
    
    match change.operation.as_str() {
        "insert" => {
            let item: Cluster = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO cluster (
                    id, parish_id, cluster_code, cluster_name, location_description, leader_name,
                    is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(&item.cluster_code)
            .bind(&item.cluster_name)
            .bind(&item.location_description)
            .bind(&item.leader_name)
            .bind(item.is_active)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
            let item: Cluster = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE cluster SET
                    parish_id = $2, cluster_code = $3, cluster_name = $4, location_description = $5,
                    leader_name = $6, is_active = $7, updated_at = $8
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(&item.cluster_code)
            .bind(&item.cluster_name)
            .bind(&item.location_description)
            .bind(&item.leader_name)
            .bind(item.is_active)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
            let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
            let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

            sqlx::query("UPDATE cluster SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => return Err(format!("Unknown operation: {}", change.operation))
    }
    Ok(())
}

async fn handle_scc(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    use crate::models::scc::Scc;
    
    match change.operation.as_str() {
        "insert" => {
            let item: Scc = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO scc (
                    id, parish_id, cluster_id, scc_code, scc_name, patron_saint, leader_name,
                    location_description, meeting_day, meeting_time, is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.cluster_id)
            .bind(&item.scc_code)
            .bind(&item.scc_name)
            .bind(&item.patron_saint)
            .bind(&item.leader_name)
            .bind(&item.location_description)
            .bind(&item.meeting_day)
            .bind(&item.meeting_time)
            .bind(&item.is_active)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
            let item: Scc = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE scc SET
                    parish_id = $2, cluster_id = $3, scc_code = $4, scc_name = $5, patron_saint = $6,
                    leader_name = $7, location_description = $8, meeting_day = $9, meeting_time = $10,
                    is_active = $11, updated_at = $12
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(item.cluster_id)
            .bind(&item.scc_code)
            .bind(&item.scc_name)
            .bind(&item.patron_saint)
            .bind(&item.leader_name)
            .bind(&item.location_description)
            .bind(&item.meeting_day)
            .bind(&item.meeting_time)
            .bind(&item.is_active)
            .bind(&item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
            let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
            let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

            sqlx::query("UPDATE scc SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => return Err(format!("Unknown operation: {}", change.operation))
    }
    Ok(())
}

async fn handle_budget(pool: &PgPool, change: &ChangeRecord) -> Result<(), String> {
    use crate::models::budget::Budget;
    
    match change.operation.as_str() {
        "insert" => {
            let item: Budget = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;

            sqlx::query(
                r#"
                INSERT INTO budget (
                    id, parish_id, category, amount, fiscal_year, fiscal_month, description,
                    created_by, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(&item.category)
            .bind(item.amount)
            .bind(item.fiscal_year)
            .bind(item.fiscal_month)
            .bind(&item.description)
            .bind(item.created_by)
            .bind(item.created_at)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "update" => {
            let item: Budget = serde_json::from_value(change.data.clone())
                .map_err(|e| format!("Deserialization error: {}", e))?;
            
            sqlx::query(
                r#"
                UPDATE budget SET
                    parish_id = $2, category = $3, amount = $4, fiscal_year = $5, fiscal_month = $6,
                    description = $7, updated_at = $8
                WHERE id = $1
                "#
            )
            .bind(item.id)
            .bind(item.parish_id)
            .bind(&item.category)
            .bind(item.amount)
            .bind(item.fiscal_year)
            .bind(item.fiscal_month)
            .bind(&item.description)
            .bind(item.updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        }
        "delete" => {
            let id_str = change.data.get("id").and_then(|v| v.as_str())
                .ok_or("Missing ID for delete".to_string())?;
            let id = Uuid::parse_str(id_str)
                .map_err(|e| format!("Invalid UUID: {}", e))?;

            sqlx::query("UPDATE budget SET deleted_at = NOW() WHERE id = $1")
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| format!("Database error: {}", e))?;
        }
        _ => return Err(format!("Unknown operation: {}", change.operation))
    }
    Ok(())
}
