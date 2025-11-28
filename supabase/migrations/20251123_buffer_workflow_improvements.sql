-- Buffer Workflow Improvements Migration
-- Addresses P0 and P1 critical issues with atomic RPC operations

-- ============================================
-- P0 #1: Race Condition Fix - acquire_buffer_lock RPC
-- Uses FOR UPDATE NOWAIT for atomic lock acquisition
-- ============================================

CREATE OR REPLACE FUNCTION acquire_buffer_lock(
  p_phone VARCHAR,
  p_request_id VARCHAR,
  p_force_mode BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  success BOOLEAN,
  buffer_data JSONB,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buffer RECORD;
  v_lock_timeout_ms INTEGER := 60000; -- Default 60 seconds
  v_now TIMESTAMP := NOW();
BEGIN
  -- Get configurable lock timeout
  SELECT COALESCE(buffer_lock_timeout_ms, 60000) INTO v_lock_timeout_ms
  FROM system_configuration WHERE id = 1;

  -- Try to acquire lock atomically using FOR UPDATE NOWAIT
  BEGIN
    SELECT * INTO v_buffer
    FROM message_buffer
    WHERE phone = p_phone
    FOR UPDATE NOWAIT;

    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, NULL::JSONB, 'Buffer not found for phone'::TEXT;
      RETURN;
    END IF;

    -- Check if buffer is already being processed
    IF v_buffer.processing = TRUE THEN
      -- Check if lock has expired
      IF v_buffer.locked_at IS NOT NULL AND
         EXTRACT(EPOCH FROM (v_now - v_buffer.locked_at)) * 1000 > v_lock_timeout_ms THEN
        -- Lock expired - attempt CAS takeover
        UPDATE message_buffer
        SET
          locked_at = v_now,
          locked_by = p_request_id
        WHERE phone = p_phone
          AND locked_by = v_buffer.locked_by; -- CAS: only if still same owner

        IF NOT FOUND THEN
          RETURN QUERY SELECT FALSE, NULL::JSONB, 'CAS failed - another instance took over'::TEXT;
          RETURN;
        END IF;

        -- Lock takeover successful
        RETURN QUERY SELECT TRUE, row_to_json(v_buffer)::JSONB, NULL::TEXT;
        RETURN;
      ELSE
        -- Lock still valid
        RETURN QUERY SELECT FALSE, NULL::JSONB,
          format('Buffer locked by %s (age: %sms)',
            v_buffer.locked_by,
            EXTRACT(EPOCH FROM (v_now - v_buffer.locked_at)) * 1000
          )::TEXT;
        RETURN;
      END IF;
    END IF;

    -- Buffer not processing - check if expired (unless force mode)
    IF NOT p_force_mode AND v_buffer.buffer_expires_at > v_now THEN
      RETURN QUERY SELECT FALSE, NULL::JSONB, 'Buffer not yet expired'::TEXT;
      RETURN;
    END IF;

    -- Acquire lock
    UPDATE message_buffer
    SET
      processing = TRUE,
      locked_at = v_now,
      locked_by = p_request_id
    WHERE phone = p_phone
      AND processing = FALSE; -- CAS: only if not already processing

    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, NULL::JSONB, 'Race condition - another instance acquired lock'::TEXT;
      RETURN;
    END IF;

    -- Return success with buffer data
    SELECT * INTO v_buffer FROM message_buffer WHERE phone = p_phone;
    RETURN QUERY SELECT TRUE, row_to_json(v_buffer)::JSONB, NULL::TEXT;

  EXCEPTION
    WHEN lock_not_available THEN
      RETURN QUERY SELECT FALSE, NULL::JSONB, 'Buffer locked by another transaction'::TEXT;
  END;
END;
$$;

-- ============================================
-- P0 #2: Message Loss Fix - complete_buffer_processing RPC
-- Wraps message marking + buffer deletion in single transaction
-- ============================================

CREATE OR REPLACE FUNCTION complete_buffer_processing(
  p_phone VARCHAR,
  p_request_id VARCHAR,
  p_message_ids BIGINT[]
)
RETURNS TABLE(
  success BOOLEAN,
  messages_marked INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_messages_count INTEGER := 0;
BEGIN
  -- Verify we hold the lock
  IF NOT EXISTS (
    SELECT 1 FROM message_buffer
    WHERE phone = p_phone AND locked_by = p_request_id
  ) THEN
    RETURN QUERY SELECT FALSE, 0, 'Lock not held by this request'::TEXT;
    RETURN;
  END IF;

  -- Mark messages as processed (atomic within transaction)
  IF p_message_ids IS NOT NULL AND array_length(p_message_ids, 1) > 0 THEN
    UPDATE mensagens
    SET processed = TRUE
    WHERE id = ANY(p_message_ids)
      AND processed = FALSE;

    GET DIAGNOSTICS v_messages_count = ROW_COUNT;
  END IF;

  -- Delete buffer entry (only if we still hold the lock)
  DELETE FROM message_buffer
  WHERE phone = p_phone
    AND locked_by = p_request_id;

  IF NOT FOUND THEN
    -- Buffer was modified by another process - rollback is automatic
    RAISE EXCEPTION 'Buffer lock lost during completion';
  END IF;

  RETURN QUERY SELECT TRUE, v_messages_count, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, SQLERRM::TEXT;
END;
$$;

-- ============================================
-- P1 #5: Buffer Overwrite Fix - safe_buffer_upsert RPC
-- Checks processing=true before updating
-- ============================================

CREATE OR REPLACE FUNCTION safe_buffer_upsert(
  p_phone VARCHAR,
  p_buffer_time_seconds INTEGER DEFAULT 5
)
RETURNS TABLE(
  success BOOLEAN,
  action TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
  v_now TIMESTAMP := NOW();
  v_expires_at TIMESTAMP := v_now + (p_buffer_time_seconds * INTERVAL '1 second');
BEGIN
  -- Check if buffer exists
  SELECT * INTO v_existing
  FROM message_buffer
  WHERE phone = p_phone
  FOR UPDATE; -- Lock row to prevent race conditions

  IF NOT FOUND THEN
    -- Insert new buffer
    INSERT INTO message_buffer (phone, last_message_at, buffer_expires_at, processing, locked_at, locked_by)
    VALUES (p_phone, v_now, v_expires_at, FALSE, NULL, NULL);

    RETURN QUERY SELECT TRUE, 'inserted'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Buffer exists - check if being processed
  IF v_existing.processing = TRUE THEN
    -- Only update last_message_at, don't reset processing or expiry
    -- The current processor will pick up new messages
    UPDATE message_buffer
    SET last_message_at = v_now
    WHERE phone = p_phone;

    RETURN QUERY SELECT TRUE, 'extended_only'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Not processing - safe to fully update
  UPDATE message_buffer
  SET
    last_message_at = v_now,
    buffer_expires_at = v_expires_at,
    processing = FALSE,
    locked_at = NULL,
    locked_by = NULL
  WHERE phone = p_phone;

  RETURN QUERY SELECT TRUE, 'updated'::TEXT, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'error'::TEXT, SQLERRM::TEXT;
END;
$$;

-- ============================================
-- Helper: Release buffer lock on failure
-- ============================================

CREATE OR REPLACE FUNCTION release_buffer_lock(
  p_phone VARCHAR,
  p_request_id VARCHAR,
  p_retry_delay_seconds INTEGER DEFAULT 10
)
RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retry_delay_ms INTEGER := 10000;
BEGIN
  -- Get configurable retry delay
  SELECT COALESCE(buffer_retry_delay_ms, 10000) INTO v_retry_delay_ms
  FROM system_configuration WHERE id = 1;

  -- Release lock and set retry expiry
  UPDATE message_buffer
  SET
    processing = FALSE,
    locked_at = NULL,
    locked_by = NULL,
    buffer_expires_at = NOW() + (v_retry_delay_ms * INTERVAL '1 millisecond'),
    retry_count = COALESCE(retry_count, 0) + 1
  WHERE phone = p_phone
    AND locked_by = p_request_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Lock not held by this request'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- ============================================
-- P2 #7: Add configurable timeout columns to system_configuration
-- ============================================

ALTER TABLE system_configuration
ADD COLUMN IF NOT EXISTS buffer_lock_timeout_ms INTEGER DEFAULT 60000,
ADD COLUMN IF NOT EXISTS stuck_buffer_threshold_ms INTEGER DEFAULT 300000,
ADD COLUMN IF NOT EXISTS eliana_response_timeout_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS eliana_inactivity_timeout_hours INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS client_inactivity_timeout_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS buffer_retry_delay_ms INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS slow_processing_threshold_ms INTEGER DEFAULT 30000;

-- Add comments for documentation
COMMENT ON COLUMN system_configuration.buffer_lock_timeout_ms IS 'Timeout in ms before a buffer lock is considered expired (default: 60000)';
COMMENT ON COLUMN system_configuration.stuck_buffer_threshold_ms IS 'Threshold in ms for considering a buffer as stuck (default: 300000 = 5 minutes)';
COMMENT ON COLUMN system_configuration.eliana_response_timeout_minutes IS 'Minutes to wait for Eliana to respond before reactivating AI (default: 30)';
COMMENT ON COLUMN system_configuration.eliana_inactivity_timeout_hours IS 'Hours of Eliana inactivity before deactivating handoff (default: 2)';
COMMENT ON COLUMN system_configuration.client_inactivity_timeout_hours IS 'Hours of client inactivity before finalizing conversation (default: 24)';
COMMENT ON COLUMN system_configuration.buffer_retry_delay_ms IS 'Delay in ms before retrying failed buffer processing (default: 10000)';
COMMENT ON COLUMN system_configuration.slow_processing_threshold_ms IS 'Threshold in ms for logging slow processing alerts (default: 30000)';

-- ============================================
-- Grant execute permissions to service role
-- ============================================

GRANT EXECUTE ON FUNCTION acquire_buffer_lock TO service_role;
GRANT EXECUTE ON FUNCTION complete_buffer_processing TO service_role;
GRANT EXECUTE ON FUNCTION safe_buffer_upsert TO service_role;
GRANT EXECUTE ON FUNCTION release_buffer_lock TO service_role;
