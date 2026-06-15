-- Migration: Fix app_setting table for proper parish/diocese scoping
-- File: backend/migrations/20260613000000_fix_settings_scope.sql

-- The existing UNIQUE constraint is:
--   UNIQUE(parish_id, setting_key)
-- But NULL != NULL in SQL, so two rows with parish_id=NULL and same key
-- would NOT conflict on this constraint. The partial index handles it:
--   CREATE UNIQUE INDEX idx_app_setting_system_key ON app_setting(setting_key)
--   WHERE parish_id IS NULL;
-- This is correct. No change needed there.

-- Add diocese_id column for future multi-diocese support
-- (currently NULL means "global to all dioceses")
ALTER TABLE app_setting
  ADD COLUMN IF NOT EXISTS diocese_id UUID REFERENCES diocese(id);

-- Add created_by and updated_by for audit trail
ALTER TABLE app_setting
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES app_user(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES app_user(id);

-- Add is_sensitive flag to mask values in API responses (passwords, keys)
ALTER TABLE app_setting
  ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark sensitive keys
UPDATE app_setting SET is_sensitive = TRUE
WHERE setting_key IN (
  'email.smtp_password',
  'sms.api_key',
  'payment.mpesa_key',
  'payment.mpesa_secret',
  'email.smtp_user'
);

-- Index for fast parish settings lookup (used on every page load)
CREATE INDEX IF NOT EXISTS idx_app_setting_parish_group
  ON app_setting(parish_id, setting_group);

-- Index for diocese-level settings lookup
CREATE INDEX IF NOT EXISTS idx_app_setting_diocese_group
  ON app_setting(diocese_id, setting_group)
  WHERE parish_id IS NULL;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_setting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_setting_updated_at ON app_setting;
CREATE TRIGGER trg_app_setting_updated_at
  BEFORE UPDATE ON app_setting
  FOR EACH ROW EXECUTE FUNCTION update_app_setting_updated_at();

-- Ensure sensitive values are masked in a view for non-admin roles
CREATE OR REPLACE VIEW app_setting_safe AS
SELECT
  id,
  parish_id,
  diocese_id,
  setting_key,
  CASE WHEN is_sensitive THEN '••••••••' ELSE setting_value END AS setting_value,
  setting_group,
  description,
  is_sensitive,
  created_at,
  updated_at
FROM app_setting;

COMMENT ON TABLE app_setting IS
  'Stores system configuration. parish_id=NULL means diocese/global level. '
  'Parish-level rows override diocese defaults for that parish only.';

COMMENT ON COLUMN app_setting.is_sensitive IS
  'If true, the setting_value contains a secret (password, API key) and '
  'should not be exposed in API responses to non-admin roles.';