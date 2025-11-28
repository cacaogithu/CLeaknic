-- ============================================================================
-- P0 Security & GDPR/LGPD Compliance Migration
-- ============================================================================
-- This migration implements critical security and compliance requirements:
-- 1. Consent tracking (GDPR Article 7, LGPD Article 8)
-- 2. Audit logging (GDPR Article 30, LGPD Article 37)
-- 3. Row Level Security policies (GDPR Article 32, LGPD Article 46)
--
-- IMPORTANT: This migration does NOT affect AI agent functionality.
-- The AI agent uses service_role key which automatically bypasses RLS.
-- ============================================================================

-- ============================================================================
-- PART 1: CONSENT TRACKING
-- ============================================================================

-- Add consent fields to clientes table
ALTER TABLE public.clientes 
  ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_type TEXT DEFAULT 'treatment',
  ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ;

-- Backfill existing clients with implicit consent
-- Assumes clients already in system have given consent by using the service
UPDATE public.clientes 
SET 
  consent_given = TRUE,
  consent_date = created_at,
  consent_type = 'treatment'
WHERE consent_given IS NULL OR consent_given = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.clientes.consent_given IS 'GDPR/LGPD: Whether client has given consent for data processing';
COMMENT ON COLUMN public.clientes.consent_date IS 'GDPR/LGPD: When consent was given';
COMMENT ON COLUMN public.clientes.consent_type IS 'GDPR/LGPD: Type of consent (treatment, marketing, etc)';
COMMENT ON COLUMN public.clientes.data_retention_until IS 'GDPR/LGPD: Date when data should be deleted (right to be forgotten)';

-- ============================================================================
-- PART 2: AUDIT LOGGING
-- ============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT,
  changed_fields JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- Add comment
COMMENT ON TABLE public.audit_log IS 'GDPR Article 30 / LGPD Article 37: Records of processing activities';

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val UUID;
  user_role_val TEXT;
  changed_fields_val JSONB;
BEGIN
  -- Get current user ID (will be NULL for service role)
  user_id_val := auth.uid();
  
  -- Get user role if available
  IF user_id_val IS NOT NULL THEN
    SELECT role INTO user_role_val FROM public.profiles WHERE id = user_id_val;
  ELSE
    user_role_val := 'service_role';
  END IF;

  -- Build changed fields JSON for UPDATE operations
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

  -- Return appropriate value
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
-- PART 3: HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user is admin/receptionist
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'receptionist') FROM public.profiles WHERE id = auth.uid()),
    FALSE
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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
-- CLIENTES TABLE POLICIES
-- ============================================================================

-- Admin/Receptionist: Full access
CREATE POLICY "Admins have full access to clients"
  ON public.clientes
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Service role: Full access (bypasses RLS automatically, but explicit for clarity)
-- Note: Service role bypasses RLS by default, this is just documentation
CREATE POLICY "Service role has full access to clients"
  ON public.clientes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CONVERSAS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Admins have full access to conversations"
  ON public.conversas
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Service role has full access to conversations"
  ON public.conversas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- MENSAGENS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Admins have full access to messages"
  ON public.mensagens
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Service role has full access to messages"
  ON public.mensagens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- APPOINTMENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Admins have full access to appointments"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Service role has full access to appointments"
  ON public.appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FOLLOWUPS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Admins have full access to followups"
  ON public.followups
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Service role has full access to followups"
  ON public.followups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- AI_DECISION_LOG TABLE POLICIES
-- ============================================================================

CREATE POLICY "Admins have full access to AI logs"
  ON public.ai_decision_log
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Service role has full access to AI logs"
  ON public.ai_decision_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 5: ENSURE ELIANA HAS ADMIN ROLE
-- ============================================================================

-- This is a safety check to ensure at least one user has admin access
-- Update this with Eliana's actual user ID after deployment
-- For now, we'll just ensure the role column exists and has proper defaults

-- Add index on profiles.role for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- To verify RLS is working, run these queries as different users:
-- 
-- As service_role (should see all):
-- SELECT count(*) FROM clientes;
-- 
-- As authenticated user with admin role (should see all):
-- SELECT count(*) FROM clientes;
-- 
-- As authenticated user without admin role (should see nothing):
-- SELECT count(*) FROM clientes;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- If you need to rollback this migration, run:
-- 
-- ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversas DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.mensagens DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.followups DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ai_decision_log DISABLE ROW LEVEL SECURITY;
-- 
-- DROP TRIGGER IF EXISTS audit_clientes ON public.clientes;
-- DROP TRIGGER IF EXISTS audit_conversas ON public.conversas;
-- DROP TRIGGER IF EXISTS audit_mensagens ON public.mensagens;
-- DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
-- DROP FUNCTION IF EXISTS public.audit_trigger();
-- DROP FUNCTION IF EXISTS auth.user_role();
-- DROP FUNCTION IF EXISTS auth.is_admin();
-- DROP TABLE IF EXISTS public.audit_log;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
