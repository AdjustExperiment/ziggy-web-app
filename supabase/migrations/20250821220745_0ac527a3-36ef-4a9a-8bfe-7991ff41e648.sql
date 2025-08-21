-- Create spectate_requests table for managing spectator requests
CREATE TABLE public.spectate_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pairing_id UUID NOT NULL,
  requester_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  aff_team_approval BOOLEAN DEFAULT NULL,
  neg_team_approval BOOLEAN DEFAULT NULL,
  request_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament_content table for admin-editable content
CREATE TABLE public.tournament_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  announcements JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  sponsors JSONB DEFAULT '[]'::jsonb,
  rules TEXT,
  schedule_notes TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.spectate_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spectate_requests
CREATE POLICY "Users can view spectate requests for their pairings"
ON public.spectate_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.id = spectate_requests.pairing_id
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
  OR requester_user_id = auth.uid()
);

CREATE POLICY "Users can create spectate requests"
ON public.spectate_requests
FOR INSERT
WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY "Users can update approvals for their pairings"
ON public.spectate_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.id = spectate_requests.pairing_id
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all spectate requests"
ON public.spectate_requests
FOR ALL
USING (is_admin());

-- RLS Policies for tournament_content
CREATE POLICY "Anyone can view published tournament content"
ON public.tournament_content
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tournament content"
ON public.tournament_content
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_spectate_requests_updated_at
  BEFORE UPDATE ON public.spectate_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_content_updated_at
  BEFORE UPDATE ON public.tournament_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if both teams have approved a spectate request
CREATE OR REPLACE FUNCTION public.update_spectate_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Auto-approve if both teams have approved
  IF NEW.aff_team_approval = true AND NEW.neg_team_approval = true AND OLD.status = 'pending' THEN
    NEW.status := 'approved';
  -- Auto-reject if either team has rejected
  ELSIF (NEW.aff_team_approval = false OR NEW.neg_team_approval = false) AND OLD.status = 'pending' THEN
    NEW.status := 'rejected';
  END IF;

  RETURN NEW;
END;
$$;

-- Add trigger for auto-status updates
CREATE TRIGGER spectate_request_status_update
  BEFORE UPDATE ON public.spectate_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_spectate_request_status();