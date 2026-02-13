-- Settings/Configuration table for parish-level and system-level settings
CREATE TABLE IF NOT EXISTS app_setting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID REFERENCES parish(id),
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL DEFAULT '',
    setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parish_id, setting_key)
);

-- Create a unique partial index for system-level settings (parish_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_setting_system_key ON app_setting(setting_key) WHERE parish_id IS NULL;
