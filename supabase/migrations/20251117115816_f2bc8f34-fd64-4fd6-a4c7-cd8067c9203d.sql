-- Add google_event_id column to appointments table to track Google Calendar events
ALTER TABLE appointments 
ADD COLUMN google_event_id TEXT;

-- Add index for efficient lookups by google_event_id
CREATE INDEX idx_appointments_google_event_id 
ON appointments(google_event_id);

-- Add index for efficient lookups of confirmed appointments by phone
CREATE INDEX idx_appointments_phone_status_date 
ON appointments(phone, status, appointment_date) 
WHERE status = 'confirmada';

-- Add comment to document the purpose of the column
COMMENT ON COLUMN appointments.google_event_id IS 
'ID do evento no Google Calendar retornado pelo n8n. Usado para cancelar/atualizar o evento.';