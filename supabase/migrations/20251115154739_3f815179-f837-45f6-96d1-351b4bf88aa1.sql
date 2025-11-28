-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Setup cron job to check buffer every 3 seconds
SELECT cron.schedule(
  'check-buffer-every-3-seconds',
  '*/3 * * * * *', 
  $$
  SELECT net.http_post(
    url:='https://zslgqpnodzbehuflnbpq.supabase.co/functions/v1/check-buffer',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbGdxcG5vZHpiZWh1ZmxuYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODQxNDAsImV4cCI6MjA3ODM2MDE0MH0.qR2s-8Wi3RN-f-bd0WD5722YossgHbH-HZ645kVBz7c"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Setup cron job to cleanup handoffs every 30 minutes
SELECT cron.schedule(
  'cleanup-handoffs-every-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://zslgqpnodzbehuflnbpq.supabase.co/functions/v1/cleanup-handoffs',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbGdxcG5vZHpiZWh1ZmxuYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODQxNDAsImV4cCI6MjA3ODM2MDE0MH0.qR2s-8Wi3RN-f-bd0WD5722YossgHbH-HZ645kVBz7c"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);