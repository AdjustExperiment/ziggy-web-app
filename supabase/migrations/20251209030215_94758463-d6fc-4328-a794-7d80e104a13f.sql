-- Phase 7B: Multi-Format Tournaments, Judge System Overhaul, and Results Reveal

-- Drop adjudicator_feedback table (not needed, using ballots only)
DROP TABLE IF EXISTS adjudicator_feedback CASCADE;

-- Create tournament_events table for multi-format support
CREATE TABLE public.tournament_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  format_id UUID REFERENCES debate_formats(id),
  name TEXT NOT NULL,
  short_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, short_code)
);

-- Enable RLS on tournament_events
ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament_events
CREATE POLICY "Anyone can view tournament events"
  ON public.tournament_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tournament events"
  ON public.tournament_events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create pending_judge_invitations table
CREATE TABLE public.pending_judge_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES tournament_registrations(id) ON DELETE SET NULL,
  invited_by_user_id UUID,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  claimed_by_user_id UUID,
  UNIQUE(email, tournament_id)
);

-- Enable RLS on pending_judge_invitations
ALTER TABLE public.pending_judge_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_judge_invitations
CREATE POLICY "Admins can manage pending judge invitations"
  ON public.pending_judge_invitations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view invitations for their email"
  ON public.pending_judge_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u 
      WHERE u.id = auth.uid() 
      AND LOWER(u.email) = LOWER(pending_judge_invitations.email)
    )
  );

-- Add event_id to rounds table
ALTER TABLE public.rounds 
ADD COLUMN event_id UUID REFERENCES tournament_events(id) ON DELETE SET NULL;

-- Add event_id to pairings table
ALTER TABLE public.pairings 
ADD COLUMN event_id UUID REFERENCES tournament_events(id) ON DELETE SET NULL;

-- Add event_id to tournament_registrations table
ALTER TABLE public.tournament_registrations 
ADD COLUMN event_id UUID REFERENCES tournament_events(id) ON DELETE SET NULL;

-- Add format_id to ballot_templates table
ALTER TABLE public.ballot_templates 
ADD COLUMN format_id UUID REFERENCES debate_formats(id) ON DELETE SET NULL;

-- Add status column to judge_profiles for approval workflow
ALTER TABLE public.judge_profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'approved' 
CHECK (status IN ('pending_approval', 'approved', 'rejected', 'suspended'));

-- Add invited_judge_email to tournament_registrations
ALTER TABLE public.tournament_registrations 
ADD COLUMN invited_judge_email TEXT;

-- Create function to get appropriate ballot template
CREATE OR REPLACE FUNCTION public.get_ballot_template(
  p_tournament_id UUID, 
  p_format_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT id FROM public.ballot_templates
  WHERE 
    -- Priority 1: Tournament-specific for this format
    (tournament_id = p_tournament_id AND format_id = p_format_id)
    OR
    -- Priority 2: Tournament-specific default
    (tournament_id = p_tournament_id AND format_id IS NULL)
    OR
    -- Priority 3: Global for this format
    (tournament_id IS NULL AND format_id = p_format_id)
    OR
    -- Priority 4: Global default
    (tournament_id IS NULL AND format_id IS NULL AND is_default = true)
  ORDER BY 
    CASE 
      WHEN tournament_id = p_tournament_id AND format_id = p_format_id THEN 1
      WHEN tournament_id = p_tournament_id AND format_id IS NULL THEN 2
      WHEN tournament_id IS NULL AND format_id = p_format_id THEN 3
      ELSE 4
    END
  LIMIT 1;
$$;

-- Create function to claim pending judge invitations on signup
CREATE OR REPLACE FUNCTION public.claim_pending_judge_invitations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  invitation RECORD;
  new_judge_profile_id UUID;
BEGIN
  -- Find any pending invitations for this email
  FOR invitation IN
    SELECT * FROM public.pending_judge_invitations
    WHERE LOWER(email) = LOWER(NEW.email)
    AND claimed_at IS NULL
  LOOP
    -- Check if user already has a judge profile
    SELECT id INTO new_judge_profile_id
    FROM public.judge_profiles
    WHERE user_id = NEW.id;
    
    -- Create judge profile if doesn't exist
    IF new_judge_profile_id IS NULL THEN
      INSERT INTO public.judge_profiles (user_id, name, email, status)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        'approved'
      )
      RETURNING id INTO new_judge_profile_id;
    END IF;
    
    -- Mark invitation as claimed
    UPDATE public.pending_judge_invitations
    SET claimed_at = NOW(),
        claimed_by_user_id = NEW.id
    WHERE id = invitation.id;
    
    -- Create judge notification
    INSERT INTO public.judge_notifications (
      judge_profile_id,
      tournament_id,
      title,
      message,
      type
    ) VALUES (
      new_judge_profile_id,
      invitation.tournament_id,
      'Judge Invitation Claimed',
      'You have been invited to judge a tournament. Check your assignments.',
      'invitation_claimed'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to claim invitations on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_claim_invitations ON auth.users;
CREATE TRIGGER on_auth_user_created_claim_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.claim_pending_judge_invitations();

-- Create function to detect family conflicts (same last name)
CREATE OR REPLACE FUNCTION public.detect_judge_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  judge_last_name TEXT;
  competitor RECORD;
BEGIN
  -- Get judge's last name
  SELECT SPLIT_PART(TRIM(name), ' ', -1) INTO judge_last_name
  FROM public.judge_profiles
  WHERE id = NEW.judge_profile_id;
  
  -- Check for same competitor (judge is also registered)
  INSERT INTO public.judge_team_conflicts (
    tournament_id,
    judge_profile_id,
    registration_id,
    conflict_type
  )
  SELECT 
    NEW.tournament_id,
    NEW.judge_profile_id,
    tr.id,
    'self'
  FROM public.tournament_registrations tr
  JOIN public.judge_profiles jp ON jp.id = NEW.judge_profile_id
  WHERE tr.tournament_id = NEW.tournament_id
  AND tr.user_id = jp.user_id
  ON CONFLICT DO NOTHING;
  
  -- Check for family conflicts (same last name)
  FOR competitor IN
    SELECT tr.id, tr.participant_name
    FROM public.tournament_registrations tr
    WHERE tr.tournament_id = NEW.tournament_id
    AND LOWER(SPLIT_PART(TRIM(tr.participant_name), ' ', -1)) = LOWER(judge_last_name)
  LOOP
    INSERT INTO public.judge_team_conflicts (
      tournament_id,
      judge_profile_id,
      registration_id,
      conflict_type
    ) VALUES (
      NEW.tournament_id,
      NEW.judge_profile_id,
      competitor.id,
      'family'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create function to reveal all results for a tournament
CREATE OR REPLACE FUNCTION public.reveal_tournament_results(p_tournament_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reveal results';
  END IF;

  UPDATE public.ballots b
  SET is_published = TRUE,
      revealed_at = NOW(),
      updated_at = NOW()
  FROM public.pairings p
  WHERE b.pairing_id = p.id
    AND p.tournament_id = p_tournament_id
    AND b.is_published = FALSE
    AND b.status = 'submitted';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_events_tournament_id ON public.tournament_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_pending_judge_invitations_email ON public.pending_judge_invitations(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_rounds_event_id ON public.rounds(event_id);
CREATE INDEX IF NOT EXISTS idx_pairings_event_id ON public.pairings(event_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_event_id ON public.tournament_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_ballot_templates_format_id ON public.ballot_templates(format_id);