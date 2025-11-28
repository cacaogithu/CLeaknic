-- Recreate conversas for the 7 clients based on their messages
INSERT INTO conversas (phone, cliente_id, status, created_at, last_message_at, messages_count, appointment_scheduled)
SELECT 
  m.phone,
  c.id as cliente_id,
  'ativa' as status,
  MIN(m.created_at) as created_at,
  MAX(m.created_at) as last_message_at,
  COUNT(m.id) as messages_count,
  EXISTS(SELECT 1 FROM appointments WHERE appointments.phone = m.phone) as appointment_scheduled
FROM mensagens m
JOIN clientes c ON c.phone = m.phone
WHERE m.phone IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
)
GROUP BY m.phone, c.id;

-- Update conversas with appointment dates where they exist
UPDATE conversas c
SET appointment_date = (
  SELECT MIN(a.datetime)
  FROM appointments a
  WHERE a.phone = c.phone
  AND a.status = 'confirmada'
)
WHERE c.phone IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
)
AND EXISTS(SELECT 1 FROM appointments WHERE appointments.phone = c.phone);

-- Update clientes stages based on appointments
UPDATE clientes
SET 
  stage = CASE 
    WHEN phone IN (SELECT phone FROM appointments WHERE status = 'confirmada') THEN 'conversao'
    ELSE stage
  END,
  status = CASE
    WHEN phone IN (SELECT phone FROM appointments WHERE status = 'confirmada') THEN 'cliente'
    ELSE status
  END,
  last_appointment_date = (SELECT MAX(appointment_date) FROM appointments WHERE appointments.phone = clientes.phone),
  total_appointments = (SELECT COUNT(*) FROM appointments WHERE appointments.phone = clientes.phone)
WHERE phone IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);