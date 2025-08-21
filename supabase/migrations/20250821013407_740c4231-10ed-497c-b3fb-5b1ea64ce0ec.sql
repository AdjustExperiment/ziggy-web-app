-- Create tournaments table with comprehensive fields for dynamic management
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL,
  debate_style TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT NOT NULL,
  venue_details TEXT,
  max_participants INTEGER NOT NULL DEFAULT 100,
  current_participants INTEGER NOT NULL DEFAULT 0,
  registration_fee DECIMAL(10,2) DEFAULT 30.00,
  prize_pool TEXT,
  sponsors JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Planning Phase' CHECK (status IN ('Planning Phase', 'Registration Open', 'Registration Closed', 'Ongoing', 'Completed', 'Cancelled')),
  registration_open BOOLEAN DEFAULT false,
  registration_deadline DATE,
  payment_handler TEXT DEFAULT 'paypal',
  paypal_client_id TEXT,
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view tournaments" 
ON public.tournaments 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tournaments" 
ON public.tournaments 
FOR ALL 
USING (is_admin());

-- Create tournament registrations table
CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  school_organization TEXT,
  partner_name TEXT,
  dietary_requirements TEXT,
  emergency_contact TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_id TEXT,
  amount_paid DECIMAL(10,2),
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for registrations
CREATE POLICY "Anyone can create registrations" 
ON public.tournament_registrations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can view all registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can manage all registrations" 
ON public.tournament_registrations 
FOR ALL 
USING (is_admin());

-- Create trigger to update participant count
CREATE OR REPLACE FUNCTION public.update_tournament_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants - 1
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournament_participants_trigger
  AFTER INSERT OR DELETE ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tournament_participants();

-- Create updated_at triggers
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_registrations_updated_at
  BEFORE UPDATE ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample tournaments including 'Ongoing' status
INSERT INTO public.tournaments (name, description, format, debate_style, start_date, end_date, location, venue_details, max_participants, registration_fee, prize_pool, sponsors, status, registration_open, registration_deadline, additional_info) VALUES
(
  'National Debate Championship 2024',
  'The premier national debate competition featuring top debaters from across the country.',
  'Policy Debate',
  'Traditional Policy',
  '2024-03-15',
  '2024-03-17',
  'Harvard University',
  'Harvard Law School, Cambridge, MA',
  128,
  35.00,
  '$50,000',
  '["Harvard Law School", "National Debate Association", "Academic Excellence Foundation"]'::jsonb,
  'Registration Open',
  true,
  '2024-03-10',
  '{"dress_code": "Business formal", "meals_provided": true, "parking_available": true}'::jsonb
),
(
  'Regional Parliamentary Championship',
  'Competitive parliamentary debate featuring teams from the northeastern region.',
  'Parliamentary',
  'British Parliamentary',
  '2024-04-08',
  '2024-04-09',
  'Stanford University',
  'Stanford Memorial Auditorium, Stanford, CA',
  64,
  30.00,
  '$25,000',
  '["Stanford University", "Parliamentary Debate Society"]'::jsonb,
  'Registration Closed',
  false,
  '2024-04-01',
  '{"accommodation_provided": false, "livestream_available": true}'::jsonb
),
(
  'Spring Invitational Tournament',
  'An ongoing tournament featuring high school and collegiate debaters.',
  'Public Forum',
  'Public Forum',
  '2024-02-10',
  '2024-02-15',
  'Yale University',
  'Yale Law School, New Haven, CT',
  96,
  32.00,
  '$15,000',
  '["Yale University", "Connecticut Debate League"]'::jsonb,
  'Ongoing',
  false,
  '2024-02-05',
  '{"judging_pool": "Professional judges", "awards_ceremony": true}'::jsonb
),
(
  'Collegiate World Series',
  'The most prestigious international collegiate debate competition.',
  'British Parliamentary',
  'Worlds Style',
  '2024-06-20',
  '2024-06-23',
  'Oxford University',
  'Oxford Union, Oxford, UK',
  200,
  45.00,
  '$100,000',
  '["Oxford University", "World Universities Debating Council", "International Debate Foundation"]'::jsonb,
  'Planning Phase',
  false,
  '2024-06-15',
  '{"international_competition": true, "visa_assistance": true, "cultural_events": true}'::jsonb
);