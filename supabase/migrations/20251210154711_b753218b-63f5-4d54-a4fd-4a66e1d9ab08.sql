-- Fix RLS recursion on team_memberships table
-- Create a security definer function to check team captain/coach status

CREATE OR REPLACE FUNCTION public.is_team_captain_or_coach(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
      AND role IN ('captain', 'coach')
  );
$$;

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Team captains/coaches can manage memberships" ON public.team_memberships;

-- Recreate the policy using the security definer function
CREATE POLICY "Team captains/coaches can manage memberships"
ON public.team_memberships
FOR ALL
USING (public.is_team_captain_or_coach(team_id))
WITH CHECK (public.is_team_captain_or_coach(team_id));