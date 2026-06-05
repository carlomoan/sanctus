use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{NaiveDate, NaiveTime, DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "event_scope", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventScope {
    Diocese,
    Parish,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "event_type", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventType {
    Mass,
    Meeting,
    Conference,
    Retreat,
    Workshop,
    Social,
    Fundraising,
    Anniversary,
    FeastDay,
    Other,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "event_status", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventStatus {
    Planned,
    Scheduled,
    InProgress,
    Completed,
    Cancelled,
    Postponed,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "recurrence_pattern", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RecurrencePattern {
    None,
    Daily,
    Weekly,
    Monthly,
    Yearly,
    Custom,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Event {
    pub id: Uuid,
    pub parish_id: Option<Uuid>, // Optional for diocese-level events
    pub diocese_id: Option<Uuid>, // Optional for parish-level events
    pub scope: EventScope,
    pub title: String,
    pub description: Option<String>,
    pub event_type: EventType,
    pub event_status: EventStatus,
    pub start_date: NaiveDate,
    pub start_time: Option<NaiveTime>,
    pub end_date: NaiveDate,
    pub end_time: Option<NaiveTime>,
    pub location: Option<String>,
    pub organizer_id: Option<Uuid>,
    pub organizer_name: Option<String>,
    pub max_participants: Option<i32>,
    pub current_participants: Option<i32>,
    pub registration_required: Option<bool>,
    pub registration_deadline: Option<NaiveDate>,
    pub fee_amount: Option<rust_decimal::Decimal>,
    pub is_public: Option<bool>,
    pub is_liturgical: Option<bool>,
    pub recurrence_pattern: RecurrencePattern,
    pub recurrence_end_date: Option<NaiveDate>,
    pub parent_event_id: Option<Uuid>,
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEventRequest {
    pub parish_id: Option<Uuid>, // Optional for diocese-level events
    pub diocese_id: Option<Uuid>, // Optional for parish-level events
    pub scope: EventScope,
    pub title: String,
    pub description: Option<String>,
    pub event_type: EventType,
    pub start_date: NaiveDate,
    pub start_time: Option<NaiveTime>,
    pub end_date: NaiveDate,
    pub end_time: Option<NaiveTime>,
    pub location: Option<String>,
    pub organizer_id: Option<Uuid>,
    pub organizer_name: Option<String>,
    pub max_participants: Option<i32>,
    pub registration_required: Option<bool>,
    pub registration_deadline: Option<NaiveDate>,
    pub fee_amount: Option<rust_decimal::Decimal>,
    pub is_public: Option<bool>,
    pub is_liturgical: Option<bool>,
    pub recurrence_pattern: RecurrencePattern,
    pub recurrence_end_date: Option<NaiveDate>,
    pub parent_event_id: Option<Uuid>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEventRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_type: Option<EventType>,
    pub event_status: Option<EventStatus>,
    pub start_date: Option<NaiveDate>,
    pub start_time: Option<NaiveTime>,
    pub end_date: Option<NaiveDate>,
    pub end_time: Option<NaiveTime>,
    pub location: Option<String>,
    pub organizer_id: Option<Uuid>,
    pub organizer_name: Option<String>,
    pub max_participants: Option<i32>,
    pub current_participants: Option<i32>,
    pub registration_required: Option<bool>,
    pub registration_deadline: Option<NaiveDate>,
    pub fee_amount: Option<rust_decimal::Decimal>,
    pub is_public: Option<bool>,
    pub is_liturgical: Option<bool>,
    pub recurrence_pattern: Option<RecurrencePattern>,
    pub recurrence_end_date: Option<NaiveDate>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct EventQuery {
    pub parish_id: Option<Uuid>,
    pub diocese_id: Option<Uuid>,
    pub scope: Option<EventScope>,
    pub event_type: Option<EventType>,
    pub event_status: Option<EventStatus>,
    pub start_date_from: Option<NaiveDate>,
    pub start_date_to: Option<NaiveDate>,
    pub is_liturgical: Option<bool>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct EventParticipant {
    pub id: Uuid,
    pub event_id: Uuid,
    pub member_id: Option<Uuid>,
    pub family_id: Option<Uuid>,
    pub participant_name: String,
    pub participant_phone: Option<String>,
    pub participant_email: Option<String>,
    pub registration_date: NaiveDate,
    pub fee_paid: Option<bool>,
    pub fee_amount: Option<rust_decimal::Decimal>,
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct AddParticipantRequest {
    pub event_id: Uuid,
    pub member_id: Option<Uuid>,
    pub family_id: Option<Uuid>,
    pub participant_name: String,
    pub participant_phone: Option<String>,
    pub participant_email: Option<String>,
    pub fee_amount: Option<rust_decimal::Decimal>,
    pub notes: Option<String>,
}
