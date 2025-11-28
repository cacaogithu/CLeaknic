-- Fix timezone handling in recall triggers and correct existing pending followups

-- ============================================
-- 1. Fix create_post_consultation_recall trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.create_post_consultation_recall()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    v_doctor_name VARCHAR;
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

    -- Calcular data/hora de envio com timezone São Paulo
    -- Primeiro, construir timestamp na timezone São Paulo, depois converter para UTC
    v_scheduled_for := (
        ((NEW.appointment_date::DATE + v_delay_days * INTERVAL '1 day')::TEXT || ' ' || v_config.send_hour::TEXT || ':00:00')::TIMESTAMP 
        AT TIME ZONE 'America/Sao_Paulo'
    ) AT TIME ZONE 'UTC';

    -- Buscar conversa_id
    SELECT id INTO v_conversa_id FROM conversas WHERE phone = NEW.phone ORDER BY last_message_at DESC LIMIT 1;

    -- Buscar nome do médico do appointment
    SELECT d.name INTO v_doctor_name FROM doctors d WHERE d.id = NEW.doctor_id;

    -- Montar mensagem personalizada
    v_message := v_config.message_template;
    v_message := REPLACE(v_message, '{nome}', COALESCE(v_client.client_name, v_client.name, 'paciente'));
    v_message := REPLACE(v_message, '{data_consulta}', TO_CHAR(NEW.appointment_date::DATE, 'DD/MM'));
    v_message := REPLACE(v_message, '{procedimento}', COALESCE(NEW.procedure, 'consulta'));
    v_message := REPLACE(v_message, '{medico}', COALESCE(v_doctor_name, 'Nossa equipe'));

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

    RAISE LOG 'Recall pós-consulta criado para % agendado para % (UTC)', NEW.phone, v_scheduled_for;

    RETURN NEW;
END;
$$;

-- ============================================
-- 2. Fix create_budget_recall trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.create_budget_recall()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

    -- Calcular data/hora de envio com timezone São Paulo
    v_scheduled_for := (
        ((CURRENT_DATE + v_delay_days * INTERVAL '1 day')::TEXT || ' ' || v_config.send_hour::TEXT || ':00:00')::TIMESTAMP 
        AT TIME ZONE 'America/Sao_Paulo'
    ) AT TIME ZONE 'UTC';

    -- Buscar conversa_id
    SELECT id INTO v_conversa_id FROM conversas WHERE phone = NEW.phone ORDER BY last_message_at DESC LIMIT 1;

    -- Montar mensagem personalizada
    v_message := v_config.message_template;
    v_message := REPLACE(v_message, '{nome}', COALESCE(v_client.client_name, v_client.name, 'paciente'));
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

-- ============================================
-- 3. Correct existing pending followups (add 3 hours)
-- ============================================
UPDATE followups
SET 
    scheduled_for = scheduled_for + INTERVAL '3 hours',
    metadata = CASE 
        WHEN metadata IS NOT NULL THEN metadata || jsonb_build_object('timezone_corrected', true, 'correction_applied_at', NOW())
        ELSE jsonb_build_object('timezone_corrected', true, 'correction_applied_at', NOW())
    END
WHERE status = 'pendente'
AND type = 'recall'
-- Only correct those that seem wrong (scheduled before 6 AM UTC, which would be 3 AM São Paulo)
AND EXTRACT(HOUR FROM scheduled_for) < 6;