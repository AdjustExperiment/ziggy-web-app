-- 1) Tighten ballots UPDATE policy so judges cannot edit after submit
DROP POLICY IF EXISTS "Judges can update own ballots" ON public.ballots;

CREATE POLICY "Judges can update own ballots"
  ON public.ballots
  FOR UPDATE
  USING (
    can_submit_ballot(pairing_id)
    AND judge_user_id = auth.uid()
    AND status <> 'submitted'  -- block updates once submitted
  )
  WITH CHECK (
    can_submit_ballot(pairing_id)
    AND judge_user_id = auth.uid()
  );

-- 2) Admin function to force-submit (lock) ballots by tournament or by round
CREATE OR REPLACE FUNCTION public.admin_lock_ballots(_tournament_id uuid, _round_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can lock ballots';
  END IF;

  UPDATE public.ballots b
  SET status = 'submitted',
      updated_at = now()
  FROM public.pairings p
  WHERE b.pairing_id = p.id
    AND p.tournament_id = _tournament_id
    AND (_round_id IS NULL OR p.round_id = _round_id)
    AND b.status <> 'submitted';

  GET DIAGNOSTICS updated_count = row_count;
  -- ballots_auto_publish_if_needed() trigger will set is_published automatically when mode=auto_on_submit

  RETURN updated_count;
END;
$$;

-- 3) Recompute results from published ballots into public tables used by Results page
--    This provides a clean migration path without exposing ballots via RLS.
CREATE OR REPLACE FUNCTION public.recompute_results_from_ballots()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_tournaments integer;
BEGIN
  -- Identify tournaments with published ballots
  WITH tids AS (
    SELECT DISTINCT p.tournament_id
    FROM public.ballots b
    JOIN public.pairings p ON p.id = b.pairing_id
    WHERE b.is_published = true AND b.status = 'submitted'
  )
  SELECT COUNT(*) INTO affected_tournaments FROM tids;

  -- Rebuild results_recent for affected tournaments
  DELETE FROM public.results_recent
  WHERE tournament_id IN (
    SELECT tournament_id FROM (
      SELECT DISTINCT p.tournament_id
      FROM public.ballots b
      JOIN public.pairings p ON p.id = b.pairing_id
      WHERE b.is_published = true AND b.status = 'submitted'
    ) q
  );

  INSERT INTO public.results_recent (
    tournament_id, tournament, position, format, date, participants, points, prize
  )
  SELECT
    t.id AS tournament_id,
    t.name AS tournament,
    'Win' AS position,
    t.format AS format,
    COALESCE(t.end_date, t.start_date) AS date,
    2 AS participants,
    1 AS points,
    NULL::text AS prize
  FROM public.ballots b
  JOIN public.pairings p ON p.id = b.pairing_id
  JOIN public.tournaments t ON t.id = p.tournament_id
  WHERE b.is_published = true AND b.status = 'submitted'
    AND (b.payload ? 'winner'); -- requires winner in payload: 'aff' | 'neg'

  -- Rebuild top_performers using wins and total matches from published ballots
  DELETE FROM public.top_performers;

  WITH winners AS (
    SELECT
      CASE WHEN b.payload->>'winner' = 'aff' THEN ar.id ELSE nr.id END AS reg_id,
      p.tournament_id AS tid
    FROM public.ballots b
    JOIN public.pairings p ON p.id = b.pairing_id
    JOIN public.tournament_registrations ar ON ar.id = p.aff_registration_id
    JOIN public.tournament_registrations nr ON nr.id = p.neg_registration_id
    WHERE b.is_published = true AND b.status = 'submitted'
      AND (b.payload->>'winner') IN ('aff','neg')
  ),
  matches AS (
    SELECT ar.id AS reg_id, p.tournament_id AS tid
    FROM public.ballots b
    JOIN public.pairings p ON p.id = b.pairing_id
    JOIN public.tournament_registrations ar ON ar.id = p.aff_registration_id
    WHERE b.is_published = true AND b.status = 'submitted'
    UNION ALL
    SELECT nr.id AS reg_id, p.tournament_id AS tid
    FROM public.ballots b
    JOIN public.pairings p ON p.id = b.pairing_id
    JOIN public.tournament_registrations nr ON nr.id = p.neg_registration_id
    WHERE b.is_published = true AND b.status = 'submitted'
  ),
  agg AS (
    SELECT
      r.participant_name AS name,
      COALESCE(r.school_organization, 'Independent') AS school,
      COUNT(*) AS total_matches,
      COUNT(DISTINCT m.tid) AS tournaments,
      COUNT(w.reg_id) AS wins
    FROM matches m
    JOIN public.tournament_registrations r ON r.id = m.reg_id
    LEFT JOIN winners w ON w.reg_id = m.reg_id AND w.tid = m.tid
    GROUP BY r.participant_name, r.school_organization
  )
  INSERT INTO public.top_performers (rank, name, school, points, tournaments, win_rate)
  SELECT
    ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC) AS rank,
    name,
    school,
    wins AS points,
    tournaments,
    CASE WHEN total_matches = 0 THEN 0 ELSE wins::numeric / total_matches END AS win_rate
  FROM agg;

  RETURN affected_tournaments;
END;
$$;

-- 4) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ballots_pairing_id ON public.ballots (pairing_id);
CREATE INDEX IF NOT EXISTS idx_ballots_judge_user_id ON public.ballots (judge_user_id);
CREATE INDEX IF NOT EXISTS idx_pairings_round_id ON public.pairings (round_id);
CREATE INDEX IF NOT EXISTS idx_pairings_tournament_id ON public.pairings (tournament_id);