-- Phase 7: Resolutions, Check-ins, and Feedback Tables
-- Add new tournament-level settings
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS check_in_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS resolutions_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add resolution_released to rounds
ALTER TABLE public.rounds
ADD COLUMN IF NOT EXISTS resolution_released BOOLEAN NOT NULL DEFAULT false;

-- Add uses_resolution to debate_formats
ALTER TABLE public.debate_formats
ADD COLUMN IF NOT EXISTS uses_resolution BOOLEAN NOT NULL DEFAULT true;

-- Create resolutions table (renamed from motions)
CREATE TABLE IF NOT EXISTS public.resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  resolution_text TEXT NOT NULL,
  info_slide TEXT,
  seq INTEGER NOT NULL DEFAULT 1,
  is_released BOOLEAN NOT NULL DEFAULT false,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create participant_checkins table (tournament-wide)
CREATE TABLE IF NOT EXISTS public.participant_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  judge_profile_id UUID REFERENCES public.judge_profiles(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_in_by UUID,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT checkin_target_check CHECK (
    (registration_id IS NOT NULL AND judge_profile_id IS NULL) OR
    (registration_id IS NULL AND judge_profile_id IS NOT NULL)
  )
);

-- Create adjudicator_feedback table
CREATE TABLE IF NOT EXISTS public.adjudicator_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  pairing_id UUID NOT NULL REFERENCES public.pairings(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('team', 'adjudicator')),
  source_registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  source_judge_id UUID REFERENCES public.judge_profiles(id) ON DELETE SET NULL,
  target_judge_id UUID NOT NULL REFERENCES public.judge_profiles(id) ON DELETE CASCADE,
  score NUMERIC CHECK (score >= 0 AND score <= 5),
  comments TEXT,
  is_submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT feedback_source_check CHECK (
    (source_type = 'team' AND source_registration_id IS NOT NULL AND source_judge_id IS NULL) OR
    (source_type = 'adjudicator' AND source_registration_id IS NULL AND source_judge_id IS NOT NULL)
  )
);

-- Create unique index for participant_checkins to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS participant_checkins_reg_unique 
ON public.participant_checkins(tournament_id, registration_id) 
WHERE registration_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS participant_checkins_judge_unique 
ON public.participant_checkins(tournament_id, judge_profile_id) 
WHERE judge_profile_id IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjudicator_feedback ENABLE ROW LEVEL SECURITY;

-- RLS for resolutions
CREATE POLICY "Admins can manage resolutions" ON public.resolutions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view released resolutions" ON public.resolutions
  FOR SELECT USING (is_released = true);

-- RLS for participant_checkins  
CREATE POLICY "Admins can manage check-ins" ON public.participant_checkins
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can view their own check-in" ON public.participant_checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tournament_registrations tr
      WHERE tr.id = participant_checkins.registration_id AND tr.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.judge_profiles jp
      WHERE jp.id = participant_checkins.judge_profile_id AND jp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can check themselves in" ON public.participant_checkins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = participant_checkins.tournament_id AND t.check_in_enabled = true
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.tournament_registrations tr
        WHERE tr.id = participant_checkins.registration_id AND tr.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.judge_profiles jp
        WHERE jp.id = participant_checkins.judge_profile_id AND jp.user_id = auth.uid()
      )
    )
  );

-- RLS for adjudicator_feedback
CREATE POLICY "Admins can manage feedback" ON public.adjudicator_feedback
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can submit feedback for their pairings" ON public.adjudicator_feedback
  FOR INSERT WITH CHECK (
    (source_type = 'team' AND EXISTS (
      SELECT 1 FROM public.tournament_registrations tr
      WHERE tr.id = adjudicator_feedback.source_registration_id AND tr.user_id = auth.uid()
    ))
    OR
    (source_type = 'adjudicator' AND EXISTS (
      SELECT 1 FROM public.judge_profiles jp
      WHERE jp.id = adjudicator_feedback.source_judge_id AND jp.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can view their own feedback" ON public.adjudicator_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tournament_registrations tr
      WHERE tr.id = adjudicator_feedback.source_registration_id AND tr.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.judge_profiles jp
      WHERE jp.id = adjudicator_feedback.source_judge_id AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.judge_profiles jp
      WHERE jp.id = adjudicator_feedback.target_judge_id AND jp.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_resolutions_updated_at
  BEFORE UPDATE ON public.resolutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adjudicator_feedback_updated_at
  BEFORE UPDATE ON public.adjudicator_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();