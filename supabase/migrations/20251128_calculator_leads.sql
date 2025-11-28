-- Calculator Leads Table
-- Stores leads generated from the revenue leak calculator

CREATE TABLE IF NOT EXISTS public.calculator_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    monthly_leads INTEGER NOT NULL,
    avg_response_time TEXT NOT NULL,
    no_show_rate NUMERIC(5, 2) NOT NULL,
    avg_ticket NUMERIC(10, 2) NOT NULL,
    open_budgets INTEGER NOT NULL,
    calculated_loss NUMERIC(12, 2) NOT NULL,
    recoverable_potential NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calculator_leads_email ON public.calculator_leads(contact_email);
CREATE INDEX IF NOT EXISTS idx_calculator_leads_status ON public.calculator_leads(status);
CREATE INDEX IF NOT EXISTS idx_calculator_leads_created_at ON public.calculator_leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.calculator_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins/owners can view calculator leads
CREATE POLICY "Admins can view calculator leads" ON public.calculator_leads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.user_id = auth.uid()
            AND tenant_users.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Admins can update calculator leads" ON public.calculator_leads
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.user_id = auth.uid()
            AND tenant_users.role IN ('owner', 'admin')
        )
    );

-- Allow service role to insert (for the edge function)
CREATE POLICY "Service role can insert calculator leads" ON public.calculator_leads
    FOR INSERT
    WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_calculator_leads_updated_at
    BEFORE UPDATE ON public.calculator_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, UPDATE ON public.calculator_leads TO authenticated;
GRANT INSERT ON public.calculator_leads TO service_role;

-- Comments
COMMENT ON TABLE public.calculator_leads IS 'Stores leads generated from the WhatsApp Revenue Leak Calculator';
COMMENT ON COLUMN public.calculator_leads.calculated_loss IS 'Total monthly revenue loss calculated';
COMMENT ON COLUMN public.calculator_leads.recoverable_potential IS 'Estimated recoverable revenue (35% of loss)';
