-- Add is_championship flag to tournaments
ALTER TABLE tournaments 
ADD COLUMN is_championship boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN tournaments.is_championship IS 'Flag to mark tournament as a major championship for featured display on Results page';