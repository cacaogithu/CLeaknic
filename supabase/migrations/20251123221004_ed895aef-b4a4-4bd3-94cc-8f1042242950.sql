-- Create acquire_buffer_lock function for safe concurrent buffer processing
-- This ensures only one process can work on a buffer at a time
CREATE OR REPLACE FUNCTION public.acquire_buffer_lock(
  p_phone VARCHAR,
  p_request_id TEXT,
  p_force_mode BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  success BOOLEAN,
  conversa_id INTEGER,
  buffer_data JSONB,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversa_id INTEGER;
  v_locked_by TEXT;
  v_locked_at TIMESTAMP WITH TIME ZONE;
  v_buffer_record RECORD;
  v_retry_count INTEGER;
BEGIN
  -- Get current buffer state
  SELECT * INTO v_buffer_record
  FROM message_buffer
  WHERE phone = p_phone;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::JSONB, 'Buffer not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already locked
  IF v_buffer_record.processing = TRUE AND p_force_mode = FALSE THEN
    -- Check if lock is stale (older than 5 minutes)
    IF v_buffer_record.locked_at < NOW() - INTERVAL '5 minutes' THEN
      -- Lock is stale, we can take it over
      RAISE NOTICE 'Stale lock detected for %, taking over', p_phone;
    ELSE
      RETURN QUERY SELECT 
        FALSE, 
        NULL::INTEGER, 
        NULL::JSONB, 
        'Buffer is currently locked by another process'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Get or create conversation
  SELECT id INTO v_conversa_id
  FROM conversas
  WHERE phone = p_phone
  ORDER BY last_message_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    INSERT INTO conversas (phone, status, last_message_at)
    VALUES (p_phone, 'ativa', NOW())
    RETURNING id INTO v_conversa_id;
  END IF;
  
  -- Acquire lock atomically
  UPDATE message_buffer
  SET 
    processing = TRUE,
    locked_by = p_request_id,
    locked_at = NOW(),
    retry_count = COALESCE(retry_count, 0) + 1,
    last_retry_at = NOW()
  WHERE phone = p_phone
    AND (processing = FALSE OR p_force_mode = TRUE OR locked_at < NOW() - INTERVAL '5 minutes')
  RETURNING * INTO v_buffer_record;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      NULL::INTEGER, 
      NULL::JSONB, 
      'Failed to acquire lock - buffer state changed'::TEXT;
    RETURN;
  END IF;
  
  -- Return success with buffer data
  RETURN QUERY SELECT 
    TRUE,
    v_conversa_id,
    jsonb_build_object(
      'phone', v_buffer_record.phone,
      'last_message_at', v_buffer_record.last_message_at,
      'buffer_expires_at', v_buffer_record.buffer_expires_at,
      'retry_count', v_buffer_record.retry_count,
      'locked_by', v_buffer_record.locked_by,
      'locked_at', v_buffer_record.locked_at
    ),
    NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::JSONB, SQLERRM;
END;
$$;