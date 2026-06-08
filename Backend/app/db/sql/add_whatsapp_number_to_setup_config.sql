-- Migration: Add twilio_whatsapp_number to setup_config
-- Run in Supabase SQL Editor

ALTER TABLE setup_config
ADD COLUMN IF NOT EXISTS twilio_whatsapp_number TEXT;

-- Update comment
COMMENT ON COLUMN setup_config.twilio_whatsapp_number IS 'Dedicated Twilio number for WhatsApp messages (optional, falls back to twilio_phone_number)';
