
BEGIN;

-- 1) Tournament tabulation settings
CREATE TABLE IF NOT EXISTS public.tournament_tabulation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  pairing_method text NOT NULL DEFAULT 'high_high',
  avoid_rematches boolean NOT NULL DEFAULT true,
  club_protect boolean NOT NULL DEFAULT true,
  preserve_break_rounds boolean NOT NULL DEFAULT true,
  prevent_bracket_breaks boolean NOT NULL DEFAULT true,
  max_repeat_opponents integer NOT NULL DEFAULT 1,
  side_balance_target integer NOT NULL DEFAULT 0,
  speaker_points_method text NOT NULL DEFAULT 'sum',
  allow_judges_view_all_chat boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id)
);

ALTER TABLE public.tournament_tabulation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tab settings"
  ON public.tournament_tabulation_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER set_updated_at_tts
BEFORE UPDATE ON public.tournament_tabulation_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2) Judge volunteer requests
CREATE TABLE IF NOT EXISTS public.judge_volunteer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id uuid NOT NULL REFERENCES public.pairings(id) ON DELETE CASCADE,
  judge_profile_id uuid NOT NULL REFERENCES public.judge_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pairing_id, judge_profile_id)
);

ALTER TABLE public.judge_volunteer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage judge volunteer requests"
  ON public.judge_volunteer_requests
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Judges can create own volunteer requests"
  ON public.judge_volunteer_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.judge_profiles jp
      WHERE jp.id = judge_volunteer_requests.judge_profile_id
        AND jp.user_id = auth.uid()
    )
  );

CREATE POLICY "Judges can view own volunteer requests"
  ON public.judge_volunteer_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.judge_profiles jp
      WHERE jp.id = judge_volunteer_requests.judge_profile_id
        AND jp.user_id = auth.uid()
    )
  );

CREATE POLICY "Judges can update own volunteer requests"
  ON public.judge_volunteer_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.judge_profiles jp
      WHERE jp.id = judge_volunteer_requests.judge_profile_id
        AND jp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.judge_profiles jp
      WHERE jp.id = judge_volunteer_requests.judge_profile_id
        AND jp.user_id = auth.uid()
    )
  );

CREATE TRIGGER set_updated_at_jvr
BEFORE UPDATE ON public.judge_volunteer_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3) Expand pairing_messages access for judges
-- Allow assigned judges to read messages (and optionally all if allowed by settings)
CREATE POLICY IF NOT EXISTS "Judges can view messages for their assigned pairings"
  ON public.pairing_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.pairing_judge_assignments a
      JOIN public.judge_profiles jp ON jp.id = a.judge_profile_id
      WHERE a.pairing_id = pairing_messages.pairing_id
        AND a.status IN ('assigned','confirmed')
        AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.pairings p
      JOIN public.judge_profiles jp ON jp.id = p.judge_id
      WHERE p.id = pairing_messages.pairing_id
        AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.pairings p
      JOIN public.judge_availability ja ON ja.tournament_id = p.tournament_id
      JOIN public.judge_profiles jp ON jp.id = ja.judge_profile_id
      JOIN public.tournament_tabulation_settings tts ON tts.tournament_id = p.tournament_id
      WHERE p.id = pairing_messages.pairing_id
        AND jp.user_id = auth.uid()
        AND tts.allow_judges_view_all_chat = true
    )
  );

-- Allow assigned judges to send messages (write remains restricted to assigned judges)
CREATE POLICY IF NOT EXISTS "Judges can send messages for their assigned pairings"
  ON public.pairing_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pairing_judge_assignments a
      JOIN public.judge_profiles jp ON jp.id = a.judge_profile_id
      WHERE a.pairing_id = pairing_messages.pairing_id
        AND a.status IN ('assigned','confirmed')
        AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.pairings p
      JOIN public.judge_profiles jp ON jp.id = p.judge_id
      WHERE p.id = pairing_messages.pairing_id
        AND jp.user_id = auth.uid()
    )
  );

COMMIT;
