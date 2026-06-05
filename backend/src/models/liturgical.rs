use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{NaiveDate, DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "liturgical_season", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum LiturgicalSeason {
    Advent,
    Christmas,
    Lent,
    HolyWeek,
    Easter,
    OrdinaryTime,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "feast_type", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FeastType {
    Solemnity,
    Feast,
    Memorial,
    OptionalMemorial,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "liturgical_color", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum LiturgicalColor {
    White,
    Red,
    Green,
    Violet,
    Rose,
    Black,
    Gold,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct LiturgicalCalendar {
    pub id: Uuid,
    pub year: i32,
    pub date: NaiveDate,
    pub title: String,
    pub description: Option<String>,
    pub feast_type: FeastType,
    pub liturgical_season: LiturgicalSeason,
    pub liturgical_color: LiturgicalColor,
    pub rank: i32, // For ordering importance
    pub is_movable: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLiturgicalCalendarRequest {
    pub year: i32,
    pub date: NaiveDate,
    pub title: String,
    pub description: Option<String>,
    pub feast_type: FeastType,
    pub liturgical_season: LiturgicalSeason,
    pub liturgical_color: LiturgicalColor,
    pub rank: i32,
    pub is_movable: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLiturgicalCalendarRequest {
    pub year: Option<i32>,
    pub date: Option<NaiveDate>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub feast_type: Option<FeastType>,
    pub liturgical_season: Option<LiturgicalSeason>,
    pub liturgical_color: Option<LiturgicalColor>,
    pub rank: Option<i32>,
    pub is_movable: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct LiturgicalQuery {
    pub year: Option<i32>,
    pub season: Option<LiturgicalSeason>,
    pub feast_type: Option<FeastType>,
    pub date_from: Option<NaiveDate>,
    pub date_to: Option<NaiveDate>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct RecurringEventPattern {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub pattern_type: String, // "weekly", "monthly", "yearly", "liturgical"
    pub pattern_config: serde_json::Value, // JSON configuration for the pattern
    pub is_active: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRecurringEventPatternRequest {
    pub name: String,
    pub description: Option<String>,
    pub pattern_type: String,
    pub pattern_config: serde_json::Value,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRecurringEventPatternRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub pattern_type: Option<String>,
    pub pattern_config: Option<serde_json::Value>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WeeklyPatternConfig {
    pub day_of_week: i32, // 0-6 (Sunday-Saturday)
    pub time: Option<String>, // HH:MM format
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlyPatternConfig {
    pub day_of_month: i32, // 1-31
    pub time: Option<String>, // HH:MM format
    pub nth_occurrence: Option<i32>, // For "second Tuesday" patterns
}

#[derive(Debug, Serialize, Deserialize)]
pub struct YearlyPatternConfig {
    pub month: i32, // 1-12
    pub day: i32, // 1-31
    pub time: Option<String>, // HH:MM format
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LiturgicalPatternConfig {
    pub feast_name: String, // Reference to liturgical feast
    pub offset_days: Option<i32>, // Days before/after the feast
    pub time: Option<String>, // HH:MM format
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct GeneratedEvent {
    pub id: Uuid,
    pub pattern_id: Uuid,
    pub date: NaiveDate,
    pub time: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub is_liturgical: bool,
    pub generated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct GenerateEventsRequest {
    pub pattern_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub parish_id: Uuid,
    pub base_event_data: serde_json::Value, // Base event data to apply to generated events
}
