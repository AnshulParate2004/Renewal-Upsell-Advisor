-- Account comments table for PostgreSQL / Supabase
-- Run this in your Supabase SQL editor or psql to create the table.
-- Comments are stored per account and persisted to the database.

CREATE TABLE IF NOT EXISTS account_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- Index for listing comments by account
CREATE INDEX IF NOT EXISTS idx_account_comments_account_id ON account_comments(account_id);
CREATE INDEX IF NOT EXISTS idx_account_comments_created_at ON account_comments(created_at DESC);

-- Optional: trigger to keep updated_at in sync (PostgreSQL)
CREATE OR REPLACE FUNCTION update_account_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_account_comments_updated_at ON account_comments;
CREATE TRIGGER trigger_account_comments_updated_at
    BEFORE UPDATE ON account_comments
    FOR EACH ROW
    EXECUTE PROCEDURE update_account_comments_updated_at();

-- RLS (Row Level Security) for Supabase - optional, enable if using Supabase auth
-- ALTER TABLE account_comments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow read for authenticated" ON account_comments FOR SELECT USING (true);
-- CREATE POLICY "Allow insert for authenticated" ON account_comments FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow update for authenticated" ON account_comments FOR UPDATE USING (true);

COMMENT ON TABLE account_comments IS 'Comments on accounts; persisted to DB and synced to file export.';
