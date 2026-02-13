-- Add logo_url to parish and profile_photo_url to app_user

ALTER TABLE parish
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE app_user
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
