-- Fix potential security definer view issue by recreating the view
-- The linter might be flagging the existing view, so let's recreate it properly

-- Drop and recreate the judge_profiles_public view
DROP VIEW IF EXISTS public.judge_profiles_public;

-- Create the view without any security definer properties
-- This is a simple view that should not have any security definer behavior
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

-- Ensure proper permissions
GRANT SELECT ON public.judge_profiles_public TO authenticated;
GRANT SELECT ON public.judge_profiles_public TO anon;