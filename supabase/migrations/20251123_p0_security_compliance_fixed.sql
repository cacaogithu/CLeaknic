-- ============================================================================
-- P0 Security & GDPR/LGPD Compliance Migration (MINIMAL SAFE VERSION)
-- ============================================================================
-- This version avoids ALL auth schema issues by using current_setting
-- ============================================================================

-- ============================================================================
-- PART 1: CONSENT TRACKING (ZERO RISK - NO AUTH SCHEMA)
-- ============================================================================

-- Add consent fields to clientes table
ALTER TABLE public.clientes 
  ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_type TEXT DEFAULT 'treatment',
  ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ;

-- Backfill existing clients with implicit consent
UPDATE public.clientes 
SET 
  consent_given = TRUE,
  consent_date = created_at,
  consent_type = 'treatment'
WHERE consent_given IS NULL OR consent_given = FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.clientes.consent_given IS 'GDPR/LGPD: Whether client has given consent for data processing';
COMMENT ON COLUMN public.clientes.consent_date IS 'GDPR/LGPD: When consent was given';
COMMENT ON COLUMN public.clientes.consent_type IS 'GDPR/LGPD: Type of consent (treatment, marketing, etc)';
COMMENT ON COLUMN public.clientes.data_retention_until IS 'GDPR/LGPD: Date when data should be deleted (right to be forgotten)';

-- ============================================================================
-- PART 2: AUDIT LOGGING (SIMPLIFIED - NO AUTH SCHEMA DEPENDENCY)
-- ============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  user_id UUID,
  user_role TEXT,
  changed_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

COMMENT ON TABLE public.audit_log IS 'GDPR Article 30 / LGPD Article 37: Records of processing activities';

-- Simplified audit trigger function that doesn't use auth schema
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val UUID;
  user_role_val TEXT;
  changed_fields_val JSONB;
BEGIN
  -- Try to get user ID from JWT claims (works without auth schema access)
  BEGIN
    user_id_val := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN OTHERS THEN
    user_id_val := NULL;
  END;
  
  -- Get user role if we have a user_id
  IF user_id_val IS NOT NULL THEN
    SELECT role INTO user_role_val FROM public.profiles WHERE id = user_id_val::uuid;
  ELSE
    user_role_val := 'service_role';
  END IF;

  -- Build changed fields JSON
  IF TG_OP = 'UPDATE' THEN
    changed_fields_val := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'INSERT' THEN
    changed_fields_val := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    changed_fields_val := to_jsonb(OLD);
  END IF;

  -- Insert audit record
  INSERT INTO public.audit_log (
    table_name,
    record_id,
    action,
    user_id,
    user_role,
    changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    user_id_val,
    user_role_val,
    changed_fields_val
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_clientes ON public.clientes;
CREATE TRIGGER audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_conversas ON public.conversas;
CREATE TRIGGER audit_conversas
  AFTER INSERT OR UPDATE OR DELETE ON public.conversas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_mensagens ON public.mensagens;
CREATE TRIGGER audit_mensagens
  AFTER INSERT OR UPDATE OR DELETE ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============================================================================
-- PART 3: RLS HELPER FUNCTIONS (NO AUTH SCHEMA DEPENDENCY)
-- ============================================================================

-- Function to get current user's role using JWT claims
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_id_val UUID;
BEGIN
  -- Get user ID from JWT claims
  BEGIN
    user_id_val := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
  
  -- Return role from profiles
  RETURN (SELECT role FROM public.profiles WHERE id = user_id_val::uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    public.get_current_user_role() IN ('admin', 'receptionist'),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on critical tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CLIENTES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins have full access to clients" ON public.clientes;
DROP POLICY IF EXISTS "Service role has full access to clients" ON public.clientes;

CREATE POLICY "Admins have full access to clients"
  ON public.clientes FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Service role has full access to clients"
  ON public.clientes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- CONVERSAS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins have full access to conversations" ON public.conversas;
DROP POLICY IF EXISTS "Service role has full access to conversations" ON public.conversas;

CREATE POLICY "Admins have full access to conversations"
  ON public.conversas FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Service role has full access to conversations"
  ON public.conversas FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- MENSAGENS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins have full access to messages" ON public.mensagens;
DROP POLICY IF EXISTS "Service role has full access to messages" ON public.mensagens;

CREATE POLICY "Admins have full access to messages"
  ON public.mensagens FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Service role has full access to messages"
  ON public.mensagens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- APPOINTMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins have full access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Service role has full access to appointments" ON public.appointments;

CREATE POLICY "Admins have full access to appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Service role has full access to appointments"
  ON public.appointments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- FOLLOWUPS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins have full access to followups" ON public.followups;
DROP POLICY IF EXISTS "Service role has full access to followups" ON public.followups;

CREATE POLICY "Admins have full access to followups"
  ON public.followups FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Service role has full access to followups"
  ON public.followups FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- AI_DECISION_LOG POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins have full access to AI logs" ON public.ai_decision_log;
DROP POLICY IF EXISTS "Service role has full access to AI logs" ON public.ai_decision_log;

CREATE POLICY "Admins have full access to AI logs"
  ON public.ai_decision_log FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Service role has full access to AI logs"
  ON public.ai_decision_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('clientes', 'conversas', 'mensagens', 'appointments', 'followups', 'ai_decision_log');

-- Verify consent fields
SELECT count(*) as consent_fields_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'clientes'
  AND column_name IN ('consent_given', 'consent_date', 'consent_type', 'data_retention_until');

-- Verify audit table
SELECT count(*) as audit_table_exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'audit_log';

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversas DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.mensagens DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.followups DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ai_decision_log DISABLE ROW LEVEL SECURITY;
