-- ============================================================================
-- SECURITY ENHANCEMENT: User Roles System with Security Definer Functions
-- ============================================================================
-- This migration implements proper role management to avoid recursive RLS
-- and enable role-based access control for future features
-- ============================================================================

-- ============================================================================
-- PART 1: Create Role Enum
-- ============================================================================

-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'receptionist', 'viewer');

-- ============================================================================
-- PART 2: Create User Roles Table
-- ============================================================================

-- Create user_roles table to store role assignments
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: Create Security Definer Function for Role Checking
-- ============================================================================

-- Function to check if a user has a specific role
-- Uses SECURITY DEFINER to avoid recursive RLS issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- ============================================================================
-- PART 4: RLS Policies for user_roles Table
-- ============================================================================

-- Service role has full access
CREATE POLICY "Service role full access to user_roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can manage roles (insert/update/delete)
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- PART 5: Assign Initial Admin Role
-- ============================================================================

-- This function will automatically assign admin role to the first user
-- or can be called manually to assign roles
CREATE OR REPLACE FUNCTION public.assign_initial_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get the first user from profiles
  SELECT id INTO first_user_id
  FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1;

  -- If user exists and doesn't have admin role yet, assign it
  IF first_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = first_user_id AND role = 'admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (first_user_id, 'admin');
    
    RAISE NOTICE 'Admin role assigned to user: %', first_user_id;
  END IF;
END;
$$;

-- Call the function to assign admin to first user
SELECT public.assign_initial_admin();

-- ============================================================================
-- PART 6: Helper Function to Assign Roles
-- ============================================================================

-- Function that admins can call to assign roles to users
CREATE OR REPLACE FUNCTION public.assign_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;

  -- Insert role (ignore if already exists due to UNIQUE constraint)
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (_user_id, _role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to remove a role from a user
CREATE OR REPLACE FUNCTION public.remove_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;

  -- Don't allow removing last admin
  IF _role = 'admin' AND (
    SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'
  ) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last admin';
  END IF;

  -- Remove role
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = _role;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if first user has admin role
-- SELECT ur.user_id, ur.role, p.full_name
-- FROM public.user_roles ur
-- JOIN public.profiles p ON p.id = ur.user_id
-- WHERE ur.role = 'admin';

-- Test role checking functions
-- SELECT public.has_role(auth.uid(), 'admin');
-- SELECT public.is_admin(auth.uid());
-- SELECT * FROM public.get_user_roles(auth.uid());

-- ============================================================================
-- USAGE EXAMPLES FOR FUTURE
-- ============================================================================

-- Example: Restrict a table to admins only
-- CREATE POLICY "Only admins can manage system_configuration"
-- ON public.system_configuration
-- FOR ALL
-- TO authenticated
-- USING (public.is_admin(auth.uid()))
-- WITH CHECK (public.is_admin(auth.uid()));

-- Example: Assign receptionist role to a user (as admin)
-- SELECT public.assign_role('user-uuid-here', 'receptionist');

-- Example: Check if user has specific role in application code
-- const { data } = await supabase.rpc('has_role', { 
--   _user_id: user.id, 
--   _role: 'admin' 
-- });