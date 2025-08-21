-- Remove any public read access to tournament_registrations
-- Ensure only admins and registrants can view registration data

-- Drop all existing SELECT policies to start clean
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.tournament_registrations;

-- Recreate secure policies
-- Only admins can view all registrations
CREATE POLICY "Admins can view all registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (is_admin());

-- Users can only view their own registrations (must be authenticated and own the record)
CREATE POLICY "Users can view their own registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());