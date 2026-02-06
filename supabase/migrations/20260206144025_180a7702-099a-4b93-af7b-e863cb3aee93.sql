-- Phase 1: Create missing tabulation tables and ballot sync trigger

-- computed_standings: cache for computed standings
CREATE TABLE public.computed_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE SET NULL,
  registration_id UUID NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  byes INTEGER DEFAULT 0,
  forfeits_given INTEGER DEFAULT 0,
  forfeits_received INTEGER DEFAULT 0,
  total_speaks NUMERIC DEFAULT 0,
  avg_speaks NUMERIC DEFAULT 0,
  adjusted_speaks NUMERIC DEFAULT 0,
  double_adjusted_speaks NUMERIC DEFAULT 0,
  total_ranks NUMERIC DEFAULT 0,
  avg_ranks NUMERIC DEFAULT 0,
  adjusted_ranks NUMERIC DEFAULT 0,
  double_adjusted_ranks NUMERIC DEFAULT 0,
  opp_wins INTEGER DEFAULT 0,
  opp_win_pct NUMERIC DEFAULT 0,
  aff_rounds INTEGER DEFAULT 0,
  neg_rounds INTEGER DEFAULT 0,
  prelim_rank INTEGER,
  overall_rank INTEGER,
  is_breaking BOOLEAN DEFAULT false,
  break_seed INTEGER,
  rounds_completed INTEGER DEFAULT 0,
  last_computed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, registration_id)
);

-- head_to_head: records of matchups between teams
CREATE TABLE public.head_to_head (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE SET NULL,
  registration_id UUID NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_speaks_for NUMERIC DEFAULT 0,
  total_speaks_against NUMERIC DEFAULT 0,
  UNIQUE(tournament_id, registration_id, opponent_id)
);

-- tournament_tab_config: per-tournament tabulation settings
CREATE TABLE public.tournament_tab_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE UNIQUE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE SET NULL,
  debate_format_id UUID REFERENCES public.debate_formats(id) ON DELETE SET NULL,
  speaker_point_min NUMERIC DEFAULT 20,
  speaker_point_max NUMERIC DEFAULT 30,
  rank_scale INTEGER DEFAULT 4,
  tiebreaker_order TEXT[] DEFAULT ARRAY['wins','speaks','adjusted_speaks','opp_wins'],
  drop_high_low_speaks INTEGER DEFAULT 1,
  drop_high_low_ranks INTEGER DEFAULT 1,
  prelim_rounds INTEGER,
  break_to INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tab_audit_log: audit trail for tabulation changes
CREATE TABLE public.tab_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.computed_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.head_to_head ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_tab_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for computed_standings
CREATE POLICY "Anyone can view computed standings" 
ON public.computed_standings FOR SELECT USING (true);

CREATE POLICY "Admins can manage computed standings" 
ON public.computed_standings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for head_to_head
CREATE POLICY "Anyone can view head to head records" 
ON public.head_to_head FOR SELECT USING (true);

CREATE POLICY "Admins can manage head to head records" 
ON public.head_to_head FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for tournament_tab_config
CREATE POLICY "Anyone can view tab config" 
ON public.tournament_tab_config FOR SELECT USING (true);

CREATE POLICY "Admins can manage tab config" 
ON public.tournament_tab_config FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for tab_audit_log
CREATE POLICY "Anyone can view audit log" 
ON public.tab_audit_log FOR SELECT USING (true);

CREATE POLICY "Admins can insert audit log entries" 
ON public.tab_audit_log FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Create indexes for performance
CREATE INDEX idx_computed_standings_tournament ON public.computed_standings(tournament_id);
CREATE INDEX idx_computed_standings_registration ON public.computed_standings(registration_id);
CREATE INDEX idx_head_to_head_tournament ON public.head_to_head(tournament_id);
CREATE INDEX idx_head_to_head_registration ON public.head_to_head(registration_id);
CREATE INDEX idx_tab_audit_log_tournament ON public.tab_audit_log(tournament_id);
CREATE INDEX idx_tab_audit_log_entity ON public.tab_audit_log(entity_type, entity_id);

-- Ballot-to-Pairing Sync Trigger
-- This trigger automatically syncs ballot payload to pairings.result when a ballot is submitted
CREATE OR REPLACE FUNCTION public.sync_ballot_to_pairing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when ballot is submitted (not draft)
  IF NEW.status = 'submitted' THEN
    UPDATE public.pairings
    SET result = NEW.payload,
        status = 'completed',
        updated_at = now()
    WHERE id = NEW.pairing_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on ballots table
DROP TRIGGER IF EXISTS on_ballot_submit ON public.ballots;
CREATE TRIGGER on_ballot_submit
AFTER INSERT OR UPDATE ON public.ballots
FOR EACH ROW
EXECUTE FUNCTION public.sync_ballot_to_pairing();

-- Add round_status enum type for consistency
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'round_status') THEN
    CREATE TYPE round_status AS ENUM ('upcoming', 'in_progress', 'completed', 'locked');
  END IF;
END$$;