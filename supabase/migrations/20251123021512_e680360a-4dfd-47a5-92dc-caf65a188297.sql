-- Backfill orphaned messages with conversa_id
-- This links existing messages to conversations based on phone number and timestamp

-- Update bot messages (sender = 'bot')
UPDATE mensagens m
SET conversa_id = c.id
FROM conversas c
WHERE m.conversa_id IS NULL
  AND m.phone = c.phone
  AND m.sender = 'bot'
  AND m.created_at >= c.created_at
  AND m.created_at <= COALESCE(c.updated_at, NOW());

-- Update user messages (sender = 'user')  
UPDATE mensagens m
SET conversa_id = c.id
FROM conversas c
WHERE m.conversa_id IS NULL
  AND m.phone = c.phone
  AND m.sender = 'user'
  AND m.created_at >= c.created_at
  AND m.created_at <= COALESCE(c.updated_at, NOW());

-- Update any remaining orphaned messages to the most recent conversation for that phone
UPDATE mensagens m
SET conversa_id = (
  SELECT id FROM conversas 
  WHERE phone = m.phone 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE m.conversa_id IS NULL;

-- Create index for better performance on future lookups
CREATE INDEX IF NOT EXISTS idx_mensagens_phone_conversa ON mensagens(phone, conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_created_at ON mensagens(created_at);

-- Add comment
COMMENT ON INDEX idx_mensagens_phone_conversa IS 'Performance index for linking messages to conversations';
COMMENT ON INDEX idx_mensagens_created_at IS 'Performance index for timestamp-based queries';