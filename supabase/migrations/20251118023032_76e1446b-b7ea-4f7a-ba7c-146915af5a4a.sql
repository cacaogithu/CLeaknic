-- Remove the restrictive test phone policy
DROP POLICY IF EXISTS "Allow insert for test phone" ON mensagens;

-- Allow public insert access to mensagens (needed for human agents and system)
CREATE POLICY "Allow public insert access to mensagens"
ON mensagens
FOR INSERT
TO public
WITH CHECK (true);