-- Add event scope and diocese fields to support SAAS hierarchy
-- Migration: 20260504010000_add_event_scope_and_diocese_fields.sql

-- Create enum for event scope
CREATE TYPE event_scope AS ENUM ('DIOCESE', 'PARISH');

-- Add new columns to events table
ALTER TABLE events 
ADD COLUMN scope event_scope NOT NULL DEFAULT 'PARISH',
ADD COLUMN diocese_id UUID REFERENCES diocese(id) ON DELETE SET NULL;

-- Make parish_id nullable to support diocese-level events
ALTER TABLE events 
ALTER COLUMN parish_id DROP NOT NULL,
ALTER COLUMN parish_id SET DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX idx_events_scope ON events(scope);
CREATE INDEX idx_events_diocese_id ON events(diocese_id);
CREATE INDEX idx_events_parish_diocese_scope ON events(parish_id, diocese_id, scope);

-- Add comments
COMMENT ON COLUMN events.scope IS 'Event scope: DIOCESE (visible to all parishes) or PARISH (specific to one parish)';
COMMENT ON COLUMN events.diocese_id IS 'Diocese ID for diocese-level events (NULL for parish-level events)';
COMMENT ON COLUMN events.parish_id IS 'Parish ID for parish-level events (NULL for diocese-level events)';

-- Update existing events to have parish scope by default
UPDATE events SET scope = 'PARISH' WHERE scope IS NULL;
