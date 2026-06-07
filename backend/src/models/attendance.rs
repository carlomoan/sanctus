use serde::{Serialize, Deserialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{NaiveDate, NaiveTime};

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "attendance_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AttendanceStatus { Present, Absent, Excused }

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AttendanceRecord {
    pub id: Uuid,
    pub parish_id: Uuid,
    pub member_id: Option<Uuid>,
    pub scc_id: Option<Uuid>,
    pub event_id: Option<Uuid>,
    pub attendance_date: NaiveDate,
    pub status: AttendanceStatus,
    pub check_in_time: Option<NaiveTime>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAttendanceRequest {
    pub member_id: Option<Uuid>,
    pub scc_id: Option<Uuid>,
    pub event_id: Option<Uuid>,
    pub attendance_date: NaiveDate,
    pub status: AttendanceStatus,
    pub check_in_time: Option<NaiveTime>,
    pub notes: Option<String>,
}