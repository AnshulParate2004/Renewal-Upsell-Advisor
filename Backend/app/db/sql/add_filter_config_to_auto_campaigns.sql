-- Add filter_config to auto_campaigns for multi-filter campaigns (same as Accounts: risk, health, arr, renewal, utilization, relationship, churn, location keyword, partner name keyword).
ALTER TABLE auto_campaigns ADD COLUMN IF NOT EXISTS filter_config JSONB;
