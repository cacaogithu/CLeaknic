-- Add missing columns for handoff and media tracking
ALTER TABLE conversas
  ADD COLUMN IF NOT EXISTS handoff_block_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE mensagens 
  ADD COLUMN IF NOT EXISTS media_type VARCHAR,
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mensagens_phone_created 
  ON mensagens(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversas_phone 
  ON conversas(phone);

CREATE INDEX IF NOT EXISTS idx_conversas_handoff_ativo
  ON conversas(handoff_ativo) 
  WHERE handoff_ativo = true;

-- Create webhook logs table for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_phone_created 
  ON webhook_logs(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed 
  ON webhook_logs(processed) 
  WHERE processed = false;