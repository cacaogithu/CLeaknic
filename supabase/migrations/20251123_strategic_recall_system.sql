-- ============================================================================
-- SISTEMA DE RECALL ESTRATÉGICO
-- ============================================================================
-- Implementa 3 tipos de recall conforme estratégia de clínica:
-- 1. Recall Pós-Consulta (2-5 dias após consulta sem procedimento agendado)
-- 2. Recall Pós-Procedimento (7-10 dias após procedimento realizado)
-- 3. Recall de Orçamentos Não Realizados (7-15 dias após orçamento enviado)
-- ============================================================================

-- ============================================================================
-- PART 1: Tabela de Orçamentos (budgets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budgets (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES public.clientes(id),
    conversa_id INTEGER REFERENCES public.conversas(id),
    phone VARCHAR(20) NOT NULL,
    treatment_name VARCHAR(255),
    budget_value DECIMAL(10,2),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    appointment_scheduled BOOLEAN DEFAULT FALSE,
    appointment_id INTEGER REFERENCES public.appointments(id),
    recall_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para queries de recall
CREATE INDEX IF NOT EXISTS idx_budgets_recall_pending
ON public.budgets(sent_at, appointment_scheduled, recall_sent)
WHERE appointment_scheduled = FALSE AND recall_sent = FALSE;

-- RLS para budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to budgets"
ON public.budgets FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read budgets"
ON public.budgets FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert budgets"
ON public.budgets FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================================
-- PART 2: Configurações de Recall
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recall_config (
    id SERIAL PRIMARY KEY,
    recall_type VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    delay_days_min INTEGER NOT NULL,
    delay_days_max INTEGER NOT NULL,
    send_hour INTEGER DEFAULT 10, -- Hora preferencial de envio (10h)
    message_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO public.recall_config (recall_type, delay_days_min, delay_days_max, message_template) VALUES
(
    'post_consultation',
    2,
    5,
    'Olá {nome}! 😊

A Dra. Ana adorou te atender na sua consulta do dia {data_consulta}!

Ficou alguma dúvida sobre o protocolo sugerido? Estamos aqui para te ajudar no que precisar.

Responda essa mensagem se quiser agendar seu procedimento ou tirar qualquer dúvida! 💜'
),
(
    'post_procedure',
    7,
    10,
    'Oii {nome}! Tudo certo por aí? 😊

Como você está se sentindo após o {procedimento}? A Dra. Ana pediu para enviar uma mensagem para saber como você está!

Você sabia que seguir direitinho as orientações aumenta muito a eficácia do tratamento?

Qualquer dúvida ou se precisar de algo, é só me chamar! 💜'
),
(
    'budget_not_scheduled',
    7,
    15,
    'Olá {nome}! 😊

Notamos que você recebeu seu plano de tratamento para {tratamento}, mas ainda não agendou.

Tem alguma dúvida ou gostaria de conversar novamente com a Dra. Ana?

Estamos aqui para te ajudar a dar esse passo importante para você! 💜

Responda essa mensagem para conversarmos melhor.'
)
ON CONFLICT (recall_type) DO UPDATE SET
    delay_days_min = EXCLUDED.delay_days_min,
    delay_days_max = EXCLUDED.delay_days_max,
    message_template = EXCLUDED.message_template,
    updated_at = NOW();

-- RLS para recall_config
ALTER TABLE public.recall_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to recall_config"
ON public.recall_config FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read recall_config"
ON public.recall_config FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update recall_config"
ON public.recall_config FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

-- ============================================================================
-- PART 3: Adicionar campos na tabela followups
-- ============================================================================

-- Adicionar campo appointment_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'followups' AND column_name = 'appointment_id'
    ) THEN
        ALTER TABLE public.followups ADD COLUMN appointment_id INTEGER REFERENCES public.appointments(id);
    END IF;
END $$;

-- Adicionar campo budget_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'followups' AND column_name = 'budget_id'
    ) THEN
        ALTER TABLE public.followups ADD COLUMN budget_id INTEGER REFERENCES public.budgets(id);
    END IF;
END $$;

-- ============================================================================
-- PART 4: Função para criar Recall Pós-Consulta
-- ============================================================================

CREATE OR REPLACE FUNCTION create_post_consultation_recall()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config RECORD;
    v_client RECORD;
    v_has_future_appointment BOOLEAN;
    v_existing_recall INTEGER;
    v_delay_days INTEGER;
    v_scheduled_for TIMESTAMP WITH TIME ZONE;
    v_message TEXT;
    v_conversa_id INTEGER;
BEGIN
    -- Só processa se status mudou para 'completed'
    IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
        RETURN NEW;
    END IF;

    -- Verificar se recall está habilitado
    SELECT * INTO v_config FROM recall_config WHERE recall_type = 'post_consultation' AND enabled = TRUE;
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Buscar cliente
    SELECT * INTO v_client FROM clientes WHERE phone = NEW.phone;

    -- Verificar se já existe agendamento futuro (indica que já marcou procedimento)
    SELECT EXISTS(
        SELECT 1 FROM appointments
        WHERE phone = NEW.phone
        AND appointment_date > NEW.appointment_date
        AND status NOT IN ('cancelada_paciente', 'no_show')
    ) INTO v_has_future_appointment;

    IF v_has_future_appointment THEN
        -- Cliente já tem próximo agendamento, não precisa de recall
        RETURN NEW;
    END IF;

    -- Verificar se já existe recall pendente para esta consulta
    SELECT id INTO v_existing_recall FROM followups
    WHERE appointment_id = NEW.id
    AND recall_type = 'post_consultation'
    AND status = 'pendente';

    IF FOUND THEN
        -- Já existe recall pendente
        RETURN NEW;
    END IF;

    -- Calcular delay aleatório entre min e max (para parecer natural)
    v_delay_days := v_config.delay_days_min +
        floor(random() * (v_config.delay_days_max - v_config.delay_days_min + 1))::INTEGER;

    -- Calcular data/hora de envio (no horário configurado)
    v_scheduled_for := (NEW.appointment_date::DATE + v_delay_days * INTERVAL '1 day')::DATE
        + (v_config.send_hour || ' hours')::INTERVAL;

    -- Buscar conversa_id
    SELECT id INTO v_conversa_id FROM conversas WHERE phone = NEW.phone ORDER BY last_message_at DESC LIMIT 1;

    -- Montar mensagem personalizada
    v_message := v_config.message_template;
    v_message := REPLACE(v_message, '{nome}', COALESCE(v_client.name, v_client.client_name, 'paciente'));
    v_message := REPLACE(v_message, '{data_consulta}', TO_CHAR(NEW.appointment_date::DATE, 'DD/MM'));
    v_message := REPLACE(v_message, '{procedimento}', COALESCE(NEW.procedure, 'consulta'));

    -- Criar recall
    INSERT INTO followups (
        phone,
        cliente_id,
        conversa_id,
        appointment_id,
        type,
        recall_type,
        trigger_event,
        trigger_event_date,
        scheduled_for,
        message,
        status,
        metadata
    ) VALUES (
        NEW.phone,
        v_client.id,
        v_conversa_id,
        NEW.id,
        'recall',
        'post_consultation',
        'consultation_completed',
        NEW.appointment_date,
        v_scheduled_for,
        v_message,
        'pendente',
        jsonb_build_object(
            'appointment_id', NEW.id,
            'consultation_date', NEW.appointment_date,
            'procedure', NEW.procedure,
            'delay_days', v_delay_days
        )
    );

    -- Marcar na conversa que recall foi agendado
    UPDATE conversas SET post_consultation_recall_sent = FALSE
    WHERE phone = NEW.phone AND id = v_conversa_id;

    RAISE LOG 'Recall pós-consulta criado para % agendado para %', NEW.phone, v_scheduled_for;

    RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_post_consultation_recall ON appointments;
CREATE TRIGGER trg_post_consultation_recall
    AFTER UPDATE OF status ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_post_consultation_recall();

-- ============================================================================
-- PART 5: Função para criar Recall Pós-Procedimento
-- ============================================================================

CREATE OR REPLACE FUNCTION create_post_procedure_recall(
    p_phone VARCHAR,
    p_appointment_id INTEGER,
    p_procedure_name VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config RECORD;
    v_client RECORD;
    v_existing_recall INTEGER;
    v_delay_days INTEGER;
    v_scheduled_for TIMESTAMP WITH TIME ZONE;
    v_message TEXT;
    v_conversa_id INTEGER;
    v_appointment RECORD;
BEGIN
    -- Verificar se recall está habilitado
    SELECT * INTO v_config FROM recall_config WHERE recall_type = 'post_procedure' AND enabled = TRUE;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Buscar appointment
    SELECT * INTO v_appointment FROM appointments WHERE id = p_appointment_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Buscar cliente
    SELECT * INTO v_client FROM clientes WHERE phone = p_phone;

    -- Verificar se já existe recall para este procedimento
    SELECT id INTO v_existing_recall FROM followups
    WHERE appointment_id = p_appointment_id
    AND recall_type = 'post_procedure'
    AND status = 'pendente';

    IF FOUND THEN
        RETURN FALSE;
    END IF;

    -- Calcular delay aleatório
    v_delay_days := v_config.delay_days_min +
        floor(random() * (v_config.delay_days_max - v_config.delay_days_min + 1))::INTEGER;

    v_scheduled_for := (CURRENT_DATE + v_delay_days * INTERVAL '1 day')::DATE
        + (v_config.send_hour || ' hours')::INTERVAL;

    -- Buscar conversa_id
    SELECT id INTO v_conversa_id FROM conversas WHERE phone = p_phone ORDER BY last_message_at DESC LIMIT 1;

    -- Montar mensagem personalizada
    v_message := v_config.message_template;
    v_message := REPLACE(v_message, '{nome}', COALESCE(v_client.name, v_client.client_name, 'paciente'));
    v_message := REPLACE(v_message, '{procedimento}', COALESCE(p_procedure_name, v_appointment.procedure, 'procedimento'));

    -- Criar recall
    INSERT INTO followups (
        phone,
        cliente_id,
        conversa_id,
        appointment_id,
        type,
        recall_type,
        trigger_event,
        trigger_event_date,
        scheduled_for,
        message,
        status,
        metadata
    ) VALUES (
        p_phone,
        v_client.id,
        v_conversa_id,
        p_appointment_id,
        'recall',
        'post_procedure',
        'procedure_completed',
        CURRENT_DATE,
        v_scheduled_for,
        v_message,
        'pendente',
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'procedure_name', p_procedure_name,
            'procedure_date', CURRENT_DATE,
            'delay_days', v_delay_days
        )
    );

    -- Marcar na conversa
    UPDATE conversas SET post_procedure_recall_sent = FALSE
    WHERE phone = p_phone AND id = v_conversa_id;

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- PART 6: Função para criar Recall de Orçamento
-- ============================================================================

CREATE OR REPLACE FUNCTION create_budget_recall()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config RECORD;
    v_client RECORD;
    v_existing_recall INTEGER;
    v_delay_days INTEGER;
    v_scheduled_for TIMESTAMP WITH TIME ZONE;
    v_message TEXT;
    v_conversa_id INTEGER;
BEGIN
    -- Só cria recall para novos orçamentos
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;

    -- Se já tem agendamento marcado, não precisa de recall
    IF NEW.appointment_scheduled = TRUE THEN
        RETURN NEW;
    END IF;

    -- Verificar se recall está habilitado
    SELECT * INTO v_config FROM recall_config WHERE recall_type = 'budget_not_scheduled' AND enabled = TRUE;
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Buscar cliente
    SELECT * INTO v_client FROM clientes WHERE phone = NEW.phone;

    -- Verificar se já existe recall pendente para este orçamento
    SELECT id INTO v_existing_recall FROM followups
    WHERE budget_id = NEW.id
    AND recall_type = 'budget_not_scheduled'
    AND status = 'pendente';

    IF FOUND THEN
        RETURN NEW;
    END IF;

    -- Calcular delay aleatório
    v_delay_days := v_config.delay_days_min +
        floor(random() * (v_config.delay_days_max - v_config.delay_days_min + 1))::INTEGER;

    v_scheduled_for := (CURRENT_DATE + v_delay_days * INTERVAL '1 day')::DATE
        + (v_config.send_hour || ' hours')::INTERVAL;

    -- Buscar conversa_id
    SELECT id INTO v_conversa_id FROM conversas WHERE phone = NEW.phone ORDER BY last_message_at DESC LIMIT 1;

    -- Montar mensagem personalizada
    v_message := v_config.message_template;
    v_message := REPLACE(v_message, '{nome}', COALESCE(v_client.name, v_client.client_name, 'paciente'));
    v_message := REPLACE(v_message, '{tratamento}', COALESCE(NEW.treatment_name, 'seu tratamento'));

    -- Criar recall
    INSERT INTO followups (
        phone,
        cliente_id,
        conversa_id,
        budget_id,
        type,
        recall_type,
        trigger_event,
        trigger_event_date,
        scheduled_for,
        message,
        status,
        metadata
    ) VALUES (
        NEW.phone,
        v_client.id,
        v_conversa_id,
        NEW.id,
        'recall',
        'budget_not_scheduled',
        'budget_sent',
        NEW.sent_at,
        v_scheduled_for,
        v_message,
        'pendente',
        jsonb_build_object(
            'budget_id', NEW.id,
            'treatment_name', NEW.treatment_name,
            'budget_value', NEW.budget_value,
            'delay_days', v_delay_days
        )
    );

    -- Marcar na conversa
    UPDATE conversas SET budget_recall_sent = FALSE
    WHERE phone = NEW.phone AND id = v_conversa_id;

    RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_budget_recall ON budgets;
CREATE TRIGGER trg_budget_recall
    AFTER INSERT ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION create_budget_recall();

-- ============================================================================
-- PART 7: Função para cancelar recalls quando agendamento é feito
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_pending_recalls_on_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Se é um novo agendamento, cancelar recalls de orçamento pendentes
    IF TG_OP = 'INSERT' THEN
        -- Cancelar recalls de orçamento não agendado
        UPDATE followups
        SET status = 'cancelled',
            metadata = metadata || jsonb_build_object('cancelled_reason', 'appointment_scheduled', 'cancelled_at', NOW())
        WHERE phone = NEW.phone
        AND recall_type = 'budget_not_scheduled'
        AND status = 'pendente';

        -- Marcar orçamentos como agendados
        UPDATE budgets
        SET appointment_scheduled = TRUE, appointment_id = NEW.id
        WHERE phone = NEW.phone
        AND appointment_scheduled = FALSE;

        -- Cancelar recalls pós-consulta se novo agendamento é procedimento
        IF NEW.procedure IS NOT NULL AND NEW.procedure NOT ILIKE '%consulta%' AND NEW.procedure NOT ILIKE '%avaliação%' THEN
            UPDATE followups
            SET status = 'cancelled',
                metadata = metadata || jsonb_build_object('cancelled_reason', 'procedure_scheduled', 'cancelled_at', NOW())
            WHERE phone = NEW.phone
            AND recall_type = 'post_consultation'
            AND status = 'pendente';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_cancel_recalls_on_appointment ON appointments;
CREATE TRIGGER trg_cancel_recalls_on_appointment
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION cancel_pending_recalls_on_appointment();

-- ============================================================================
-- PART 8: View para monitoramento de recalls
-- ============================================================================

DROP VIEW IF EXISTS public.recall_dashboard;
CREATE VIEW public.recall_dashboard AS
SELECT
    recall_type,
    status,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE scheduled_for < NOW()) as overdue,
    COUNT(*) FILTER (WHERE scheduled_for >= NOW() AND scheduled_for < NOW() + INTERVAL '24 hours') as due_today,
    COUNT(*) FILTER (WHERE scheduled_for >= NOW() + INTERVAL '24 hours' AND scheduled_for < NOW() + INTERVAL '7 days') as due_this_week
FROM followups
WHERE type = 'recall'
GROUP BY recall_type, status
ORDER BY recall_type, status;

-- ============================================================================
-- PART 9: Índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_followups_recall_pending
ON followups(recall_type, scheduled_for)
WHERE status = 'pendente' AND type = 'recall';

CREATE INDEX IF NOT EXISTS idx_followups_appointment_id
ON followups(appointment_id) WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_followups_budget_id
ON followups(budget_id) WHERE budget_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_status_date
ON appointments(status, appointment_date);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Para verificar se tudo foi criado corretamente:
-- SELECT * FROM recall_config;
-- SELECT * FROM recall_dashboard;
-- \df create_post_consultation_recall
-- \df create_post_procedure_recall
-- \df create_budget_recall
