-- Add tournament type and mode columns to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS tournament_type text NOT NULL DEFAULT 'long_form' CHECK (tournament_type IN ('live_paced', 'long_form', 'hybrid')),
ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS judge_requests_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS schedule_proposals_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS venue_management_enabled boolean NOT NULL DEFAULT false;

-- Create tournament_venues table for room/venue management
CREATE TABLE public.tournament_venues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  room_name text NOT NULL,
  room_number text,
  building text,
  floor text,
  capacity integer,
  is_available boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add index for tournament lookup
CREATE INDEX idx_tournament_venues_tournament_id ON public.tournament_venues(tournament_id);

-- Add venue_id to pairings for structured room assignment
ALTER TABLE public.pairings 
ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.tournament_venues(id) ON DELETE SET NULL;

-- Enable RLS on tournament_venues
ALTER TABLE public.tournament_venues ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament_venues
CREATE POLICY "Anyone can view tournament venues"
ON public.tournament_venues
FOR SELECT
USING (true);

CREATE POLICY "Scoped admins can manage tournament venues"
ON public.tournament_venues
FOR ALL
USING (can_admin_tournament(tournament_id))
WITH CHECK (can_admin_tournament(tournament_id));

-- Add trigger for updated_at
CREATE TRIGGER update_tournament_venues_updated_at
BEFORE UPDATE ON public.tournament_venues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();