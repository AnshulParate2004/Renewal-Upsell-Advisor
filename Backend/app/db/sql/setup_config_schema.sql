-- ============================================================
-- Migration: Create setup_config table
-- Run once in Supabase SQL Editor.
--
-- Purpose:
--   Replaces credential storage in the `app_settings.config` JSONB blob
--   with a flat-column, append-only table. Each /setup form submission
--   inserts a NEW row so history is always preserved; the latest row
--   (ORDER BY created_at DESC LIMIT 1) is the active configuration.
-- ============================================================

CREATE TABLE IF NOT EXISTS setup_config (
  id                     BIGSERIAL PRIMARY KEY,

  -- Email / Resend credentials
  resend_api_key         TEXT,
  from_email             TEXT,
  from_name              TEXT NOT NULL DEFAULT 'Renewal & Upsell Advisor',

  -- Voice Call / Cube Software credentials
  cube_api_url           TEXT,
  cube_api_key           TEXT,

  -- Automation control
  automation_paused      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Pipeline Focus
  pipeline_type          TEXT NOT NULL DEFAULT 'cloudflare',

  -- Audit
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: index so "latest row" queries are fast
CREATE INDEX IF NOT EXISTS idx_setup_config_created_at
  ON setup_config (created_at DESC);

-- Grant access to the service role (adjust if using anon key)
-- ALTER TABLE setup_config ENABLE ROW LEVEL SECURITY;
