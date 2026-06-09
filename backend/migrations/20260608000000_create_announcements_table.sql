-- Create announcements table for diocese and parish communications
-- This allows diocese leaders to send announcements to all parishes at once

CREATE TYPE announcement_scope AS ENUM ('DIOCESE', 'PARISH');
CREATE TYPE announcement_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE announcement_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diocese_id UUID REFERENCES diocese(id) ON DELETE CASCADE,
    parish_id UUID REFERENCES parish(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(30) NOT NULL CHECK (announcement_type IN ('PARISH', 'DIOCESE', 'EVENT', 'LITURGICAL', 'GENERAL', 'EMERGENCY')),
    scope announcement_scope NOT NULL,
    priority announcement_priority NOT NULL DEFAULT 'NORMAL',
    status announcement_status NOT NULL DEFAULT 'DRAFT',
    author_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    author_name VARCHAR(150),
    publish_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    target_audience VARCHAR(100), -- e.g., "ALL", "PRIESTS", "SECRETARIES", "MEMBERS"
    attachment_url TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT valid_scope_check CHECK (
        (scope = 'DIOCESE' AND diocese_id IS NOT NULL AND parish_id IS NULL) OR
        (scope = 'PARISH' AND parish_id IS NOT NULL)
    ),
    CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date > publish_date)
);

-- Create indexes for better performance
CREATE INDEX idx_announcements_diocese ON announcements(diocese_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_announcements_parish ON announcements(parish_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_announcements_scope ON announcements(scope) WHERE deleted_at IS NULL;
CREATE INDEX idx_announcements_status ON announcements(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_announcements_publish_date ON announcements(publish_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_announcements_type ON announcements(announcement_type) WHERE deleted_at IS NULL;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE announcements IS 'Announcements for diocese-wide and parish-wide communications';
COMMENT ON COLUMN announcements.scope IS 'Announcement scope: DIOCESE (visible to all parishes) or PARISH (specific to one parish)';
COMMENT ON COLUMN announcements.priority IS 'Priority level: LOW, NORMAL, HIGH, URGENT';
COMMENT ON COLUMN announcements.target_audience IS 'Target audience: ALL, PRIESTS, SECRETARIES, MEMBERS';
COMMENT ON COLUMN announcements.view_count IS 'Number of times the announcement has been viewed';
