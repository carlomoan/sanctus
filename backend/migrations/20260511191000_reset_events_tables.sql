-- Reset events tables to fix table name inconsistency
-- This migration drops the problematic tables and recreates them correctly

-- Drop existing tables and constraints
DROP TABLE IF EXISTS event_participant CASCADE;
DROP TABLE IF EXISTS event CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Drop the migration entry for the problematic migration to allow re-running
DELETE FROM _sqlx_migrations WHERE version = '20260424020000';

-- Note: The original migration 20260424020000_create_events_system.sql will now run again
-- and create the tables with the correct 'events' name
