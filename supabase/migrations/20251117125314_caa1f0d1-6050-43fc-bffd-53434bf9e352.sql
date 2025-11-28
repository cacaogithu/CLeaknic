-- Criar tabela de alertas do sistema
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR NOT NULL,
  phone VARCHAR,
  details TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para buscar alertas não resolvidos
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON public.system_alerts(resolved, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Política para leitura
CREATE POLICY "Allow read access to system alerts"
ON public.system_alerts
FOR SELECT
USING (true);

-- Política para inserção via service role
CREATE POLICY "Allow insert from service role"
ON public.system_alerts
FOR INSERT
WITH CHECK (true);

-- Criar tabela de agendamentos pendentes
CREATE TABLE IF NOT EXISTS public.pending_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  doctor VARCHAR NOT NULL,
  procedure TEXT,
  status VARCHAR DEFAULT 'pending_n8n_sync',
  error TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para buscar pendentes
CREATE INDEX IF NOT EXISTS idx_pending_appointments_status ON public.pending_appointments(status, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.pending_appointments ENABLE ROW LEVEL SECURITY;

-- Política para leitura
CREATE POLICY "Allow read access to pending appointments"
ON public.pending_appointments
FOR SELECT
USING (true);

-- Política para inserção via service role
CREATE POLICY "Allow insert from service role"
ON public.pending_appointments
FOR INSERT
WITH CHECK (true);

-- Política para atualização via service role
CREATE POLICY "Allow update from service role"
ON public.pending_appointments
FOR UPDATE
USING (true);

-- Criar tabela de fila de mensagens
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR NOT NULL,
  message TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Criar índice para processar fila
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON public.message_queue(status, priority DESC, created_at ASC);

-- Habilitar RLS
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- Política para leitura
CREATE POLICY "Allow read access to message queue"
ON public.message_queue
FOR SELECT
USING (true);

-- Política para inserção via service role
CREATE POLICY "Allow insert from service role"
ON public.message_queue
FOR INSERT
WITH CHECK (true);

-- Política para atualização via service role
CREATE POLICY "Allow update from service role"
ON public.message_queue
FOR UPDATE
USING (true);