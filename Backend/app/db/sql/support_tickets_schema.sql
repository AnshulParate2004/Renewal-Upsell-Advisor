-- Optional: real support ticket storage in Supabase (run in SQL editor).
-- Until populated, the API derives ticket counts from account risk/health/utilization.

CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    zendesk_id TEXT UNIQUE,
    subject TEXT,
    description TEXT,
    priority TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_account_id ON support_tickets(account_id);
