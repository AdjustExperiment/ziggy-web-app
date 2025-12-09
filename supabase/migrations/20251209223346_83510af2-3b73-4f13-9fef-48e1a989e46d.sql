-- Create security definer function to check if user can view a judge profile
-- This breaks the circular dependency that causes infinite recursion
CREATE OR REPLACE FUNCTION public.user_can_view_judge_for_pairing(_judge_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Admins can view all judge profiles
  SELECT public.is_admin() 
  OR 
  -- User owns this judge profile
  EXISTS (
    SELECT 1 FROM public.judge_profiles jp
    WHERE jp.id = _judge_profile_id AND jp.user_id = auth.uid()
  )
  OR
  -- User is a competitor in a pairing with this judge (via pairings.judge_id)
  EXISTS (
    SELECT 1
    FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.judge_id = _judge_profile_id
      AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
  OR
  -- User is a competitor in a pairing with this judge (via pairing_judge_assignments)
  EXISTS (
    SELECT 1
    FROM public.pairing_judge_assignments pja
    JOIN public.pairings p ON p.id = pja.pairing_id
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE pja.judge_profile_id = _judge_profile_id
      AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  );
$$;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Participants can view assigned judge names" ON public.judge_profiles;

-- Create a new non-recursive policy using the security definer function
CREATE POLICY "Users can view relevant judge profiles"
ON public.judge_profiles
FOR SELECT
USING (public.user_can_view_judge_for_pairing(id));