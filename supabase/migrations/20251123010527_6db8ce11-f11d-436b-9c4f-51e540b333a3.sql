-- ============================================================================
-- SECURITY HARDENING: Fix Linter Warnings
-- ============================================================================
-- This migration addresses the remaining security warnings:
-- 1. Security Definer Views (3 views need fixing)
-- 2. Function Search Path Mutable
-- 3. Extensions in Public Schema
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Security Definer Views
-- ============================================================================
-- Recreate views without SECURITY DEFINER to prevent privilege escalation

-- Drop and recreate clientes_com_ultima_conversa view
DROP VIEW IF EXISTS public.clientes_com_ultima_conversa;
CREATE VIEW public.clientes_com_ultima_conversa AS
SELECT 
    c.id,
    c.phone,
    c.name,
    c.status,
    c.stage,
    c.created_at,
    c.last_appointment_date,
    c.total_appointments,
    conv.last_message_at,
    conv.summary as ultima_conversa_summary
FROM public.clientes c
LEFT JOIN LATERAL (
    SELECT 
        last_message_at,
        summary
    FROM public.conversas
    WHERE cliente_id = c.id
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT 1
) conv ON true;

-- Drop and recreate ab_test_results view
DROP VIEW IF EXISTS public.ab_test_results;
CREATE VIEW public.ab_test_results AS
SELECT
    atm.test_name,
    atm.variant_name,
    COUNT(DISTINCT atm.phone) as total_users,
    COUNT(DISTINCT CASE WHEN atm.metric_name = 'conversion' THEN atm.phone END) as conversions,
    ROUND(
        (COUNT(DISTINCT CASE WHEN atm.metric_name = 'conversion' THEN atm.phone END)::numeric / 
         NULLIF(COUNT(DISTINCT atm.phone), 0) * 100), 
        2
    ) as conversion_rate_pct,
    ROUND(AVG(CASE WHEN atm.metric_name = 'messages_to_convert' THEN atm.metric_value END), 2) as avg_messages_to_convert
FROM public.ab_test_metrics atm
GROUP BY atm.test_name, atm.variant_name;

-- Drop and recreate agent_performance_metrics view
DROP VIEW IF EXISTS public.agent_performance_metrics;
CREATE VIEW public.agent_performance_metrics AS
SELECT
    DATE(adl.created_at) as date,
    COUNT(DISTINCT adl.conversa_id) as total_conversations,
    COUNT(DISTINCT CASE WHEN adl.intent IS NOT NULL THEN adl.conversa_id END) as conversations_with_intent,
    COUNT(DISTINCT CASE WHEN adl.appointment_scheduled = true THEN adl.conversa_id END) as appointments_scheduled,
    COUNT(DISTINCT CASE WHEN adl.handoff_triggered = true THEN adl.conversa_id END) as handoffs_triggered,
    ROUND(AVG(adl.response_time_ms), 2) as avg_response_time_ms,
    ROUND(AVG(adl.tokens_used), 2) as avg_tokens,
    ROUND(AVG(adl.confidence_score), 2) as avg_confidence
FROM public.ai_decision_log adl
GROUP BY DATE(adl.created_at);

-- ============================================================================
-- PART 2: Fix Function Search Paths
-- ============================================================================
-- Set explicit search_path on the handle_new_user function to prevent attacks

-- Recreate handle_new_user with proper search_path
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 3: Move Extensions Out of Public Schema
-- ============================================================================
-- NOTE: Extensions pg_net and vector cannot be moved in a migration
-- They require superuser privileges and must be managed by Supabase directly
-- This is documented as a known limitation and acceptable warning

-- ============================================================================
-- PART 4: Enable Leaked Password Protection
-- ============================================================================
-- NOTE: This must be done via Supabase Dashboard > Authentication > Password Settings
-- Cannot be done via SQL migration
-- Action required: Navigate to https://supabase.com/dashboard/project/zslgqpnodzbehuflnbpq/auth/policies
-- and enable "Leaked Password Protection"

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify views no longer have SECURITY DEFINER
-- SELECT viewname, viewowner, definition 
-- FROM pg_views 
-- WHERE schemaname = 'public' 
-- AND viewname IN ('clientes_com_ultima_conversa', 'ab_test_results', 'agent_performance_metrics');

-- Verify function has search_path set
-- SELECT proname, prosrc, prosecdef, proconfig
-- FROM pg_proc 
-- WHERE proname = 'handle_new_user';