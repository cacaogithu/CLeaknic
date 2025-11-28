-- ============================================================================
-- CRITICAL SECURITY FIX: RLS Policies & Status Default
-- ============================================================================
-- This migration addresses:
-- 1. Public exposure of patient PII in clientes table (LGPD violation)
-- 2. Public exposure of medical data in appointments table
-- 3. Broken INSERT policy blocking service role
-- 4. Incorrect status default value
-- ============================================================================

-- ============================================================================
-- PART 1: Fix appointments table
-- ============================================================================

-- 1.1: Change status default from 'confirmada' to 'pendente_confirmacao'
ALTER TABLE public.appointments 
ALTER COLUMN status SET DEFAULT 'pendente_confirmacao'::character varying;

-- 1.2: Drop all existing RLS policies on appointments
DROP POLICY IF EXISTS "Allow insert on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow update on appointments" ON public.appointments;

-- 1.3: Create new secure RLS policies for appointments
-- Service role has full access (for edge functions)
CREATE POLICY "Service role full access to appointments"
ON public.appointments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read all appointments (for Eliana dashboard)
CREATE POLICY "Authenticated users can read appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert appointments (for manual creation)
CREATE POLICY "Authenticated users can insert appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update appointments
CREATE POLICY "Authenticated users can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can delete appointments
CREATE POLICY "Authenticated users can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- PART 2: Fix clientes table (CRITICAL: Contains PII)
-- ============================================================================

-- 2.1: Drop existing dangerous public policies
DROP POLICY IF EXISTS "Allow public read access to clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow public update access to clientes" ON public.clientes;

-- 2.2: Create secure RLS policies for clientes
-- Service role has full access (for edge functions and AI agent)
CREATE POLICY "Service role full access to clientes"
ON public.clientes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read all clients (for Eliana dashboard)
CREATE POLICY "Authenticated users can read clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can update clients (for manual updates)
CREATE POLICY "Authenticated users can update clientes"
ON public.clientes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can insert clients (for manual creation)
CREATE POLICY "Authenticated users can insert clientes"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- PART 3: Fix conversas table (contains conversation summaries)
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Allow public read access to conversas" ON public.conversas;

-- Service role full access
CREATE POLICY "Service role full access to conversas"
ON public.conversas
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read conversations
CREATE POLICY "Authenticated users can read conversas"
ON public.conversas
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- PART 4: Fix mensagens table (contains WhatsApp messages)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert access to mensagens" ON public.mensagens;
DROP POLICY IF EXISTS "Allow public read access to mensagens" ON public.mensagens;

-- Service role full access
CREATE POLICY "Service role full access to mensagens"
ON public.mensagens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read messages
CREATE POLICY "Authenticated users can read mensagens"
ON public.mensagens
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- PART 5: Fix followups table
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Allow public read access to followups" ON public.followups;

-- Service role full access
CREATE POLICY "Service role full access to followups"
ON public.followups
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read followups
CREATE POLICY "Authenticated users can read followups"
ON public.followups
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- PART 6: Fix interesses table
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Allow public read access to interesses" ON public.interesses;

-- Service role full access
CREATE POLICY "Service role full access to interesses"
ON public.interesses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read interests
CREATE POLICY "Authenticated users can read interesses"
ON public.interesses
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- PART 7: Fix doctors table
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Allow public read access to doctors" ON public.doctors;

-- Service role full access
CREATE POLICY "Service role full access to doctors"
ON public.doctors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read doctors
CREATE POLICY "Authenticated users can read doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration to verify)
-- ============================================================================

-- Verify appointments status default
-- SELECT column_name, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'appointments' AND column_name = 'status';

-- Verify RLS policies on appointments
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'appointments';

-- Verify RLS policies on clientes
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'clientes';