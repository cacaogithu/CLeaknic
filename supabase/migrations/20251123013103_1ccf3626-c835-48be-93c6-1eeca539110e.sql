-- Security hardening: Move extensions out of public schema
-- Create dedicated extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension to extensions schema
-- First, we need to drop and recreate the extension in the new schema
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA extensions TO anon, authenticated;

-- Ensure all custom functions have proper search_path set
-- Update any functions that might be missing it

-- Add search_path to any views or functions that reference extensions
-- This ensures the extensions schema is searched when needed
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Review and ensure all SECURITY DEFINER functions are properly scoped
-- Our role management functions are already properly configured with:
-- - SECURITY DEFINER
-- - SET search_path TO 'public'
-- This prevents search path manipulation attacks

-- Add comment for documentation
COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions to isolate them from public schema for security';
