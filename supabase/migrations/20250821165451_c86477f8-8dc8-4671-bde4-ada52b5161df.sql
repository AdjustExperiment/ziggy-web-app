-- Add missing columns to profiles table for profile setup
ALTER TABLE public.profiles 
ADD COLUMN state text,
ADD COLUMN region text,
ADD COLUMN time_zone text,
ADD COLUMN phone text;

-- Add RLS policy for users to insert their own profiles
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create rounds table for tournament rounds
CREATE TABLE public.rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  round_number integer NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  scheduled_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on rounds table
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

-- Create policies for rounds table
CREATE POLICY "Anyone can view rounds" ON public.rounds
FOR SELECT USING (true);

CREATE POLICY "Admins can manage rounds" ON public.rounds
FOR ALL USING (is_admin());

-- Create pairings table for tournament pairings
CREATE TABLE public.pairings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  aff_registration_id uuid NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  neg_registration_id uuid NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  room text,
  scheduled_time timestamp with time zone,
  judge_id uuid,
  result jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on pairings table
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;

-- Create policies for pairings table
CREATE POLICY "Anyone can view pairings" ON public.pairings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage pairings" ON public.pairings
FOR ALL USING (is_admin());

-- Create triggers for updated_at columns
CREATE TRIGGER update_rounds_updated_at
BEFORE UPDATE ON public.rounds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pairings_updated_at
BEFORE UPDATE ON public.pairings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();