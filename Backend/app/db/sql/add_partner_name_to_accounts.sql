-- Add partner_name to accounts table (run in Supabase SQL Editor if column is missing).
-- Partner name is shown on Accounts page and Account Detail page; values come from this column
-- or fall back to csm_name if partner_name is null.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS partner_name VARCHAR(255);

COMMENT ON COLUMN accounts.partner_name IS 'Partner name for the account; displayed on Accounts list and Account Detail. Falls back to csm_name in UI if null.';
