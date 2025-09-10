-- Create tournament-specific role access settings
CREATE TABLE public.tournament_role_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  role TEXT NOT NULL,
  can_view_pairings BOOLEAN NOT NULL DEFAULT false,
  can_view_rooms BOOLEAN NOT NULL DEFAULT false,
  can_view_stream BOOLEAN NOT NULL DEFAULT false,
  can_chat BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, role)
);

-- Create tournament tabulation settings
CREATE TABLE public.tournament_tabulation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL UNIQUE,
  pairing_method TEXT NOT NULL DEFAULT 'swiss',
  avoid_rematches BOOLEAN NOT NULL DEFAULT true,
  club_protect BOOLEAN NOT NULL DEFAULT true,
  preserve_break_rounds BOOLEAN NOT NULL DEFAULT false,
  prevent_bracket_breaks BOOLEAN NOT NULL DEFAULT false,
  max_repeat_opponents INTEGER NOT NULL DEFAULT 0,
  side_balance_target INTEGER NOT NULL DEFAULT 50,
  speaker_points_method TEXT NOT NULL DEFAULT 'standard',
  allow_judges_view_all_chat BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournament_role_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_tabulation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_role_access
CREATE POLICY "Admins can manage tournament role access" 
ON public.tournament_role_access 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view role access for tournaments they're registered in" 
ON public.tournament_role_access 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tournament_registrations tr 
  WHERE tr.tournament_id = tournament_role_access.tournament_id 
  AND tr.user_id = auth.uid()
));

-- RLS Policies for tournament_tabulation_settings
CREATE POLICY "Admins can manage tournament tabulation settings" 
ON public.tournament_tabulation_settings 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_tournament_role_access_updated_at
BEFORE UPDATE ON public.tournament_role_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_tabulation_settings_updated_at
BEFORE UPDATE ON public.tournament_tabulation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();