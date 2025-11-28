-- Create message buffer table for 15-second sliding window
CREATE TABLE IF NOT EXISTS message_buffer (
  phone VARCHAR PRIMARY KEY,
  last_message_at TIMESTAMPTZ NOT NULL,
  buffer_expires_at TIMESTAMPTZ NOT NULL,
  processing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_buffer_expires ON message_buffer(buffer_expires_at) WHERE processing = false;

-- Add email to clientes for handoff notifications
ALTER TABLE clientes 
  ADD COLUMN IF NOT EXISTS email VARCHAR;