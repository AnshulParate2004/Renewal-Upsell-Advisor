-- Add billing_interval to accounts: 'monthly' | 'annual' (default 'annual').
-- Run in Supabase SQL Editor.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'annual';

COMMENT ON COLUMN accounts.billing_interval IS 'Subscription type: monthly or annual';
