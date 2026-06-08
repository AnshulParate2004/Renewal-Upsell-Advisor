-- Portfolio metrics history for analytics trends (run in Supabase SQL editor).
-- account_id must be UUID to match public.accounts(id).

CREATE TABLE IF NOT EXISTS public.metrics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    health_score INTEGER,
    risk_score INTEGER,
    relationship_score INTEGER,
    churn_probability DOUBLE PRECISION,
    utilization DOUBLE PRECISION,
    sentiment_score DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_history_account_id ON public.metrics_history(account_id);
CREATE INDEX IF NOT EXISTS idx_metrics_history_date ON public.metrics_history(date);
