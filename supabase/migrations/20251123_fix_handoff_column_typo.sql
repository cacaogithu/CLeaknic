-- Fix handoff column typo: sync handoff_start_at ↔ handoff_started_at
-- Both columns exist due to naming inconsistency in the codebase
-- This trigger keeps them synchronized until codebase is fully migrated

-- ============================================
-- Create sync trigger function
-- ============================================

CREATE OR REPLACE FUNCTION sync_handoff_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If handoff_started_at was updated, sync to handoff_start_at
  IF TG_OP = 'UPDATE' THEN
    IF NEW.handoff_started_at IS DISTINCT FROM OLD.handoff_started_at THEN
      NEW.handoff_start_at := NEW.handoff_started_at;
    ELSIF NEW.handoff_start_at IS DISTINCT FROM OLD.handoff_start_at THEN
      NEW.handoff_started_at := NEW.handoff_start_at;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- On insert, sync whichever is set
    IF NEW.handoff_started_at IS NOT NULL AND NEW.handoff_start_at IS NULL THEN
      NEW.handoff_start_at := NEW.handoff_started_at;
    ELSIF NEW.handoff_start_at IS NOT NULL AND NEW.handoff_started_at IS NULL THEN
      NEW.handoff_started_at := NEW.handoff_start_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- Create trigger on conversas table
-- ============================================

DROP TRIGGER IF EXISTS trg_sync_handoff_columns ON conversas;

CREATE TRIGGER trg_sync_handoff_columns
  BEFORE INSERT OR UPDATE ON conversas
  FOR EACH ROW
  EXECUTE FUNCTION sync_handoff_columns();

-- ============================================
-- Sync existing data
-- ============================================

-- First, sync handoff_started_at → handoff_start_at where only handoff_started_at has value
UPDATE conversas
SET handoff_start_at = handoff_started_at
WHERE handoff_started_at IS NOT NULL
  AND handoff_start_at IS NULL;

-- Then, sync handoff_start_at → handoff_started_at where only handoff_start_at has value
UPDATE conversas
SET handoff_started_at = handoff_start_at
WHERE handoff_start_at IS NOT NULL
  AND handoff_started_at IS NULL;

-- ============================================
-- Add comment for documentation
-- ============================================

COMMENT ON FUNCTION sync_handoff_columns() IS
'Keeps handoff_start_at and handoff_started_at columns in sync due to naming inconsistency.
Both columns should be deprecated in favor of a single canonical name in future migration.';
