-- Create pending_sponsor_invitations table
CREATE TABLE public.pending_sponsor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  suggested_tier TEXT NOT NULL DEFAULT 'bronze',
  personal_message TEXT,
  invite_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  invited_by UUID,
  claimed_at TIMESTAMPTZ,
  claimed_by_user_id UUID,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for token lookups
CREATE INDEX idx_pending_sponsor_invitations_token ON public.pending_sponsor_invitations(invite_token);
CREATE INDEX idx_pending_sponsor_invitations_email ON public.pending_sponsor_invitations(LOWER(email));

-- Enable RLS
ALTER TABLE public.pending_sponsor_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage sponsor invitations"
ON public.pending_sponsor_invitations
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view invitation by token"
ON public.pending_sponsor_invitations
FOR SELECT
USING (true);

-- Auto-claim trigger function for sponsor invitations
CREATE OR REPLACE FUNCTION public.claim_pending_sponsor_invitations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invitation RECORD;
  new_sponsor_profile_id UUID;
BEGIN
  -- Find any pending invitations for this email
  FOR invitation IN
    SELECT * FROM public.pending_sponsor_invitations
    WHERE LOWER(email) = LOWER(NEW.email)
    AND claimed_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  LOOP
    -- Check if user already has a sponsor profile
    SELECT id INTO new_sponsor_profile_id
    FROM public.sponsor_profiles
    WHERE user_id = NEW.id;
    
    -- Create sponsor profile if doesn't exist
    IF new_sponsor_profile_id IS NULL THEN
      INSERT INTO public.sponsor_profiles (user_id, name, is_approved)
      VALUES (
        NEW.id,
        invitation.organization_name,
        false
      )
      RETURNING id INTO new_sponsor_profile_id;
    END IF;
    
    -- Mark invitation as claimed
    UPDATE public.pending_sponsor_invitations
    SET claimed_at = NOW(),
        claimed_by_user_id = NEW.id
    WHERE id = invitation.id;
    
    -- Create admin notification
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      priority,
      action_url,
      action_text,
      metadata
    ) VALUES (
      'Sponsor Invitation Claimed',
      invitation.organization_name || ' has claimed their sponsor invitation.',
      'sponsor_claimed',
      'medium',
      '/admin?tab=sponsors',
      'View Sponsors',
      jsonb_build_object(
        'organization_name', invitation.organization_name,
        'email', invitation.email,
        'sponsor_profile_id', new_sponsor_profile_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for auto-claim
CREATE TRIGGER on_auth_user_created_claim_sponsor_invitations
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.claim_pending_sponsor_invitations();