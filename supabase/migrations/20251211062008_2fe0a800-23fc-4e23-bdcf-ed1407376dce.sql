-- Allow public to view registrations for results display
CREATE POLICY "Anyone can view registrations for public results"
ON tournament_registrations
FOR SELECT
TO public
USING (true);