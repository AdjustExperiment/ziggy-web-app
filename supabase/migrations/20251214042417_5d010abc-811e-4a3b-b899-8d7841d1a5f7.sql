-- Add judge volunteering settings to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS allow_judge_volunteering BOOLEAN DEFAULT false;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS auto_approve_judge_volunteers BOOLEAN DEFAULT false;

-- Update pairing_judge_assignments to support volunteer status
ALTER TABLE pairing_judge_assignments 
  DROP CONSTRAINT IF EXISTS pairing_judge_assignments_status_check;

-- Allow additional status values for volunteering flow
UPDATE pairing_judge_assignments SET status = 'assigned' WHERE status NOT IN ('assigned', 'confirmed', 'declined', 'volunteered', 'pending_approval');

ALTER TABLE pairing_judge_assignments 
  ADD CONSTRAINT pairing_judge_assignments_status_check 
  CHECK (status IN ('assigned', 'confirmed', 'declined', 'volunteered', 'pending_approval'));