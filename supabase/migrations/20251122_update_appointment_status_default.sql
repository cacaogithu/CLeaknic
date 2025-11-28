-- Change default status for appointments table
ALTER TABLE appointments 
ALTER COLUMN status SET DEFAULT 'pendente_confirmacao';
