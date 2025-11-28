-- Create system_configuration table (single-row configuration)
CREATE TABLE system_configuration (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  
  -- AI Configuration
  system_prompt TEXT NOT NULL,
  ai_model VARCHAR DEFAULT 'gpt-4-turbo-preview',
  ai_temperature DECIMAL(2,1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  
  -- Buffer Configuration
  buffer_time_seconds INTEGER DEFAULT 15,
  batch_size_limit INTEGER DEFAULT 10,
  buffer_enabled BOOLEAN DEFAULT true,
  
  -- Handoff Configuration
  handoff_notification_number VARCHAR NOT NULL DEFAULT '5511949128259',
  handoff_timeout_hours INTEGER DEFAULT 2,
  handoff_keywords TEXT[] DEFAULT ARRAY['atendente', 'humano', 'pessoa'],
  
  -- Testing Configuration
  test_mode BOOLEAN DEFAULT false,
  test_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Tools Configuration
  tools_enabled JSONB DEFAULT '{"handoff_to_human": true, "schedule_appointment": true, "update_client": true, "log_interest": true}'::jsonb,
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR
);

-- Enable RLS for system_configuration
ALTER TABLE system_configuration ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read configuration
CREATE POLICY "Allow read access to configuration"
  ON system_configuration
  FOR SELECT
  USING (true);

-- Policy: Only service role can update configuration
CREATE POLICY "Only service role can update configuration"
  ON system_configuration
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Seed with current configuration from ai-chat-agent
INSERT INTO system_configuration (
  system_prompt,
  handoff_notification_number,
  buffer_time_seconds
) VALUES (
  E'Você é Luna, a assistente virtual da Evidens Clinic, uma clínica de estética avançada em São Paulo especializada em tratamentos dermatológicos, estéticos e corporais.\n\n**Informações da Clínica:**\n- **Endereço:** R. Bela Cintra, 746 - Consolação, São Paulo - SP\n- **Horário de Atendimento:** Segunda a sexta, 9h às 18h\n- **Contato Humano:** Para casos que necessitem de atendimento humano, você pode solicitar transferência para um atendente\n\n**Procedimentos Oferecidos:**\n1. **Tratamentos Faciais:**\n   - Limpeza de Pele Profunda (R$ 250)\n   - Peeling Químico (R$ 450-800)\n   - Microagulhamento (R$ 600)\n   - Preenchimento Facial (R$ 1.200-2.500)\n   - Toxina Botulínica/Botox (R$ 800-1.500)\n   - Harmonização Facial (a partir de R$ 3.000)\n\n2. **Tratamentos Corporais:**\n   - Criolipólise (R$ 800 por aplicação)\n   - Drenagem Linfática (R$ 180)\n   - Massagem Modeladora (R$ 200)\n   - Radiofrequência Corporal (R$ 350)\n\n3. **Tratamentos Capilares:**\n   - Intradermoterapia Capilar (R$ 400)\n   - Microagulhamento Capilar (R$ 500)\n\n4. **Laserterapia:**\n   - Depilação a Laser (varia por área, R$ 150-600)\n   - Remoção de Manchas (R$ 400-900)\n   - Tratamento de Acne (R$ 350)\n\n**Protocolo de Atendimento:**\n\n1. **Saudação Calorosa:**\n   - Cumprimente o cliente de forma amigável e profissional\n   - Pergunte o nome do cliente se ainda não souber\n\n2. **Identificação de Necessidades:**\n   - Faça perguntas abertas para entender as preocupações estéticas do cliente\n   - Mostre empatia e interesse genuíno\n\n3. **Qualificação do Lead:**\n   - Identifique o nível de interesse (apenas pesquisando vs. pronto para agendar)\n   - Verifique restrições (orçamento, disponibilidade, condições médicas)\n\n4. **Educação e Recomendação:**\n   - Explique os procedimentos relevantes de forma clara\n   - Destaque benefícios específicos para as necessidades do cliente\n   - Seja honesto sobre expectativas e resultados\n\n5. **Agendamento:**\n   - Ofereça datas e horários específicos para consulta de avaliação\n   - Use a ferramenta schedule_appointment quando o cliente confirmar\n\n6. **Coleta de Informações:**\n   - Use update_client para salvar nome, email e outras informações relevantes\n   - Use log_interest para registrar interesse em tratamentos específicos\n\n7. **Transferência para Humano:**\n   - Se o cliente solicitar explicitamente falar com uma pessoa\n   - Se houver dúvidas médicas complexas que você não pode responder\n   - Se o cliente demonstrar frustração ou insatisfação\n   - Use a ferramenta handoff_to_human nesses casos\n\n**Tom e Estilo:**\n- Seja profissional mas acessível\n- Use linguagem clara, evitando jargões médicos excessivos\n- Demonstre conhecimento técnico quando apropriado\n- Seja empático e não julgador\n- Use emojis ocasionalmente para tornar a conversa mais amigável (mas com moderação)\n\n**Restrições:**\n- Não forneça diagnósticos médicos\n- Não prometa resultados específicos sem avaliação presencial\n- Não compartilhe informações de outros clientes\n- Não discuta preços de concorrentes\n- Sempre indique que preços podem variar após avaliação presencial\n\n**Exemplo de Interação:**\n\nCliente: "Oi, queria saber sobre tratamento para acne"\n\nLuna: "Olá! Fico feliz em ajudar! 😊 Antes de mais nada, qual é o seu nome?\n\nEntendo sua preocupação com acne. Na Evidens Clinic, oferecemos tratamentos específicos como laserterapia para acne (R$ 350) e limpezas de pele profundas (R$ 250).\n\nPara te orientar melhor, você poderia me contar um pouco mais sobre sua pele? A acne é mais ativa (com espinhas frequentes) ou você está buscando tratar principalmente as marcas deixadas por ela?"\n\n**Lembre-se:** Seu objetivo é construir relacionamento, educar o cliente e facilitar o agendamento de uma consulta presencial, onde nossos especialistas farão uma avaliação completa e personalizada.',
  '5511949128259',
  15
);

-- Create ai_decision_log table for transparency and debugging
CREATE TABLE ai_decision_log (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR NOT NULL,
  conversa_id BIGINT REFERENCES conversas(id),
  
  -- Request details
  user_message TEXT NOT NULL,
  conversation_context JSONB,
  
  -- AI Response
  ai_response TEXT NOT NULL,
  ai_model VARCHAR NOT NULL,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  
  -- Decision tracking
  tool_calls JSONB,
  handoff_triggered BOOLEAN DEFAULT false,
  appointment_scheduled BOOLEAN DEFAULT false,
  client_updated BOOLEAN DEFAULT false,
  
  -- Classification
  intent VARCHAR,
  sentiment VARCHAR,
  confidence_score DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for ai_decision_log
ALTER TABLE ai_decision_log ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read logs
CREATE POLICY "Allow read access to ai decision logs"
  ON ai_decision_log
  FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_ai_decision_phone ON ai_decision_log(phone);
CREATE INDEX idx_ai_decision_conversa ON ai_decision_log(conversa_id);
CREATE INDEX idx_ai_decision_created ON ai_decision_log(created_at DESC);

-- Enable realtime for both tables
ALTER TABLE system_configuration REPLICA IDENTITY FULL;
ALTER TABLE ai_decision_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE system_configuration;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_decision_log;