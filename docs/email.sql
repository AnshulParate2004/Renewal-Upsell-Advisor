-- Option 1: TRUNCATE (faster, resets auto-increment if any)
TRUNCATE TABLE email_campaigns CASCADE;

-- Option 2: DELETE (slower but more control, can use WHERE clause)
-- DELETE FROM email_campaigns;

-- Verify the table is empty
SELECT COUNT(*) as remaining_records FROM email_campaigns;
