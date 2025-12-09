-- Add alumni field to judge_profiles
ALTER TABLE public.judge_profiles 
ADD COLUMN IF NOT EXISTS alumni boolean NOT NULL DEFAULT false;

-- Create tournament_judge_registrations table
CREATE TABLE IF NOT EXISTS public.tournament_judge_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  judge_profile_id uuid NOT NULL REFERENCES public.judge_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'withdrawn')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, judge_profile_id)
);

-- Enable RLS
ALTER TABLE public.tournament_judge_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament_judge_registrations
CREATE POLICY "Admins can manage judge registrations" 
ON public.tournament_judge_registrations FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Judges can view own registrations" 
ON public.tournament_judge_registrations FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Judges can create own registrations" 
ON public.tournament_judge_registrations FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Judges can update own registrations" 
ON public.tournament_judge_registrations FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to check for tournament role conflicts
CREATE OR REPLACE FUNCTION public.check_tournament_role_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- For competitor registrations: check if user is already a judge
  IF TG_TABLE_NAME = 'tournament_registrations' THEN
    IF EXISTS (
      SELECT 1 FROM public.tournament_judge_registrations tjr
      WHERE tjr.tournament_id = NEW.tournament_id 
      AND tjr.user_id = NEW.user_id
      AND tjr.status != 'withdrawn'
    ) THEN
      RAISE EXCEPTION 'User is already registered as a judge for this tournament. Cannot register as both judge and competitor in the same tournament.';
    END IF;
  END IF;
  
  -- For judge registrations: check if user is already a competitor
  IF TG_TABLE_NAME = 'tournament_judge_registrations' THEN
    IF EXISTS (
      SELECT 1 FROM public.tournament_registrations tr
      WHERE tr.tournament_id = NEW.tournament_id 
      AND tr.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'User is already registered as a competitor for this tournament. Cannot register as both judge and competitor in the same tournament.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Triggers to enforce role conflict prevention
DROP TRIGGER IF EXISTS check_competitor_not_judge ON public.tournament_registrations;
CREATE TRIGGER check_competitor_not_judge
  BEFORE INSERT ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION public.check_tournament_role_conflict();

DROP TRIGGER IF EXISTS check_judge_not_competitor ON public.tournament_judge_registrations;
CREATE TRIGGER check_judge_not_competitor
  BEFORE INSERT ON public.tournament_judge_registrations
  FOR EACH ROW EXECUTE FUNCTION public.check_tournament_role_conflict();

-- Updated_at trigger for tournament_judge_registrations
CREATE TRIGGER update_tournament_judge_registrations_updated_at
  BEFORE UPDATE ON public.tournament_judge_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();