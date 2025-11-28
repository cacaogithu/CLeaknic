-- Setup cron job to send followups every hour
-- Execute este SQL manualmente no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query

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

-- Para verificar se o cron foi criado:
-- SELECT * FROM cron.job WHERE jobname = 'send-followups-hourly';

-- Para desabilitar o cron (se necessário):
-- SELECT cron.unschedule('send-followups-hourly');
