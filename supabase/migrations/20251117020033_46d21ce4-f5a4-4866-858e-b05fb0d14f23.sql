-- Create n8n webhook logs table
CREATE TABLE n8n_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  endpoint TEXT NOT NULL CHECK (endpoint IN ('get', 'create', 'delete')),
  request_params JSONB,
  response_data JSONB,
  response_time_ms INTEGER,
  status_code INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT
);

-- Create indexes for fast queries
CREATE INDEX idx_n8n_logs_created_at ON n8n_webhook_logs(created_at DESC);
CREATE INDEX idx_n8n_logs_endpoint ON n8n_webhook_logs(endpoint);
CREATE INDEX idx_n8n_logs_success ON n8n_webhook_logs(success);

-- Enable RLS (Row Level Security)
ALTER TABLE n8n_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access (for dashboard)
CREATE POLICY "Allow read access to n8n logs" ON n8n_webhook_logs
  FOR SELECT USING (true);

-- Allow insert from service role (edge functions)
CREATE POLICY "Allow insert from service role" ON n8n_webhook_logs
  FOR INSERT WITH CHECK (true);