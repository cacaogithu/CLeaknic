-- ============================================================================
-- Setup cron jobs para sistema de Recalls Estratégicos
-- ============================================================================
-- Execute este SQL manualmente no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query
-- ============================================================================

-- ============================================================================
-- 1. CRON: Criar recalls automaticamente (diário às 7h)
-- ============================================================================
-- Detecta consultas concluídas e orçamentos pendentes que precisam de recall

SELECT cron.schedule(
  'create-recalls-daily',
  '0 7 * * *', -- Todo dia às 7h da manhã
  $$
  SELECT
    net.http_post(
        url:='https://zslgqpnodzbehuflnbpq.supabase.co/functions/v1/create-recalls',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbGdxcG5vZHpiZWh1ZmxuYnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc4NDE0MCwiZXhwIjoyMDc4MzYwMTQwfQ.YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- ============================================================================
-- 2. CRON: Enviar followups/recalls pendentes (a cada hora)
-- ============================================================================
-- Já existe em setup-followups-cron.sql, mas vamos garantir que está ativo

SELECT cron.schedule(
  'send-followups-hourly',
  '0 * * * *', -- A cada hora
  $$
  SELECT
    net.http_post(
        url:='https://zslgqpnodzbehuflnbpq.supabase.co/functions/v1/send-followups',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbGdxcG5vZHpiZWh1ZmxuYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODQxNDAsImV4cCI6MjA3ODM2MDE0MH0.qR2s-8Wi3RN-f-bd0WD5722YossgHbH-HZ645kVBz7c"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- ============================================================================
-- COMANDOS DE VERIFICAÇÃO E GERENCIAMENTO
-- ============================================================================

-- Verificar todos os cron jobs ativos:
-- SELECT * FROM cron.job;

-- Verificar execuções recentes:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Desabilitar cron de criação de recalls:
-- SELECT cron.unschedule('create-recalls-daily');

-- Desabilitar cron de envio de followups:
-- SELECT cron.unschedule('send-followups-hourly');

-- ============================================================================
-- CONFIGURAÇÃO DE RECALLS (Ajustar conforme necessário)
-- ============================================================================

-- Atualizar delay de recall pós-consulta (padrão: 2-5 dias):
-- UPDATE recall_config SET delay_days_min = 2, delay_days_max = 5 WHERE recall_type = 'post_consultation';

-- Atualizar delay de recall pós-procedimento (padrão: 7-10 dias):
-- UPDATE recall_config SET delay_days_min = 7, delay_days_max = 10 WHERE recall_type = 'post_procedure';

-- Atualizar delay de recall de orçamento (padrão: 7-15 dias):
-- UPDATE recall_config SET delay_days_min = 7, delay_days_max = 15 WHERE recall_type = 'budget_not_scheduled';

-- Desabilitar um tipo de recall:
-- UPDATE recall_config SET enabled = false WHERE recall_type = 'post_consultation';

-- Ver configurações atuais:
-- SELECT * FROM recall_config;

-- Ver dashboard de recalls:
-- SELECT * FROM recall_dashboard;
