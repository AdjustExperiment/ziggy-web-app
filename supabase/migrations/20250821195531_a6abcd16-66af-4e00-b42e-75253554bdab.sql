-- Fix security issue: Remove public read access to tournament_registrations
-- and ensure only authenticated users can view their own registrations

-- First, drop the existing policies that may be allowing public access
DROP POLICY IF EXISTS "Anyone can create registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Users can view only their own registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.tournament_registrations;

-- Create secure RLS policies
-- Allow authenticated users to create registrations (link them to their user_id)
CREATE POLICY "Authenticated users can create registrations"
ON public.tournament_registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view only their own registrations
CREATE POLICY "Users can view own registrations"
ON public.tournament_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own registrations
CREATE POLICY "Users can update own registrations"
ON public.tournament_registrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage all registrations
CREATE POLICY "Admins can manage all registrations"
ON public.tournament_registrations
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Update the user_id column to not be nullable for future registrations
-- Note: This won't affect existing NULL records but ensures new ones have user_id
ALTER TABLE public.tournament_registrations 
ALTER COLUMN user_id SET NOT NULL;