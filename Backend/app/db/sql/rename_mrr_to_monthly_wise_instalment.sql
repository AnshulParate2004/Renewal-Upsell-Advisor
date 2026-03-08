-- Rename accounts.mrr to monthly_wise_instalment (nullable).
-- Run in Supabase SQL Editor.

-- If you already have an "mrr" column: run this block to rename and allow NULL
ALTER TABLE accounts
  RENAME COLUMN mrr TO monthly_wise_instalment;

ALTER TABLE accounts
  ALTER COLUMN monthly_wise_instalment DROP NOT NULL;

-- Allow arr to be null as well
ALTER TABLE accounts
  ALTER COLUMN arr DROP NOT NULL;

-- If you do NOT have "mrr" and need to add the column: run this instead (comment out the block above)
-- ALTER TABLE accounts
--   ADD COLUMN IF NOT EXISTS monthly_wise_instalment NUMERIC NULL;
