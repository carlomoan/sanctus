-- Announcement Table
CREATE TABLE announcement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parish_id UUID REFERENCES parish(id) ON DELETE CASCADE,    -- null if diocese-wide
    diocese_id UUID REFERENCES diocese(id) ON DELETE CASCADE,
    announcement_type VARCHAR(30) NOT NULL CHECK (announcement_type IN ('PARISH', 'DIOCESE', 'EVENT', 'LITURGICAL')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience JSONB,  -- e.g. {"roles": ["parish_admin","accountant"]}
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES app_user(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_announcement_date ON announcement(start_date, end_date);
CREATE INDEX idx_announcement_type ON announcement(announcement_type);