-- Fix metrics_history if it was created with TEXT account_id (run only if needed).
-- Safe to run: drops and recreates the table (trend backfill will regenerate on next analytics load).

DROP TABLE IF EXISTS public.metrics_history;

CREATE TABLE public.metrics_history (
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

CREATE INDEX idx_metrics_history_account_id ON public.metrics_history(account_id);
CREATE INDEX idx_metrics_history_date ON public.metrics_history(date);
