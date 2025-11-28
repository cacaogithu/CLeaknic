-- Add payment fields to clientes table
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR,
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Create index for payment status searches
CREATE INDEX IF NOT EXISTS idx_clientes_payment_status ON clientes(payment_status);

-- Add helpful comments
COMMENT ON COLUMN clientes.payment_status IS 'Status do pagamento: pending, paid, partial, overdue, cancelled';
COMMENT ON COLUMN clientes.payment_amount IS 'Valor total pago pelo cliente';
COMMENT ON COLUMN clientes.payment_date IS 'Data do último pagamento';
COMMENT ON COLUMN clientes.payment_method IS 'Método de pagamento: pix, credit_card, debit_card, cash, bank_transfer';
COMMENT ON COLUMN clientes.payment_notes IS 'Observações sobre o pagamento';