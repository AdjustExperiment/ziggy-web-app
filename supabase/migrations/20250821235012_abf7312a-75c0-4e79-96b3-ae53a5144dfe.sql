-- Remove the overly permissive policy that allows authenticated users to view all judge data
DROP POLICY IF EXISTS "Authenticated users can view limited judge info" ON public.judge_profiles;

-- Only allow admins and judges to access their own profiles
-- No general authenticated user access to sensitive judge data

-- The remaining policies are:
-- 1. "Admins can manage judge profiles" - Allows full admin access
-- 2. "Judges can manage own profile" - Allows judges to see/edit their own profile

-- The judge_profiles_public view can still be used by application code 
-- but it will be subject to these RLS policies, so only admins and 
-- the judge themselves can access the underlying data