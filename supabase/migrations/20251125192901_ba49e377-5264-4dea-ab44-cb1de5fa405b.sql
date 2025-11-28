-- Add is_existing_patient field to clientes table
ALTER TABLE clientes 
ADD COLUMN is_existing_patient BOOLEAN DEFAULT false;

-- Create index for CPF lookups
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL;

-- Update existing clients with appointments to be marked as existing patients
UPDATE clientes 
SET is_existing_patient = true 
WHERE total_appointments > 0;