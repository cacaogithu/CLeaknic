-- Add field to track recently created appointments and prevent duplicates
ALTER TABLE conversas 
ADD COLUMN appointment_recently_created timestamp with time zone;