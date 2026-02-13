use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{NaiveDate, DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "gender_type", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum GenderType {
    Male,
    Female,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "marital_status", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MaritalStatus {
    Single,
    Married,
    Widowed,
    Separated,
    Divorced,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "sacrament_type", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SacramentType {
    Baptism,
    FirstCommunion,
    Confirmation,
    Marriage,
    HolyOrders,
    AnointingOfSick,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "family_role", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FamilyRole {
    Head,
    Spouse,
    Member,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Member {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub family_id: Option<Uuid>,
    pub scc_id: Option<Uuid>,
    pub member_code: String,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub date_of_birth: Option<NaiveDate>,
    pub gender: Option<GenderType>,
    pub marital_status: Option<MaritalStatus>,
    pub national_id: Option<String>,
    pub occupation: Option<String>,
    pub email: Option<String>,
    pub phone_number: Option<String>,
    pub physical_address: Option<String>,
    pub photo_url: Option<String>,
    pub family_role: Option<FamilyRole>,
    pub notes: Option<String>,
    pub is_active: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SacramentRecord {
    pub id: Uuid,
    pub member_id: Uuid,
    pub sacrament_type: SacramentType,
    pub sacrament_date: NaiveDate,
    pub officiating_minister: Option<String>,
    pub parish_id: Uuid,
    pub church_name: Option<String>,
    pub certificate_number: Option<String>,
    pub godparent_1_name: Option<String>,
    pub godparent_2_name: Option<String>,
    pub spouse_id: Option<Uuid>,
    pub spouse_name: Option<String>,
    pub witnesses: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

