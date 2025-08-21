-- Create judge_requests table for debaters to request specific judges
CREATE TABLE public.judge_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pairing_id UUID NOT NULL,
  requester_id UUID NOT NULL,
  judge_id UUID NOT NULL,
  request_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.judge_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for judge requests
CREATE POLICY "Users can view requests for their pairings"
ON public.judge_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.id = pairing_id 
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

CREATE POLICY "Users can create requests for their pairings"
ON public.judge_requests
FOR INSERT
WITH CHECK (
  auth.uid() = requester_id AND
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.id = pairing_id 
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all judge requests"
ON public.judge_requests
FOR ALL
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_judge_requests_updated_at
BEFORE UPDATE ON public.judge_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create judge_availability table for detailed availability tracking
CREATE TABLE public.judge_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_profile_id UUID NOT NULL,
  tournament_id UUID NOT NULL,
  available_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_rounds_per_day INTEGER DEFAULT 3,
  special_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(judge_profile_id, tournament_id)
);

-- Enable RLS
ALTER TABLE public.judge_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for judge availability
CREATE POLICY "Judges can manage their own availability"
ON public.judge_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.judge_profiles jp
    WHERE jp.id = judge_profile_id AND jp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all availability"
ON public.judge_availability
FOR SELECT
USING (is_admin());

CREATE POLICY "Users can view availability for their tournament pairings"
ON public.judge_availability
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.tournament_id = judge_availability.tournament_id
    AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_judge_availability_updated_at
BEFORE UPDATE ON public.judge_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create judge_notifications table for judge-specific communications
CREATE TABLE public.judge_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_profile_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  pairing_id UUID,
  tournament_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.judge_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for judge notifications
CREATE POLICY "Judges can view their own notifications"
ON public.judge_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.judge_profiles jp
    WHERE jp.id = judge_profile_id AND jp.user_id = auth.uid()
  )
);

CREATE POLICY "Judges can update their own notifications"
ON public.judge_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.judge_profiles jp
    WHERE jp.id = judge_profile_id AND jp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all judge notifications"
ON public.judge_notifications
FOR ALL
USING (is_admin());