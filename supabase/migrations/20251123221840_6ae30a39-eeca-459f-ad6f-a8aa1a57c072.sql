-- Create function to release buffer lock
CREATE OR REPLACE FUNCTION public.release_buffer_lock(
  p_phone VARCHAR,
  p_request_id TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buffer_record RECORD;
BEGIN
  -- Get current buffer state
  SELECT * INTO v_buffer_record
  FROM message_buffer
  WHERE phone = p_phone;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Buffer not found'::TEXT;
    RETURN;
  END IF;
  
  -- Release lock
  UPDATE message_buffer
  SET 
    processing = FALSE,
    locked_by = NULL,
    locked_at = NULL,
    buffer_expires_at = NOW() + INTERVAL '30 seconds' -- Set retry delay
  WHERE phone = p_phone
    AND locked_by = p_request_id; -- Only release if we own the lock
  
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT FALSE, 'Lock not owned by this request'::TEXT;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;

-- Create function to complete buffer processing
CREATE OR REPLACE FUNCTION public.complete_buffer_processing(
  p_phone VARCHAR,
  p_request_id TEXT,
  p_message_ids BIGINT[]
)
RETURNS TABLE(
  success BOOLEAN,
  messages_marked INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_marked_count INTEGER := 0;
BEGIN
  -- Mark messages as processed
  IF array_length(p_message_ids, 1) > 0 THEN
    UPDATE mensagens
    SET processed = TRUE
    WHERE id = ANY(p_message_ids)
      AND phone = p_phone
      AND processed = FALSE;
    
    GET DIAGNOSTICS v_marked_count = ROW_COUNT;
  END IF;
  
  -- Delete buffer atomically (only if we own the lock)
  DELETE FROM message_buffer
  WHERE phone = p_phone
    AND locked_by = p_request_id;
  
  IF FOUND OR v_marked_count > 0 THEN
    RETURN QUERY SELECT TRUE, v_marked_count, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT FALSE, 0, 'Buffer not found or lock not owned'::TEXT;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, 0, SQLERRM;
END;
$$;