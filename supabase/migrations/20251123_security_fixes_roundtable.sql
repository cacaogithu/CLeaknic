-- ============================================================================
-- Security Roundtable Remediation Plan
-- ============================================================================
-- Addresses linter issues:
-- 1. function_search_path_mutable (update_updated_at_column)
-- 2. extension_in_public (pg_net)
-- 3. rls_disabled_in_public (audit_log)
-- 4. security_definer_view (various views)
-- ============================================================================

-- 1. Fix Mutable Search Path
-- Redefine the function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- 2. Fix Extension in Public
-- Move pg_net to extensions schema (create if not exists)
CREATE SCHEMA IF NOT EXISTS extensions;
-- Attempt to move extension (this might fail if permissions are restricted, so we wrap in DO block or just try)
-- Note: This requires superuser usually. If it fails, the user needs to run it via dashboard.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    ALTER EXTENSION pg_net SET SCHEMA extensions;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not move pg_net extension: %', SQLERRM;
END $$;

-- 3. Fix RLS on Audit Log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Ensure helper function exists (Safe version using JWT)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid 
    AND role IN ('admin', 'receptionist')
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create policy for audit log (Admins can view, Service Role can view/insert)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Service role full access audit logs" ON public.audit_log;
CREATE POLICY "Service role full access audit logs"
  ON public.audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
  
-- 4. Fix Security Definer Views
-- We recreate them with security_invoker = true to enforce RLS
-- Note: We need the original definitions. Since we don't have them all perfectly, 
-- we will attempt to ALTER them if Postgres 15+.
-- If not, we would need to drop and recreate. 
-- Assuming Postgres 15+ (standard on Supabase now).

-- clientes_com_ultima_conversa
ALTER VIEW public.clientes_com_ultima_conversa SET (security_invoker = true);

-- agent_performance_metrics
ALTER VIEW public.agent_performance_metrics SET (security_invoker = true);

-- ab_test_results
ALTER VIEW public.ab_test_results SET (security_invoker = true);

-- recall_dashboard
ALTER VIEW public.recall_dashboard SET (security_invoker = true);

-- 5. Enable Password Protection (Instruction only)
-- This cannot be done via SQL migration usually, it's a project setting.
-- We will add a comment here.
-- "Go to Authentication > Security in Supabase Dashboard and enable 'Detect leaked passwords'"
