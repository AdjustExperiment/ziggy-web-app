-- Create competitor_notifications table
CREATE TABLE IF NOT EXISTS public.competitor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  pairing_id UUID REFERENCES public.pairings(id) ON DELETE SET NULL,
  round_id UUID REFERENCES public.rounds(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitor_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view notifications for their registrations
CREATE POLICY "Users can view own competitor notifications"
ON public.competitor_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tournament_registrations tr
    WHERE tr.id = competitor_notifications.registration_id
    AND tr.user_id = auth.uid()
  )
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own competitor notifications"
ON public.competitor_notifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tournament_registrations tr
    WHERE tr.id = competitor_notifications.registration_id
    AND tr.user_id = auth.uid()
  )
);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage competitor notifications"
ON public.competitor_notifications FOR ALL
USING (is_admin())
WITH CHECK (is_admin());