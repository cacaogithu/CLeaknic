-- Delete all data except for the 7 specified phone numbers
-- Delete in order respecting foreign key constraints

-- First, delete pipeline events for clients not in the list
DELETE FROM pipeline_events 
WHERE cliente_id IN (
  SELECT id FROM clientes 
  WHERE phone NOT IN (
    '14072677301',
    '5521992420891',
    '5511987662764',
    '16562042569',
    '14078859150',
    '14079897162',
    '14079897160'
  )
);

-- Delete interesses
DELETE FROM interesses 
WHERE cliente_id IN (
  SELECT id FROM clientes 
  WHERE phone NOT IN (
    '14072677301',
    '5521992420891',
    '5511987662764',
    '16562042569',
    '14078859150',
    '14079897162',
    '14079897160'
  )
);

-- Delete followups
DELETE FROM followups 
WHERE phone NOT IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);

-- Delete appointments
DELETE FROM appointments 
WHERE phone NOT IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);

-- Delete mensagens for conversations not in the list
DELETE FROM mensagens 
WHERE phone NOT IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);

-- Delete AI decision logs
DELETE FROM ai_decision_log 
WHERE phone NOT IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);

-- Delete agent errors
DELETE FROM agent_errors 
WHERE phone NOT IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);

-- Delete conversas
DELETE FROM conversas 
WHERE phone NOT IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);

-- Finally, delete clients
DELETE FROM clientes 
WHERE phone NOT IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);