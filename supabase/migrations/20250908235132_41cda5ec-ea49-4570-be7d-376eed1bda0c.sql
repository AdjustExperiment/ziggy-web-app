-- Add judge profile details
ALTER TABLE public.judge_profiles
  ADD COLUMN IF NOT EXISTS specializations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS qualifications text;

-- Recreate public view to expose new columns
DROP VIEW IF EXISTS public.judge_profiles_public;
CREATE VIEW public.judge_profiles_public AS
SELECT
  id,
  user_id,
  name,
  email,
  phone,
  experience_level,
  specializations,
  availability,
  bio,
  qualifications
FROM public.judge_profiles;

GRANT SELECT ON public.judge_profiles_public TO authenticated;
GRANT SELECT ON public.judge_profiles_public TO anon;
ALTER VIEW public.judge_profiles_public OWNER TO postgres;
ALTER VIEW public.judge_profiles_public ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Admins can manage judge profiles" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can create own profile" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can select own profile" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can update own profile" ON public.judge_profiles;
DROP POLICY IF EXISTS "Public can view judge profiles" ON public.judge_profiles_public;

CREATE POLICY "Admins can manage judge profiles"
ON public.judge_profiles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Judges can create own profile"
ON public.judge_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Judges can select own profile"
ON public.judge_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Judges can update own profile"
ON public.judge_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view judge profiles"
ON public.judge_profiles_public
FOR SELECT
USING (true);

-- RPC for assigning judges to pairings
CREATE OR REPLACE FUNCTION public.assign_judge_to_pairing(p_pairing_id uuid, p_judge_id uuid)
RETURNS public.pairings AS $$
DECLARE
  updated_pairing public.pairings;
BEGIN
  UPDATE public.pairings
    SET judge_id = p_judge_id,
        updated_at = now()
    WHERE id = p_pairing_id
    RETURNING * INTO updated_pairing;
  RETURN updated_pairing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.assign_judge_to_pairing(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.assign_judge_to_pairing(uuid, uuid) TO authenticated;
