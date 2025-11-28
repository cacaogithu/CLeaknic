-- Allow INSERT on mensagens table only for test phone number
CREATE POLICY "Allow insert for test phone"
ON public.mensagens
FOR INSERT
TO public
WITH CHECK (phone = '5511999999999');