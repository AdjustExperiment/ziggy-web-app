-- Fix tournament_registrations security vulnerability
-- Remove all vulnerable SELECT policies and create secure ones

-- First, let's see what policies currently exist and drop them all
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.tournament_registrations;

-- Create secure SELECT policies
-- 1. Admins can view all registrations
CREATE POLICY "Admins can view all registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (is_admin());

-- 2. Users can ONLY view registrations they created (must be authenticated and own the record)
CREATE POLICY "Users can view only their own registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Note: We keep the existing INSERT policy "Anyone can create registrations" 
-- as it's needed for tournament registration functionality
-- But we ensure no public SELECT access exists