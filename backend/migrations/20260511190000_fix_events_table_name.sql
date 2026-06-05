-- Fix table name inconsistency: rename 'event' to 'events'
-- This migration fixes the issue where the original migration created 'event' table
-- but the code expects 'events' table

-- Check if the old 'event' table exists and rename it to 'events'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event') THEN
        ALTER TABLE event RENAME TO events;
    END IF;
END $$;

-- Update foreign key references if they still point to the old table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participant' AND column_name = 'event_id') THEN
        -- The foreign key constraint should already be correct, but let's make sure
        ALTER TABLE event_participant DROP CONSTRAINT IF EXISTS event_participant_event_id_fkey;
        ALTER TABLE event_participant ADD CONSTRAINT event_participant_event_id_fkey 
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update self-referencing foreign key in events table if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'events' AND constraint_name = 'event_parent_event_id_fkey') THEN
        ALTER TABLE events DROP CONSTRAINT IF EXISTS event_parent_event_id_fkey;
        ALTER TABLE events ADD CONSTRAINT events_parent_event_id_fkey 
            FOREIGN KEY (parent_event_id) REFERENCES events(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update indexes to use the correct table name if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_parish_id') THEN
        CREATE INDEX idx_events_parish_id ON events(parish_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_start_date') THEN
        CREATE INDEX idx_events_start_date ON events(start_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_event_type') THEN
        CREATE INDEX idx_events_event_type ON events(event_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_event_status') THEN
        CREATE INDEX idx_events_event_status ON events(event_status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_is_liturgical') THEN
        CREATE INDEX idx_events_is_liturgical ON events(is_liturgical);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_parent_event_id') THEN
        CREATE INDEX idx_events_parent_event_id ON events(parent_event_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_deleted_at') THEN
        CREATE INDEX idx_events_deleted_at ON events(deleted_at);
    END IF;
END $$;

-- Update triggers to use the correct table name if needed
DROP TRIGGER IF EXISTS trigger_event_updated_at ON event;
CREATE TRIGGER IF NOT EXISTS trigger_event_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_event_updated_at();
