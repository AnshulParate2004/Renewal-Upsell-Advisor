-- Track when each campaign was last run (for weekly/monthly frequency).
ALTER TABLE auto_campaigns ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;
