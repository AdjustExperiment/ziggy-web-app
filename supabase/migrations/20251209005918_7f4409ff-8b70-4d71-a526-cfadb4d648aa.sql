-- Phase 1: Database Schema Enhancements for Advanced Tabulation

-- Add side tracking columns to tournament_registrations
ALTER TABLE public.tournament_registrations
ADD COLUMN IF NOT EXISTS aff_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS neg_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS seed integer,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add enhanced pairing columns
ALTER TABLE public.pairings
ADD COLUMN IF NOT EXISTS bracket numeric,
ADD COLUMN IF NOT EXISTS room_rank integer,
ADD COLUMN IF NOT EXISTS flags text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS side_locked boolean NOT NULL DEFAULT false;

-- Create adjudicator_conflicts table for conflict tracking
CREATE TABLE IF NOT EXISTS public.adjudicator_conflicts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_profile_id uuid NOT NULL REFERENCES public.judge_profiles(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  institution text,
  conflict_type text NOT NULL DEFAULT 'hard' CHECK (conflict_type IN ('hard', 'soft', 'institutional')),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create break_categories table
CREATE TABLE IF NOT EXISTS public.break_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  break_size integer NOT NULL DEFAULT 8,
  is_general boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  rule text NOT NULL DEFAULT 'standard',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, slug)
);

-- Create team_break_eligibility table
CREATE TABLE IF NOT EXISTS public.team_break_eligibility (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id uuid NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  break_category_id uuid NOT NULL REFERENCES public.break_categories(id) ON DELETE CASCADE,
  is_eligible boolean NOT NULL DEFAULT true,
  break_rank integer,
  remark text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(registration_id, break_category_id)
);

-- Add enhanced tabulation settings columns
ALTER TABLE public.tournament_tabulation_settings
ADD COLUMN IF NOT EXISTS draw_method text NOT NULL DEFAULT 'power_paired' CHECK (draw_method IN ('random', 'power_paired', 'round_robin', 'manual')),
ADD COLUMN IF NOT EXISTS side_method text NOT NULL DEFAULT 'balance' CHECK (side_method IN ('balance', 'preallocated', 'random')),
ADD COLUMN IF NOT EXISTS odd_bracket text NOT NULL DEFAULT 'pullup_top' CHECK (odd_bracket IN ('pullup_top', 'pullup_bottom', 'intermediate', 'intermediate_bubble_up_down')),
ADD COLUMN IF NOT EXISTS pullup_restriction text NOT NULL DEFAULT 'least_to_date',
ADD COLUMN IF NOT EXISTS history_penalty integer NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS institution_penalty integer NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS side_penalty integer NOT NULL DEFAULT 100;

-- Enable RLS on new tables
ALTER TABLE public.adjudicator_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_break_eligibility ENABLE ROW LEVEL SECURITY;

-- RLS policies for adjudicator_conflicts
CREATE POLICY "Admins can manage adjudicator conflicts"
ON public.adjudicator_conflicts FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Judges can view their own conflicts"
ON public.adjudicator_conflicts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM judge_profiles jp
  WHERE jp.id = adjudicator_conflicts.judge_profile_id
  AND jp.user_id = auth.uid()
));

-- RLS policies for break_categories
CREATE POLICY "Admins can manage break categories"
ON public.break_categories FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can view break categories"
ON public.break_categories FOR SELECT
USING (true);

-- RLS policies for team_break_eligibility
CREATE POLICY "Admins can manage break eligibility"
ON public.team_break_eligibility FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own break eligibility"
ON public.team_break_eligibility FOR SELECT
USING (EXISTS (
  SELECT 1 FROM tournament_registrations tr
  WHERE tr.id = team_break_eligibility.registration_id
  AND tr.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_adjudicator_conflicts_judge ON public.adjudicator_conflicts(judge_profile_id);
CREATE INDEX IF NOT EXISTS idx_adjudicator_conflicts_tournament ON public.adjudicator_conflicts(tournament_id);
CREATE INDEX IF NOT EXISTS idx_break_categories_tournament ON public.break_categories(tournament_id);
CREATE INDEX IF NOT EXISTS idx_team_break_eligibility_registration ON public.team_break_eligibility(registration_id);
CREATE INDEX IF NOT EXISTS idx_team_break_eligibility_category ON public.team_break_eligibility(break_category_id);
CREATE INDEX IF NOT EXISTS idx_pairings_bracket ON public.pairings(bracket);
CREATE INDEX IF NOT EXISTS idx_registrations_side_counts ON public.tournament_registrations(aff_count, neg_count);