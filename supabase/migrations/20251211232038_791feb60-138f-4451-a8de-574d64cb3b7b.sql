-- Add results_published column to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS results_published boolean DEFAULT false;

-- Add results_visibility JSONB column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tournaments' 
    AND column_name = 'results_visibility'
  ) THEN
    ALTER TABLE public.tournaments 
    ADD COLUMN results_visibility jsonb DEFAULT '{"prelim_rounds": true, "elim_rounds": true, "break_results": true, "finals": true}'::jsonb;
  END IF;
END $$;