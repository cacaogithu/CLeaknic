-- Create safe_buffer_upsert function for atomic message buffer management
-- This prevents race conditions and ensures processing state is respected
CREATE OR REPLACE FUNCTION public.safe_buffer_upsert(
  p_phone VARCHAR,
  p_buffer_time_seconds INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  action TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buffer_expires_at TIMESTAMP WITH TIME ZONE;
  v_is_processing BOOLEAN;
  v_action TEXT;
BEGIN
  v_buffer_expires_at := NOW() + (p_buffer_time_seconds || ' seconds')::INTERVAL;
  
  -- Check if buffer exists and is currently processing
  SELECT processing INTO v_is_processing
  FROM message_buffer
  WHERE phone = p_phone;
  
  IF v_is_processing = TRUE THEN
    -- Don't overwrite if currently processing
    RETURN QUERY SELECT FALSE, 'skipped'::TEXT, 'Buffer is currently being processed'::TEXT;
    RETURN;
  END IF;
  
  -- Perform atomic upsert
  INSERT INTO message_buffer (
    phone,
    last_message_at,
    buffer_expires_at,
    processing,
    retry_count
  ) VALUES (
    p_phone,
    NOW(),
    v_buffer_expires_at,
    FALSE,
    0
  )
  ON CONFLICT (phone) DO UPDATE SET
    last_message_at = NOW(),
    buffer_expires_at = v_buffer_expires_at,
    retry_count = CASE 
      WHEN message_buffer.processing = TRUE THEN message_buffer.retry_count
      ELSE 0
    END
  WHERE message_buffer.processing IS DISTINCT FROM TRUE;
  
  -- Check if update happened
  IF FOUND THEN
    v_action := CASE 
      WHEN v_is_processing IS NULL THEN 'created'
      ELSE 'updated'
    END;
    RETURN QUERY SELECT TRUE, v_action, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT FALSE, 'no_change'::TEXT, 'Buffer state unchanged'::TEXT;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, 'error'::TEXT, SQLERRM;
END;
$$;