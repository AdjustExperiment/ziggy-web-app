
-- 1) Extend profiles to capture onboarding fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS time_zone text,
  ADD COLUMN IF NOT EXISTS phone text;

-- 2) Require authentication to create tournament registrations and ensure user_id alignment
DROP POLICY IF EXISTS "Anyone can create registrations" ON public.tournament_registrations;

CREATE POLICY "Authenticated users can create their registrations"
  ON public.tournament_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Helper trigger: default user_id to auth.uid() if not provided
CREATE OR REPLACE FUNCTION public.set_registration_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_registration_user_id ON public.tournament_registrations;

CREATE TRIGGER trg_set_registration_user_id
BEFORE INSERT ON public.tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION public.set_registration_user_id();

-- 3) Admin-only tournament competitor list
CREATE TABLE IF NOT EXISTS public.tournament_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  competitor_type text NOT NULL CHECK (competitor_type IN ('team','individual')),
  participant_names text[] NOT NULL,  -- e.g., ['Alice'] or ['Alice','Bob']
  team_name text,
  status text NOT NULL DEFAULT 'active', -- e.g., 'active','withdrawn'
  seed integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can manage competitors"
  ON public.tournament_competitors
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS trg_tournament_competitors_updated_at ON public.tournament_competitors;

CREATE TRIGGER trg_tournament_competitors_updated_at
BEFORE UPDATE ON public.tournament_competitors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_competitors_tournament_id ON public.tournament_competitors (tournament_id);
CREATE INDEX IF NOT EXISTS idx_competitors_status ON public.tournament_competitors (status);

-- 4) Tournament awards linked to tournaments and competitor list
CREATE TABLE IF NOT EXISTS public.tournament_result_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  competitor_id uuid REFERENCES public.tournament_competitors(id) ON DELETE SET NULL,
  award_type text NOT NULL CHECK (award_type IN ('team','speaker')),
  position integer NOT NULL,
  award_name text,                -- e.g., "Champion", "2nd Place", "Top Speaker", etc.
  competitor_names text[] NOT NULL,  -- denormalized for public viewing without competitor table access
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, award_type, position)
);

ALTER TABLE public.tournament_result_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can manage awards"
  ON public.tournament_result_awards
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY IF NOT EXISTS "Anyone can view published awards"
  ON public.tournament_result_awards
  FOR SELECT
  USING (published = true);

DROP TRIGGER IF EXISTS trg_tournament_result_awards_updated_at ON public.tournament_result_awards;

CREATE TRIGGER trg_tournament_result_awards_updated_at
BEFORE UPDATE ON public.tournament_result_awards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_awards_tournament_id ON public.tournament_result_awards (tournament_id);
CREATE INDEX IF NOT EXISTS idx_awards_tournament_award_type ON public.tournament_result_awards (tournament_id, award_type);
