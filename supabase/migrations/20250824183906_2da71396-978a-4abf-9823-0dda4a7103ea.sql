
-- 1) Judges: add numerical years of experience (keep experience_level for backward compatibility)
ALTER TABLE public.judge_profiles
ADD COLUMN IF NOT EXISTS experience_years integer NOT NULL DEFAULT 0;

-- 2) Tournaments and ballots: supported tags for alignment with judge specializations
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS supported_tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.ballot_templates
ADD COLUMN IF NOT EXISTS supported_tags text[] NOT NULL DEFAULT '{}';

-- 3) Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  -- discount_type: 'percent' | 'fixed' (validated in app/edge function)
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  max_redemptions integer,
  per_user_limit integer NOT NULL DEFAULT 1,
  allowed_user_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_emails text[] NOT NULL DEFAULT '{}',
  valid_from timestamptz,
  valid_to timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins manage all promo codes
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Keep codes non-public; select/validate via service role in an edge function
-- Update updated_at on change
DROP TRIGGER IF EXISTS trg_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER trg_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3b) Promo redemptions tracking
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  amount_discounted numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Admins can view all redemptions
CREATE POLICY "Admins can view all promo redemptions"
ON public.promo_redemptions
FOR SELECT
USING (public.is_admin());

-- Users can view their own promo redemptions
CREATE POLICY "Users can view their own promo redemptions"
ON public.promo_redemptions
FOR SELECT
USING (user_id = auth.uid());

-- Only admins can insert/update/delete (validations are done server-side via service role)
CREATE POLICY "Admins can modify promo redemptions"
ON public.promo_redemptions
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4) Staff revenue shares per tournament
CREATE TABLE IF NOT EXISTS public.tournament_staff_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  percentage numeric NOT NULL DEFAULT 0, -- 0-100 (validated in app)
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, admin_user_id)
);

ALTER TABLE public.tournament_staff_shares ENABLE ROW LEVEL SECURITY;

-- Admins manage all shares
CREATE POLICY "Admins can manage staff shares"
ON public.tournament_staff_shares
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow an admin to view their own shares
CREATE POLICY "Admins can view their own shares"
ON public.tournament_staff_shares
FOR SELECT
USING (admin_user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_staff_shares_updated_at ON public.tournament_staff_shares;
CREATE TRIGGER trg_staff_shares_updated_at
BEFORE UPDATE ON public.tournament_staff_shares
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Observers — limit user to be observer for only one tournament at a time
CREATE TABLE IF NOT EXISTS public.tournament_observers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)  -- user can only be an observer in one tournament at a time
);

ALTER TABLE public.tournament_observers ENABLE ROW LEVEL SECURITY;

-- Admins manage all observers
CREATE POLICY "Admins can manage observers"
ON public.tournament_observers
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view their own observer record
CREATE POLICY "Users can view their observer record"
ON public.tournament_observers
FOR SELECT
USING (user_id = auth.uid());
