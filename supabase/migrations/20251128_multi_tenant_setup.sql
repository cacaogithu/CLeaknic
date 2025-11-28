-- Multi-Tenant Setup Migration
-- This migration adds tenant support to the existing schema

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subdomain TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#6366f1',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    plan_type TEXT DEFAULT 'standard' CHECK (plan_type IN ('founder_1_3', 'founder_4_10', 'standard', 'enterprise', 'custom')),
    monthly_fee NUMERIC(10, 2) DEFAULT 3500.00,
    setup_fee NUMERIC(10, 2) DEFAULT 3000.00,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenant_users junction table
CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Add tenant_id to existing tables
-- Note: We'll add these columns as nullable first, then populate them

-- Contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Budgets table
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Recalls table
ALTER TABLE public.recalls 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Followups table
ALTER TABLE public.followups 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Handoffs table
ALTER TABLE public.handoffs 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create indexes for tenant_id on all tables
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON public.messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_tenant_id ON public.budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recalls_tenant_id ON public.recalls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_followups_tenant_id ON public.followups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_tenant_id ON public.handoffs(tenant_id);

-- Create index for tenant slug lookup
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);

-- Create index for tenant_users lookup
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table
-- Super admins can see all tenants
CREATE POLICY "Super admins can view all tenants" ON public.tenants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.user_id = auth.uid()
            AND tenant_users.role = 'owner'
        )
    );

-- Users can see their own tenants
CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

-- Only owners can insert tenants
CREATE POLICY "Owners can insert tenants" ON public.tenants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.user_id = auth.uid()
            AND tenant_users.role = 'owner'
        )
    );

-- Only owners can update their tenants
CREATE POLICY "Owners can update their tenants" ON public.tenants
    FOR UPDATE
    USING (
        id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for tenant_users table
CREATE POLICY "Users can view their tenant memberships" ON public.tenant_users
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Owners can manage tenant users" ON public.tenant_users
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Update RLS policies for existing tables to include tenant isolation
-- Contacts
DROP POLICY IF EXISTS "Users can view contacts" ON public.contacts;
CREATE POLICY "Users can view their tenant contacts" ON public.contacts
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert contacts" ON public.contacts;
CREATE POLICY "Users can insert their tenant contacts" ON public.contacts
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
CREATE POLICY "Users can update their tenant contacts" ON public.contacts
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

-- Conversations
DROP POLICY IF EXISTS "Users can view conversations" ON public.conversations;
CREATE POLICY "Users can view their tenant conversations" ON public.conversations
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert their tenant conversations" ON public.conversations
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

-- Messages
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view their tenant messages" ON public.messages
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert their tenant messages" ON public.messages
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

-- Appointments
DROP POLICY IF EXISTS "Users can view appointments" ON public.appointments;
CREATE POLICY "Users can view their tenant appointments" ON public.appointments
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert appointments" ON public.appointments;
CREATE POLICY "Users can insert their tenant appointments" ON public.appointments
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update appointments" ON public.appointments;
CREATE POLICY "Users can update their tenant appointments" ON public.appointments
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid()
        )
    );

-- Function to get current user's tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.tenant_users
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to create a new tenant with owner
CREATE OR REPLACE FUNCTION public.create_tenant(
    p_name TEXT,
    p_slug TEXT,
    p_owner_user_id UUID,
    p_plan_type TEXT DEFAULT 'standard',
    p_monthly_fee NUMERIC DEFAULT 3500.00,
    p_setup_fee NUMERIC DEFAULT 3000.00
)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Insert tenant
    INSERT INTO public.tenants (name, slug, plan_type, monthly_fee, setup_fee)
    VALUES (p_name, p_slug, p_plan_type, p_monthly_fee, p_setup_fee)
    RETURNING id INTO v_tenant_id;
    
    -- Add owner to tenant_users
    INSERT INTO public.tenant_users (tenant_id, user_id, role)
    VALUES (v_tenant_id, p_owner_user_id, 'owner');
    
    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert EvidenS as the first tenant (migration of existing data)
INSERT INTO public.tenants (
    name,
    slug,
    subdomain,
    plan_type,
    monthly_fee,
    setup_fee,
    status
) VALUES (
    'EvidenS Clinic',
    'evidens',
    'evidens',
    'founder_1_3',
    1500.00,
    3000.00,
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.tenants IS 'Stores clinic/tenant information for multi-tenancy';
COMMENT ON TABLE public.tenant_users IS 'Junction table linking users to tenants with roles';
COMMENT ON FUNCTION public.create_tenant IS 'Creates a new tenant and assigns the owner';
COMMENT ON FUNCTION public.get_user_tenant_id IS 'Returns the tenant_id for the current authenticated user';
