-- Add unique constraint to prevent duplicate event registrations
-- This allows the same user to register for different events in the same tournament
-- but prevents duplicate registrations for the same event
ALTER TABLE tournament_registrations 
ADD CONSTRAINT unique_user_event_registration 
UNIQUE (tournament_id, user_id, event_id);

-- Add index for better query performance when filtering by event
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON tournament_registrations(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rounds_event_id ON rounds(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pairings_event_id ON pairings(event_id) WHERE event_id IS NOT NULL;