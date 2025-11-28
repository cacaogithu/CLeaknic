-- Setup cron job to send followups every hour
-- Based on supabase/setup-followups-cron.sql

-- Enable pg_cron if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job
SELECT cron.schedule(
  'send-followups-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://zslgqpnodzbehuflnbpq.supabase.co/functions/v1/send-followups',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbGdxcG5vZHpiZWh1ZmxuYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODQxNDAsImV4cCI6MjA3ODM2MDE0MH0.qR2s-8Wi3RN-f-bd0WD5722YossgHbH-HZ645kVBz7c"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Add new statuses to the appointment_status enum if it exists
-- If the column is text, this block will simply do nothing regarding the type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'pendente_confirmacao';
    ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'confirmada_paciente';
    ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'cancelada_paciente';
    ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'no_show';
  END IF;
END $$;
