-- Add zapi_message_id column for message deduplication
-- This prevents duplicate messages when Z-API retries webhooks

ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS zapi_message_id VARCHAR;

-- Create unique index for deduplication (partial - only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_zapi_message_id
ON mensagens(zapi_message_id)
WHERE zapi_message_id IS NOT NULL;

-- Also add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mensagens_phone_processed
ON mensagens(phone, processed)
WHERE processed = false;

-- Add retry_count to message_buffer for tracking failed processing attempts
ALTER TABLE message_buffer
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add index for stuck buffer recovery
CREATE INDEX IF NOT EXISTS idx_message_buffer_stuck
ON message_buffer(locked_at, processing)
WHERE processing = true;

COMMENT ON COLUMN mensagens.zapi_message_id IS 'Z-API message ID for deduplication - prevents duplicate messages on webhook retry';
COMMENT ON COLUMN message_buffer.retry_count IS 'Number of times this buffer has been retried after processing failure';
