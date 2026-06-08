-- ============================================================
-- Migration: Add Twilio columns to setup_config
-- ============================================================

ALTER TABLE setup_config
  ADD COLUMN IF NOT EXISTS twilio_account_sid  TEXT,
  ADD COLUMN IF NOT EXISTS twilio_auth_token   TEXT,
  ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT;
