-- Add calendar customization fields to tournaments table
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS round_schedule_type TEXT DEFAULT 'custom';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS round_interval_days INTEGER DEFAULT 7;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS round_count INTEGER DEFAULT 1;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS rounds_config JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS auto_schedule_rounds BOOLEAN DEFAULT false;

-- Add comments to explain the new fields
COMMENT ON COLUMN public.tournaments.round_schedule_type IS 'Type of round scheduling: custom, weekly, daily, monthly';
COMMENT ON COLUMN public.tournaments.round_interval_days IS 'Number of days between rounds';
COMMENT ON COLUMN public.tournaments.round_count IS 'Total number of rounds in the tournament';
COMMENT ON COLUMN public.tournaments.rounds_config IS 'JSON array containing detailed round configurations';
COMMENT ON COLUMN public.tournaments.auto_schedule_rounds IS 'Whether rounds should be automatically scheduled based on interval';