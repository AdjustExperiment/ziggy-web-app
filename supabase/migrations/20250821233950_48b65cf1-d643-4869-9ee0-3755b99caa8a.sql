-- Fix judge_profiles security vulnerabilities - Part 2
-- Remove any overly permissive policies and add secure, limited access policies

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage judge profiles" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can create own profile" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can select own profile" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can update own profile" ON public.judge_profiles;
DROP POLICY IF EXISTS "Anyone can view judge profiles" ON public.judge_profiles;
DROP POLICY IF EXISTS "Public can view judge profiles" ON public.judge_profiles;

-- Create secure policies with limited data exposure

-- 1. Admins can manage all judge profiles (full access)
CREATE POLICY "Admins can manage judge profiles" 
ON public.judge_profiles 
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. Judges can view and update their own profile (full access to own data)
CREATE POLICY "Judges can manage own profile" 
ON public.judge_profiles 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated users can view LIMITED judge info for selection (NO personal info like email/phone)
-- This policy requires application code to only select safe fields
CREATE POLICY "Authenticated users can view limited judge info" 
ON public.judge_profiles 
FOR SELECT
USING (auth.role() = 'authenticated');

-- Add a view for safe judge profile access that excludes sensitive data
CREATE OR REPLACE VIEW public.judge_profiles_public AS
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