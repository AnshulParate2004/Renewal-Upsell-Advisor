-- ============================================================
-- Migration: Add resend + cube columns to setup_config
-- Run this in Supabase SQL Editor if your table still has
-- the old sendgrid_api_key / twilio_* columns.
-- ============================================================

-- 1. Add new columns (safe — does nothing if column already exists)
ALTER TABLE setup_config ADD COLUMN IF NOT EXISTS resend_api_key  TEXT;
ALTER TABLE setup_config ADD COLUMN IF NOT EXISTS cube_api_url    TEXT;
ALTER TABLE setup_config ADD COLUMN IF NOT EXISTS cube_api_key    TEXT;
ALTER TABLE setup_config ADD COLUMN IF NOT EXISTS pipeline_type   TEXT NOT NULL DEFAULT 'aditya_birla';

-- 2. (Optional) drop old columns that are no longer used
-- Uncomment if you want to clean up:
-- ALTER TABLE setup_config DROP COLUMN IF EXISTS sendgrid_api_key;
-- ALTER TABLE setup_config DROP COLUMN IF EXISTS twilio_account_sid;
-- ALTER TABLE setup_config DROP COLUMN IF EXISTS twilio_auth_token;
-- ALTER TABLE setup_config DROP COLUMN IF EXISTS twilio_phone_number;
-- ALTER TABLE setup_config DROP COLUMN IF EXISTS twilio_whatsapp_number;

-- 3. Verify the table looks correct
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'setup_config'
ORDER BY ordinal_position;
