-- Fix security vulnerability in tournament_registrations RLS policy
-- Remove the ability for users to view registrations with NULL user_id
-- This prevents unauthorized access to anonymous registration data

DROP POLICY IF EXISTS "Users can view their own registrations" ON public.tournament_registrations;

CREATE POLICY "Users can view their own registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (user_id = auth.uid());