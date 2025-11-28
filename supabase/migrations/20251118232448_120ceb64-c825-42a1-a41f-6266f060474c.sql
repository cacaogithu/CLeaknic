-- Add second test number to system configuration
UPDATE system_configuration 
SET test_numbers = ARRAY['551187662764', '14078859150']
WHERE id = 1;