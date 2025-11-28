-- Add RLS policies for ai_decision_log
CREATE POLICY "Allow insert from service role on ai_decision_log"
ON public.ai_decision_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add RLS policies for webhook_logs
CREATE POLICY "Allow public read access to webhook_logs"
ON public.webhook_logs
FOR SELECT
USING (true);

CREATE POLICY "Allow insert from service role on webhook_logs"
ON public.webhook_logs
FOR INSERT
TO service_role
WITH CHECK (true);