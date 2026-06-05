-- Create events system with tables for events, participants, and liturgical calendar

-- Create event_type enum
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM (
        'MASS', 'MEETING', 'CONFERENCE', 'RETREAT', 'WORKSHOP', 'SOCIAL', 
        'FUNDRAISING', 'ANNIVERSARY', 'FEAST_DAY', 'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create event_status enum
DO $$ BEGIN
    CREATE TYPE event_status AS ENUM (
        'PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create recurrence_pattern enum
DO $$ BEGIN
    CREATE TYPE recurrence_pattern AS ENUM (
        'NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,
    event_status event_status NOT NULL DEFAULT 'PLANNED',
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE NOT NULL,
    end_time TIME,
    location VARCHAR(300),
    organizer_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    organizer_name VARCHAR(150),
    max_participants INTEGER CHECK (max_participants > 0),
    current_participants INTEGER DEFAULT 0 CHECK (current_participants >= 0),
    registration_required BOOLEAN DEFAULT FALSE,
    registration_deadline DATE,
    fee_amount DECIMAL(12,2) CHECK (fee_amount >= 0),
    is_public BOOLEAN DEFAULT TRUE,
    is_liturgical BOOLEAN DEFAULT FALSE,
    recurrence_pattern recurrence_pattern DEFAULT 'NONE',
    recurrence_end_date DATE,
    parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    family_id UUID REFERENCES family(id) ON DELETE SET NULL,
    participant_name VARCHAR(150) NOT NULL,
    participant_phone VARCHAR(20),
    participant_email VARCHAR(255),
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fee_paid BOOLEAN DEFAULT FALSE,
    fee_amount DECIMAL(12,2) CHECK (fee_amount >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, participant_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_parish_id ON events(parish_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_event_status ON events(event_status);
CREATE INDEX IF NOT EXISTS idx_events_is_liturgical ON events(is_liturgical);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);

CREATE INDEX IF NOT EXISTS idx_event_participant_event_id ON event_participant(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participant_member_id ON event_participant(member_id);
CREATE INDEX IF NOT EXISTS idx_event_participant_family_id ON event_participant(family_id);
CREATE INDEX IF NOT EXISTS idx_event_participant_registration_date ON event_participant(registration_date);

-- Add constraint to ensure end_date is not before start_date
ALTER TABLE events ADD CONSTRAINT chk_event_dates 
CHECK (end_date >= start_date);

-- Add constraint to ensure end_time is after start_time if both are specified
ALTER TABLE events ADD CONSTRAINT chk_event_times 
CHECK (
    (start_time IS NULL) OR (end_time IS NULL) OR 
    (start_date < end_date) OR (start_date = end_date AND start_time <= end_time)
);

-- Add constraint to ensure max_participants is not less than current_participants
ALTER TABLE events ADD CONSTRAINT chk_event_participants 
CHECK (
    (max_participants IS NULL) OR (current_participants <= max_participants)
);

-- Add comments for documentation
COMMENT ON TABLE events IS 'Main table for storing all parish events and activities';
COMMENT ON TABLE event_participant IS 'Table for tracking event participants and registrations';

COMMENT ON COLUMN events.event_type IS 'Type of event: Mass, Meeting, Conference, etc.';
COMMENT ON COLUMN events.event_status IS 'Current status of the event: Planned, Scheduled, etc.';
COMMENT ON COLUMN events.recurrence_pattern IS 'Pattern for recurring events: None, Daily, Weekly, etc.';
COMMENT ON COLUMN events.is_liturgical IS 'Whether this is a liturgical event (feast days, etc.)';
COMMENT ON COLUMN events.parent_event_id IS 'For recurring events, links to the parent event';

COMMENT ON COLUMN event_participant.member_id IS 'Optional link to a registered member';
COMMENT ON COLUMN event_participant.family_id IS 'Optional link to a family registration';
COMMENT ON COLUMN event_participant.fee_paid IS 'Whether the participant has paid the event fee';

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_event_updated_at();

CREATE OR REPLACE FUNCTION update_event_participant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_participant_updated_at
    BEFORE UPDATE ON event_participant
    FOR EACH ROW
    EXECUTE FUNCTION update_event_participant_updated_at();
