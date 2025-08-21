-- Fix the security definer view issue
-- Replace the view with a regular view (not security definer)

DROP VIEW IF EXISTS public.judge_profiles_public;

-- Create a regular view (not security definer) for safe judge profile access
CREATE VIEW public.judge_profiles_public AS
SELECT 
  id,
  name,
  experience_level,
  specializations,
  bio,
  qualifications,
  created_at
FROM public.judge_profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.judge_profiles_public TO authenticated;