-- Phase 5A: Create missing tables for constraints and features

-- Team vs Team conflicts (for same-institution, personal)
CREATE TABLE IF NOT EXISTS team_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team1_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL DEFAULT 'institutional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, team1_id, team2_id)
);

-- Judge vs Team conflicts  
CREATE TABLE IF NOT EXISTS judge_team_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  judge_profile_id UUID NOT NULL REFERENCES judge_profiles(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL DEFAULT 'personal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, judge_profile_id, registration_id)
);

-- Judge vs Institution conflicts
CREATE TABLE IF NOT EXISTS judge_school_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  judge_profile_id UUID NOT NULL REFERENCES judge_profiles(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  conflict_type TEXT NOT NULL DEFAULT 'institutional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, judge_profile_id, school_name)
);

-- Tournament standings cache
CREATE TABLE IF NOT EXISTS tournament_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  speaks_total NUMERIC NOT NULL DEFAULT 0,
  speaks_avg NUMERIC NOT NULL DEFAULT 0,
  opp_strength NUMERIC NOT NULL DEFAULT 0,
  rank INT,
  is_breaking BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, registration_id)
);

-- Elimination bracket seeds
CREATE TABLE IF NOT EXISTS elimination_seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  break_category_id UUID REFERENCES break_categories(id) ON DELETE SET NULL,
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  seed INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, break_category_id, seed)
);

-- Add new columns to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS auto_judge_assignment BOOLEAN DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS judges_per_room INT DEFAULT 1;

-- Add column to break_categories for institution cap
ALTER TABLE break_categories ADD COLUMN IF NOT EXISTS institution_cap INT DEFAULT 3;

-- Enable RLS on new tables
ALTER TABLE team_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_team_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_school_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE elimination_seeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_conflicts
CREATE POLICY "Admins can manage team conflicts" ON team_conflicts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view team conflicts for their tournaments" ON team_conflicts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournament_registrations tr
      WHERE tr.tournament_id = team_conflicts.tournament_id
      AND tr.user_id = auth.uid()
    )
  );

-- RLS Policies for judge_team_conflicts
CREATE POLICY "Admins can manage judge team conflicts" ON judge_team_conflicts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Judges can view their own team conflicts" ON judge_team_conflicts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.id = judge_team_conflicts.judge_profile_id
      AND jp.user_id = auth.uid()
    )
  );

-- RLS Policies for judge_school_conflicts
CREATE POLICY "Admins can manage judge school conflicts" ON judge_school_conflicts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Judges can view their own school conflicts" ON judge_school_conflicts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.id = judge_school_conflicts.judge_profile_id
      AND jp.user_id = auth.uid()
    )
  );

-- RLS Policies for tournament_standings
CREATE POLICY "Admins can manage tournament standings" ON tournament_standings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can view tournament standings" ON tournament_standings
  FOR SELECT USING (true);

-- RLS Policies for elimination_seeds
CREATE POLICY "Admins can manage elimination seeds" ON elimination_seeds
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can view elimination seeds" ON elimination_seeds
  FOR SELECT USING (true);

-- Function to recalculate tournament standings
CREATE OR REPLACE FUNCTION recalc_tournament_standings(p_tournament_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INT := 0;
BEGIN
  -- Delete existing standings for this tournament
  DELETE FROM public.tournament_standings WHERE tournament_id = p_tournament_id;
  
  -- Insert calculated standings from pairings
  INSERT INTO public.tournament_standings (tournament_id, registration_id, wins, losses, speaks_total, speaks_avg, opp_strength, updated_at)
  SELECT 
    p_tournament_id,
    reg.id,
    COALESCE(wins.count, 0),
    COALESCE(losses.count, 0),
    COALESCE(speaks.total, 0),
    CASE WHEN COALESCE(speaks.rounds, 0) > 0 THEN COALESCE(speaks.total, 0) / speaks.rounds ELSE 0 END,
    COALESCE(opp.strength, 0),
    now()
  FROM public.tournament_registrations reg
  LEFT JOIN (
    -- Count wins
    SELECT 
      CASE WHEN p.result->>'winner' = 'aff' THEN p.aff_registration_id ELSE p.neg_registration_id END as reg_id,
      COUNT(*) as count
    FROM public.pairings p
    WHERE p.tournament_id = p_tournament_id AND p.result IS NOT NULL AND p.result->>'winner' IS NOT NULL
    GROUP BY 1
  ) wins ON wins.reg_id = reg.id
  LEFT JOIN (
    -- Count losses
    SELECT 
      CASE WHEN p.result->>'winner' = 'aff' THEN p.neg_registration_id ELSE p.aff_registration_id END as reg_id,
      COUNT(*) as count
    FROM public.pairings p
    WHERE p.tournament_id = p_tournament_id AND p.result IS NOT NULL AND p.result->>'winner' IS NOT NULL
    GROUP BY 1
  ) losses ON losses.reg_id = reg.id
  LEFT JOIN (
    -- Sum speaker points
    SELECT 
      reg_id,
      SUM(speaks) as total,
      COUNT(*) as rounds
    FROM (
      SELECT p.aff_registration_id as reg_id, COALESCE((p.result->>'aff_speaks')::numeric, 0) as speaks
      FROM public.pairings p WHERE p.tournament_id = p_tournament_id AND p.result IS NOT NULL
      UNION ALL
      SELECT p.neg_registration_id as reg_id, COALESCE((p.result->>'neg_speaks')::numeric, 0) as speaks
      FROM public.pairings p WHERE p.tournament_id = p_tournament_id AND p.result IS NOT NULL
    ) s
    GROUP BY reg_id
  ) speaks ON speaks.reg_id = reg.id
  LEFT JOIN (
    -- Calculate opponent strength (sum of opponent wins)
    SELECT 
      reg_id,
      SUM(opp_wins) as strength
    FROM (
      SELECT 
        p.aff_registration_id as reg_id,
        (SELECT COUNT(*) FROM public.pairings p2 
         WHERE p2.tournament_id = p_tournament_id 
         AND p2.result->>'winner' IS NOT NULL
         AND ((p2.result->>'winner' = 'aff' AND p2.aff_registration_id = p.neg_registration_id)
           OR (p2.result->>'winner' = 'neg' AND p2.neg_registration_id = p.neg_registration_id))) as opp_wins
      FROM public.pairings p WHERE p.tournament_id = p_tournament_id
      UNION ALL
      SELECT 
        p.neg_registration_id as reg_id,
        (SELECT COUNT(*) FROM public.pairings p2 
         WHERE p2.tournament_id = p_tournament_id 
         AND p2.result->>'winner' IS NOT NULL
         AND ((p2.result->>'winner' = 'aff' AND p2.aff_registration_id = p.aff_registration_id)
           OR (p2.result->>'winner' = 'neg' AND p2.neg_registration_id = p.aff_registration_id))) as opp_wins
      FROM public.pairings p WHERE p.tournament_id = p_tournament_id
    ) o
    GROUP BY reg_id
  ) opp ON opp.reg_id = reg.id
  WHERE reg.tournament_id = p_tournament_id AND reg.is_active = true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Update ranks
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY wins DESC, speaks_total DESC, opp_strength DESC) as new_rank
    FROM public.tournament_standings
    WHERE tournament_id = p_tournament_id
  )
  UPDATE public.tournament_standings ts
  SET rank = ranked.new_rank
  FROM ranked
  WHERE ts.id = ranked.id;
  
  RETURN updated_count;
END;
$$;