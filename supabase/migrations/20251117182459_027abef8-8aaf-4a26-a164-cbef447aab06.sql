-- Add lock tracking columns to message_buffer table
ALTER TABLE message_buffer 
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_by TEXT;

-- Add index for lock timeout queries
CREATE INDEX IF NOT EXISTS idx_message_buffer_locked_at 
ON message_buffer(locked_at) 
WHERE processing = true;