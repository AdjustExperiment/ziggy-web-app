-- Migration: Tabulation Enhancement
-- Description: Adds comprehensive tabulation data model for customizable debate formats,
--              speaker statistics, round results, computed standings, and audit logging.
-- Task: Task 1 - Data Model Enhancement

-- ============================================================================
-- 1. DEBATE FORMATS TABLE
-- ============================================================================
-- Stores configuration for different debate formats (LD, TP, Parli, etc.)
CREATE TABLE IF NOT EXISTS public.debate_formats_tab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'LD', 'TP', 'Parli', 'PF', 'BP', etc.
  speaker_count INTEGER NOT NULL DEFAULT 2,
  speaker_point_min DECIMAL(5,2) DEFAULT 20,
  speaker_point_max DECIMAL(5,2) DEFAULT 30,
  rank_scale INTEGER DEFAULT 4, -- 1-4 ranking scale
  uses_teams BOOLEAN DEFAULT true,
  default_tiebreakers JSONB, -- ordered list of tiebreaker types
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.debate_formats_tab IS 'Debate format configurations for tabulation';
COMMENT ON COLUMN public.debate_formats_tab.name IS 'Human-readable format name';
COMMENT ON COLUMN public.debate_formats_tab.speaker_count IS 'Number of speakers per side';
COMMENT ON COLUMN public.debate_formats_tab.speaker_point_min IS 'Minimum speaker points allowed';
COMMENT ON COLUMN public.debate_formats_tab.speaker_point_max IS 'Maximum speaker points allowed';
COMMENT ON COLUMN public.debate_formats_tab.rank_scale IS 'Max rank value (e.g., 4 for 1-4 scale)';
COMMENT ON COLUMN public.debate_formats_tab.uses_teams IS 'Whether format uses team pairings';
COMMENT ON COLUMN public.debate_formats_tab.default_tiebreakers IS 'Default tiebreaker order for this format';

-- ============================================================================
-- 2. TOURNAMENT TAB CONFIG TABLE
-- ============================================================================
-- Tournament-specific tabulation configuration (overrides format defaults)
CREATE TABLE IF NOT EXISTS public.tournament_tab_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  debate_format_id UUID REFERENCES public.debate_formats_tab(id),
  speaker_point_min DECIMAL(5,2),
  speaker_point_max DECIMAL(5,2),
  rank_scale INTEGER,
  tiebreaker_order JSONB NOT NULL DEFAULT '["wins", "speaks", "ranks", "adjusted_speaks", "adjusted_ranks", "opp_wins", "head_to_head", "coin_flip"]',
  drop_high_low_speaks INTEGER DEFAULT 0, -- number to drop
  drop_high_low_ranks INTEGER DEFAULT 0,
  prelim_rounds INTEGER,
  break_to INTEGER, -- number of teams breaking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, event_id)
);

COMMENT ON TABLE public.tournament_tab_config IS 'Tournament-specific tabulation settings';
COMMENT ON COLUMN public.tournament_tab_config.tiebreaker_order IS 'Ordered array of tiebreaker types';
COMMENT ON COLUMN public.tournament_tab_config.drop_high_low_speaks IS 'Number of high/low speaks to drop';
COMMENT ON COLUMN public.tournament_tab_config.drop_high_low_ranks IS 'Number of high/low ranks to drop';
COMMENT ON COLUMN public.tournament_tab_config.prelim_rounds IS 'Total preliminary rounds';
COMMENT ON COLUMN public.tournament_tab_config.break_to IS 'Number of teams that break to elims';

-- ============================================================================
-- 3. SPEAKER RESULTS TABLE
-- ============================================================================
-- Individual speaker statistics per speaker per round
CREATE TABLE IF NOT EXISTS public.speaker_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID REFERENCES public.pairings(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  speaker_position INTEGER NOT NULL, -- 1 = first speaker, 2 = second speaker, etc.
  speaker_name TEXT,
  speaker_points DECIMAL(5,2),
  speaker_rank INTEGER,
  side TEXT CHECK (side IN ('aff', 'neg')),
  is_reply_speaker BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pairing_id, registration_id, speaker_position)
);

COMMENT ON TABLE public.speaker_results IS 'Individual speaker statistics per round';
COMMENT ON COLUMN public.speaker_results.speaker_position IS 'Speaker order (1=first, 2=second, etc.)';
COMMENT ON COLUMN public.speaker_results.speaker_name IS 'Speaker name (denormalized for display)';
COMMENT ON COLUMN public.speaker_results.is_reply_speaker IS 'Whether this was a reply/rebuttal speech';

-- ============================================================================
-- 4. ROUND RESULTS TABLE
-- ============================================================================
-- Round-by-round team results (denormalized for fast queries)
CREATE TABLE IF NOT EXISTS public.round_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id),
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  pairing_id UUID REFERENCES public.pairings(id) ON DELETE CASCADE,
  opponent_registration_id UUID REFERENCES public.tournament_registrations(id),
  side TEXT CHECK (side IN ('aff', 'neg')),
  result TEXT CHECK (result IN ('win', 'loss', 'bye', 'forfeit_win', 'forfeit_loss')),
  total_speaks DECIMAL(6,2),
  total_ranks INTEGER,
  ballot_count INTEGER DEFAULT 1,
  round_number INTEGER NOT NULL,
  is_elim BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, registration_id)
);

COMMENT ON TABLE public.round_results IS 'Denormalized round-by-round results for fast queries';
COMMENT ON COLUMN public.round_results.result IS 'Round outcome: win, loss, bye, forfeit_win, forfeit_loss';
COMMENT ON COLUMN public.round_results.total_speaks IS 'Combined speaker points for the round';
COMMENT ON COLUMN public.round_results.ballot_count IS 'Number of ballots in this round';
COMMENT ON COLUMN public.round_results.is_elim IS 'Whether this is an elimination round';

-- ============================================================================
-- 5. COMPUTED STANDINGS TABLE
-- ============================================================================
-- Computed standings with all tiebreaker fields
CREATE TABLE IF NOT EXISTS public.computed_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id),
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  -- Basic record
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  byes INTEGER DEFAULT 0,
  forfeits_given INTEGER DEFAULT 0,
  forfeits_received INTEGER DEFAULT 0,
  -- Speaks
  total_speaks DECIMAL(8,2) DEFAULT 0,
  avg_speaks DECIMAL(5,2) DEFAULT 0,
  adjusted_speaks DECIMAL(8,2) DEFAULT 0, -- after dropping high/low
  double_adjusted_speaks DECIMAL(8,2) DEFAULT 0,
  -- Ranks
  total_ranks INTEGER DEFAULT 0,
  avg_ranks DECIMAL(4,2) DEFAULT 0,
  adjusted_ranks DECIMAL(6,2) DEFAULT 0,
  double_adjusted_ranks DECIMAL(6,2) DEFAULT 0,
  -- Opponent strength
  opp_wins INTEGER DEFAULT 0,
  opp_win_pct DECIMAL(4,3) DEFAULT 0,
  -- Side balance
  aff_rounds INTEGER DEFAULT 0,
  neg_rounds INTEGER DEFAULT 0,
  -- Computed rank
  prelim_rank INTEGER,
  overall_rank INTEGER,
  is_breaking BOOLEAN DEFAULT false,
  break_seed INTEGER,
  -- Metadata
  rounds_completed INTEGER DEFAULT 0,
  last_computed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, event_id, registration_id)
);

COMMENT ON TABLE public.computed_standings IS 'Precomputed standings with all tiebreaker metrics';
COMMENT ON COLUMN public.computed_standings.adjusted_speaks IS 'Speaks after dropping high/low';
COMMENT ON COLUMN public.computed_standings.double_adjusted_speaks IS 'Speaks after dropping two high/low';
COMMENT ON COLUMN public.computed_standings.opp_win_pct IS 'Opponent win percentage (strength of schedule)';
COMMENT ON COLUMN public.computed_standings.prelim_rank IS 'Rank after preliminary rounds';
COMMENT ON COLUMN public.computed_standings.break_seed IS 'Seed for elimination bracket';

-- ============================================================================
-- 6. HEAD TO HEAD TABLE
-- ============================================================================
-- Head-to-head records for tiebreaker
CREATE TABLE IF NOT EXISTS public.head_to_head (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id),
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_speaks_for DECIMAL(6,2) DEFAULT 0,
  total_speaks_against DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, event_id, registration_id, opponent_id)
);

COMMENT ON TABLE public.head_to_head IS 'Head-to-head records between competitors';
COMMENT ON COLUMN public.head_to_head.total_speaks_for IS 'Speaker points earned against this opponent';
COMMENT ON COLUMN public.head_to_head.total_speaks_against IS 'Speaker points conceded to this opponent';

-- ============================================================================
-- 7. TAB AUDIT LOG TABLE
-- ============================================================================
-- Audit log for tabulation changes
CREATE TABLE IF NOT EXISTS public.tab_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'score_override', 'forfeit', 'dq', 'manual_rank', etc.
  entity_type TEXT NOT NULL, -- 'pairing', 'registration', 'round_result', etc.
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tab_audit_log IS 'Audit trail for tabulation changes';
COMMENT ON COLUMN public.tab_audit_log.action IS 'Type of action: score_override, forfeit, dq, manual_rank, etc.';
COMMENT ON COLUMN public.tab_audit_log.entity_type IS 'Entity affected: pairing, registration, round_result, etc.';
COMMENT ON COLUMN public.tab_audit_log.reason IS 'Human-readable reason for the change';

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_debate_formats_tab_name ON public.debate_formats_tab(name);
CREATE INDEX IF NOT EXISTS idx_speaker_results_pairing ON public.speaker_results(pairing_id);
CREATE INDEX IF NOT EXISTS idx_speaker_results_registration ON public.speaker_results(registration_id);
CREATE INDEX IF NOT EXISTS idx_round_results_tournament ON public.round_results(tournament_id, event_id);
CREATE INDEX IF NOT EXISTS idx_round_results_registration ON public.round_results(registration_id);
CREATE INDEX IF NOT EXISTS idx_round_results_round ON public.round_results(round_id);
CREATE INDEX IF NOT EXISTS idx_computed_standings_tournament ON public.computed_standings(tournament_id, event_id);
CREATE INDEX IF NOT EXISTS idx_computed_standings_rank ON public.computed_standings(tournament_id, prelim_rank);
CREATE INDEX IF NOT EXISTS idx_computed_standings_registration ON public.computed_standings(registration_id);
CREATE INDEX IF NOT EXISTS idx_head_to_head_lookup ON public.head_to_head(tournament_id, registration_id, opponent_id);
CREATE INDEX IF NOT EXISTS idx_head_to_head_opponent ON public.head_to_head(opponent_id);
CREATE INDEX IF NOT EXISTS idx_tab_audit_tournament ON public.tab_audit_log(tournament_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tab_audit_entity ON public.tab_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tournament_tab_config_tournament ON public.tournament_tab_config(tournament_id);

-- ============================================================================
-- 9. SEED DEBATE FORMATS
-- ============================================================================
INSERT INTO public.debate_formats_tab (name, speaker_count, speaker_point_min, speaker_point_max, rank_scale, uses_teams, default_tiebreakers) VALUES
('Lincoln-Douglas', 1, 20, 30, 4, false, '["wins", "speaks", "opp_wins", "head_to_head"]'),
('Team Policy', 2, 20, 30, 4, true, '["wins", "speaks", "ranks", "adjusted_speaks", "opp_wins"]'),
('Parliamentary', 2, 20, 30, 4, true, '["wins", "speaks", "ranks", "opp_wins"]'),
('Public Forum', 2, 20, 30, 4, true, '["wins", "speaks", "opp_wins", "head_to_head"]'),
('British Parliamentary', 4, 50, 100, 4, true, '["wins", "speaks", "ranks"]'),
('NCFCA LD', 1, 20, 30, 4, false, '["wins", "speaks", "ranks", "adjusted_speaks", "adjusted_ranks", "opp_wins"]'),
('NCFCA TP', 2, 20, 30, 4, true, '["wins", "speaks", "ranks", "adjusted_speaks", "adjusted_ranks", "opp_wins"]')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.debate_formats_tab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_tab_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computed_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.head_to_head ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_audit_log ENABLE ROW LEVEL SECURITY;

-- debate_formats_tab: Read-only for all authenticated users, admins can manage
CREATE POLICY "debate_formats_tab_select" ON public.debate_formats_tab
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "debate_formats_tab_admin_insert" ON public.debate_formats_tab
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "debate_formats_tab_admin_update" ON public.debate_formats_tab
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "debate_formats_tab_admin_delete" ON public.debate_formats_tab
  FOR DELETE TO authenticated USING (public.is_admin());

-- tournament_tab_config: Tournament admins can manage, participants can read
CREATE POLICY "tournament_tab_config_select" ON public.tournament_tab_config
  FOR SELECT TO authenticated
  USING (
    public.can_admin_tournament(tournament_id)
    OR EXISTS (
      SELECT 1 FROM public.tournament_registrations tr
      WHERE tr.tournament_id = tournament_tab_config.tournament_id
      AND tr.user_id = auth.uid()
    )
  );

CREATE POLICY "tournament_tab_config_admin_insert" ON public.tournament_tab_config
  FOR INSERT TO authenticated
  WITH CHECK (public.can_admin_tournament(tournament_id));

CREATE POLICY "tournament_tab_config_admin_update" ON public.tournament_tab_config
  FOR UPDATE TO authenticated
  USING (public.can_admin_tournament(tournament_id));

CREATE POLICY "tournament_tab_config_admin_delete" ON public.tournament_tab_config
  FOR DELETE TO authenticated
  USING (public.can_admin_tournament(tournament_id));

-- speaker_results: Tournament admins can manage, participants can view their own
CREATE POLICY "speaker_results_select" ON public.speaker_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairings p
      JOIN public.tournaments t ON t.id = p.tournament_id
      WHERE p.id = speaker_results.pairing_id
      AND (
        public.can_admin_tournament(t.id)
        OR speaker_results.registration_id IN (
          SELECT id FROM public.tournament_registrations WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "speaker_results_admin_insert" ON public.speaker_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pairings p
      WHERE p.id = speaker_results.pairing_id
      AND public.can_admin_tournament(p.tournament_id)
    )
  );

CREATE POLICY "speaker_results_admin_update" ON public.speaker_results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairings p
      WHERE p.id = speaker_results.pairing_id
      AND public.can_admin_tournament(p.tournament_id)
    )
  );

CREATE POLICY "speaker_results_admin_delete" ON public.speaker_results
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairings p
      WHERE p.id = speaker_results.pairing_id
      AND public.can_admin_tournament(p.tournament_id)
    )
  );

-- round_results: Tournament admins can manage, participants can view (based on ballot reveal settings)
CREATE POLICY "round_results_select" ON public.round_results
  FOR SELECT TO authenticated
  USING (
    public.can_admin_tournament(tournament_id)
    OR registration_id IN (
      SELECT id FROM public.tournament_registrations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "round_results_admin_insert" ON public.round_results
  FOR INSERT TO authenticated
  WITH CHECK (public.can_admin_tournament(tournament_id));

CREATE POLICY "round_results_admin_update" ON public.round_results
  FOR UPDATE TO authenticated
  USING (public.can_admin_tournament(tournament_id));

CREATE POLICY "round_results_admin_delete" ON public.round_results
  FOR DELETE TO authenticated
  USING (public.can_admin_tournament(tournament_id));

-- computed_standings: Tournament admins can manage, all participants can view standings
CREATE POLICY "computed_standings_select" ON public.computed_standings
  FOR SELECT TO authenticated
  USING (
    public.can_admin_tournament(tournament_id)
    OR EXISTS (
      SELECT 1 FROM public.tournament_registrations tr
      WHERE tr.tournament_id = computed_standings.tournament_id
      AND tr.user_id = auth.uid()
    )
  );

CREATE POLICY "computed_standings_admin_insert" ON public.computed_standings
  FOR INSERT TO authenticated
  WITH CHECK (public.can_admin_tournament(tournament_id));

CREATE POLICY "computed_standings_admin_update" ON public.computed_standings
  FOR UPDATE TO authenticated
  USING (public.can_admin_tournament(tournament_id));

CREATE POLICY "computed_standings_admin_delete" ON public.computed_standings
  FOR DELETE TO authenticated
  USING (public.can_admin_tournament(tournament_id));

-- head_to_head: Tournament admins can manage, participants can view their own
CREATE POLICY "head_to_head_select" ON public.head_to_head
  FOR SELECT TO authenticated
  USING (
    public.can_admin_tournament(tournament_id)
    OR registration_id IN (
      SELECT id FROM public.tournament_registrations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "head_to_head_admin_insert" ON public.head_to_head
  FOR INSERT TO authenticated
  WITH CHECK (public.can_admin_tournament(tournament_id));

CREATE POLICY "head_to_head_admin_update" ON public.head_to_head
  FOR UPDATE TO authenticated
  USING (public.can_admin_tournament(tournament_id));

CREATE POLICY "head_to_head_admin_delete" ON public.head_to_head
  FOR DELETE TO authenticated
  USING (public.can_admin_tournament(tournament_id));

-- tab_audit_log: Only tournament admins can view/manage
CREATE POLICY "tab_audit_log_admin_select" ON public.tab_audit_log
  FOR SELECT TO authenticated
  USING (public.can_admin_tournament(tournament_id));

CREATE POLICY "tab_audit_log_admin_insert" ON public.tab_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.can_admin_tournament(tournament_id));

-- ============================================================================
-- 11. GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON public.debate_formats_tab TO authenticated;
GRANT ALL ON public.debate_formats_tab TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_tab_config TO authenticated;
GRANT ALL ON public.tournament_tab_config TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaker_results TO authenticated;
GRANT ALL ON public.speaker_results TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.round_results TO authenticated;
GRANT ALL ON public.round_results TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.computed_standings TO authenticated;
GRANT ALL ON public.computed_standings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.head_to_head TO authenticated;
GRANT ALL ON public.head_to_head TO service_role;

GRANT SELECT, INSERT ON public.tab_audit_log TO authenticated;
GRANT ALL ON public.tab_audit_log TO service_role;
