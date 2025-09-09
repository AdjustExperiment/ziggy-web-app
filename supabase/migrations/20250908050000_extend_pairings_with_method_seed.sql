ALTER TABLE pairings
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS seed jsonb;
