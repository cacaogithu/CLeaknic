-- Step 1: Delete duplicate appointments, keeping only the first one of each group
DELETE FROM appointments a
WHERE a.id NOT IN (
  SELECT MIN(id)
  FROM appointments
  GROUP BY phone, appointment_date, appointment_time, doctor_id
);

-- Step 2: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_appointment_constraint 
ON appointments(phone, appointment_date, appointment_time, doctor_id);

-- Step 3: Update clientes with correct appointment counts and dates
UPDATE clientes c
SET 
  total_appointments = (
    SELECT COUNT(*)
    FROM appointments a
    WHERE a.phone = c.phone
  ),
  last_appointment_date = (
    SELECT MAX(a.appointment_date)
    FROM appointments a
    WHERE a.phone = c.phone
  )
WHERE c.phone IN (
  '14072677301',
  '5521992420891',
  '5511987662764',
  '16562042569',
  '14078859150',
  '14079897162',
  '14079897160'
);