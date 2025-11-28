-- Increase max_tokens from 500 to 2000 for better AI responses
UPDATE system_configuration 
SET max_tokens = 2000, 
    updated_at = NOW() 
WHERE id = 1;