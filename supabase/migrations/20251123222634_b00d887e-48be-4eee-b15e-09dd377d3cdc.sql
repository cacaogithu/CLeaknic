-- Fix complete_buffer_processing function logic
-- The function should succeed if buffer was deleted, even if no messages were marked
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
  
  -- Success if buffer was deleted OR messages were marked
  -- FOUND is automatically set after DELETE
  IF FOUND THEN
    -- Buffer was successfully deleted
    RETURN QUERY SELECT TRUE, v_marked_count, NULL::TEXT;
  ELSIF v_marked_count > 0 THEN
    -- Messages were marked but buffer wasn't found - possibly already deleted by another process
    -- This is OK - the messages were processed successfully
    RETURN QUERY SELECT TRUE, v_marked_count, 'Buffer already deleted'::TEXT;
  ELSE
    -- Neither buffer deleted nor messages marked - this is an error
    RETURN QUERY SELECT FALSE, 0, 'Buffer not found or lock not owned'::TEXT;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, 0, SQLERRM;
END;
$$;