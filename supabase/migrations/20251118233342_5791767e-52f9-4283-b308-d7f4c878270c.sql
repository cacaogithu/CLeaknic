-- Remove 14078859150 from test_numbers (it's an allowed number, not a test number)
UPDATE system_configuration 
SET test_numbers = ARRAY['5511999999999', '5511888888888']
WHERE id = 1;