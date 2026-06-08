CREATE TABLE IF NOT EXISTS public.resend_inbound_ids (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    resend_id    VARCHAR(255) UNIQUE NOT NULL,
    account_id   UUID         REFERENCES public.accounts(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ  DEFAULT now(),
    created_at   TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resend_inbound_ids_resend_id ON public.resend_inbound_ids(resend_id);
