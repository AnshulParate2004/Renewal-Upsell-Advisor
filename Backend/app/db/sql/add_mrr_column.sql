-- Add a new mrr column to accounts (nullable).
-- Run in Supabase SQL Editor.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS mrr NUMERIC NULL;
