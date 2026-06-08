-- email_campaigns table schema
-- Run this in Supabase SQL Editor to create the table if it doesn't exist,
-- OR run just the ALTER TABLE statements if the table already exists.

-- Full table creation (only runs if table does not exist):
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id   UUID        REFERENCES public.accounts(id) ON DELETE CASCADE,
    campaign_type VARCHAR(100),
    subject      TEXT,
    body         TEXT,
    sent_at      TIMESTAMPTZ DEFAULT now(),
    opened_at    TIMESTAMPTZ,
    clicked_at   TIMESTAMPTZ,
    replied_at   TIMESTAMPTZ,
    status       VARCHAR(50)  DEFAULT 'sent',
    metadata     JSONB,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- If table already exists, add missing columns (safe to run multiple times):
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS replied_at  TIMESTAMPTZ;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS opened_at   TIMESTAMPTZ;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS clicked_at  TIMESTAMPTZ;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS metadata    JSONB;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(100);

-- Index for fast account lookups
CREATE INDEX IF NOT EXISTS idx_email_campaigns_account_id ON public.email_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status     ON public.email_campaigns(status);
