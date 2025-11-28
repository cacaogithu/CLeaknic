-- ============================================================
-- SQL COMPLETO PARA REMOVER DADOS DO NÚMERO DE TESTE
-- Número: 14079897162
-- ============================================================
-- ATENÇÃO: Execute este SQL diretamente no Supabase SQL Editor
-- Este script remove TODOS os dados relacionados ao número de teste
-- ============================================================

-- 1. Buscar IDs relacionados antes de deletar
DO $$
DECLARE
  v_cliente_id BIGINT;
  v_conversa_ids BIGINT[];
BEGIN
  -- Buscar cliente_id
  SELECT id INTO v_cliente_id FROM clientes WHERE phone = '14079897162';
  
  -- Buscar conversa_ids
  SELECT ARRAY_AGG(id) INTO v_conversa_ids FROM conversas WHERE phone = '14079897162';
  
  RAISE NOTICE 'Cliente ID: %', v_cliente_id;
  RAISE NOTICE 'Conversa IDs: %', v_conversa_ids;
END $$;

-- 2. DELETAR MENSAGENS (referencia conversas)
DELETE FROM mensagens WHERE phone = '14079897162';
DELETE FROM mensagens WHERE conversa_id IN (SELECT id FROM conversas WHERE phone = '14079897162');

-- 3. DELETAR AI DECISION LOG (referencia conversas)
DELETE FROM ai_decision_log WHERE phone = '14079897162';
DELETE FROM ai_decision_log WHERE conversa_id IN (SELECT id FROM conversas WHERE phone = '14079897162');

-- 4. DELETAR AGENT ERRORS (referencia conversas)
DELETE FROM agent_errors WHERE phone = '14079897162';
DELETE FROM agent_errors WHERE conversa_id IN (SELECT id FROM conversas WHERE phone = '14079897162');

-- 5. DELETAR BUDGETS (referencia clientes e conversas)
DELETE FROM budgets WHERE phone = '14079897162';
DELETE FROM budgets WHERE cliente_id IN (SELECT id FROM clientes WHERE phone = '14079897162');
DELETE FROM budgets WHERE conversa_id IN (SELECT id FROM conversas WHERE phone = '14079897162');

-- 6. DELETAR FOLLOWUPS (referencia clientes, conversas, appointments)
DELETE FROM followups WHERE phone = '14079897162';
DELETE FROM followups WHERE cliente_id IN (SELECT id FROM clientes WHERE phone = '14079897162');
DELETE FROM followups WHERE conversa_id IN (SELECT id FROM conversas WHERE phone = '14079897162');
DELETE FROM followups WHERE appointment_id IN (SELECT id FROM appointments WHERE phone = '14079897162');

-- 7. DELETAR INTERESSES (referencia clientes)
DELETE FROM interesses WHERE cliente_id IN (SELECT id FROM clientes WHERE phone = '14079897162');

-- 8. DELETAR PIPELINE EVENTS (referencia clientes)
DELETE FROM pipeline_events WHERE cliente_id IN (SELECT id FROM clientes WHERE phone = '14079897162');

-- 9. DELETAR APPOINTMENTS
DELETE FROM appointments WHERE phone = '14079897162';
DELETE FROM appointments WHERE cliente_id IN (SELECT id FROM clientes WHERE phone = '14079897162');

-- 10. DELETAR PENDING APPOINTMENTS
DELETE FROM pending_appointments WHERE phone = '14079897162';

-- 11. DELETAR MESSAGE BUFFER
DELETE FROM message_buffer WHERE phone = '14079897162';

-- 12. DELETAR MESSAGE QUEUE
DELETE FROM message_queue WHERE phone = '14079897162';

-- 13. DELETAR WEBHOOK LOGS
DELETE FROM webhook_logs WHERE phone = '14079897162';

-- 14. DELETAR SYSTEM ALERTS relacionados
DELETE FROM system_alerts WHERE phone = '14079897162';

-- 15. DELETAR AB TEST ASSIGNMENTS
DELETE FROM ab_test_assignments WHERE phone = '14079897162';

-- 16. DELETAR AB TEST METRICS
DELETE FROM ab_test_metrics WHERE phone = '14079897162';
DELETE FROM ab_test_metrics WHERE conversa_id IN (SELECT id FROM conversas WHERE phone = '14079897162');

-- 17. DELETAR N8N QUEUE
DELETE FROM n8n_queue WHERE phone = '14079897162';

-- 18. DELETAR CONVERSAS (após limpar todas as referências)
DELETE FROM conversas WHERE phone = '14079897162';

-- 19. DELETAR CLIENTES (último, após limpar todas as referências)
DELETE FROM clientes WHERE phone = '14079897162';

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
-- Execute estas queries para confirmar que não há mais dados

SELECT 'clientes' as tabela, COUNT(*) as registros FROM clientes WHERE phone = '14079897162'
UNION ALL
SELECT 'conversas', COUNT(*) FROM conversas WHERE phone = '14079897162'
UNION ALL
SELECT 'mensagens', COUNT(*) FROM mensagens WHERE phone = '14079897162'
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments WHERE phone = '14079897162'
UNION ALL
SELECT 'ai_decision_log', COUNT(*) FROM ai_decision_log WHERE phone = '14079897162'
UNION ALL
SELECT 'agent_errors', COUNT(*) FROM agent_errors WHERE phone = '14079897162'
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets WHERE phone = '14079897162'
UNION ALL
SELECT 'followups', COUNT(*) FROM followups WHERE phone = '14079897162'
UNION ALL
SELECT 'pending_appointments', COUNT(*) FROM pending_appointments WHERE phone = '14079897162'
UNION ALL
SELECT 'message_buffer', COUNT(*) FROM message_buffer WHERE phone = '14079897162'
UNION ALL
SELECT 'message_queue', COUNT(*) FROM message_queue WHERE phone = '14079897162'
UNION ALL
SELECT 'webhook_logs', COUNT(*) FROM webhook_logs WHERE phone = '14079897162'
UNION ALL
SELECT 'system_alerts', COUNT(*) FROM system_alerts WHERE phone = '14079897162'
UNION ALL
SELECT 'ab_test_assignments', COUNT(*) FROM ab_test_assignments WHERE phone = '14079897162'
UNION ALL
SELECT 'ab_test_metrics', COUNT(*) FROM ab_test_metrics WHERE phone = '14079897162'
UNION ALL
SELECT 'n8n_queue', COUNT(*) FROM n8n_queue WHERE phone = '14079897162';

-- Resultado esperado: TODOS devem mostrar 0 registros
