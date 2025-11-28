-- Create table for doctor unavailability/blocked time slots
CREATE TABLE doctor_unavailability (
  id BIGSERIAL PRIMARY KEY,
  doctor_id BIGINT REFERENCES doctors(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end is after start
  CONSTRAINT valid_time_range CHECK (end_datetime > start_datetime)
);

-- Enable RLS
ALTER TABLE doctor_unavailability ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read unavailability
CREATE POLICY "Authenticated users can read unavailability"
  ON doctor_unavailability
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert unavailability
CREATE POLICY "Authenticated users can insert unavailability"
  ON doctor_unavailability
  FOR INSERT
  WITH CHECK (true);

-- Policy: Authenticated users can update unavailability
CREATE POLICY "Authenticated users can update unavailability"
  ON doctor_unavailability
  FOR UPDATE
  USING (true);

-- Policy: Authenticated users can delete unavailability
CREATE POLICY "Authenticated users can delete unavailability"
  ON doctor_unavailability
  FOR DELETE
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access to unavailability"
  ON doctor_unavailability
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_doctor_unavailability_updated_at
  BEFORE UPDATE ON doctor_unavailability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_doctor_unavailability_doctor_id ON doctor_unavailability(doctor_id);
CREATE INDEX idx_doctor_unavailability_datetime ON doctor_unavailability(start_datetime, end_datetime);

COMMENT ON TABLE doctor_unavailability IS 'Stores blocked time slots when doctors are unavailable';
COMMENT ON COLUMN doctor_unavailability.doctor_id IS 'Doctor ID (NULL means clinic-wide unavailability)';
COMMENT ON COLUMN doctor_unavailability.reason IS 'Reason for unavailability (vacation, personal, etc)';
