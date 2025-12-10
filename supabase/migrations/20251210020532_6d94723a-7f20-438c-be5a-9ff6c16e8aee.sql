-- Tournament Sponsor Links Junction Table (replaces free-text sponsors)
CREATE TABLE IF NOT EXISTS public.tournament_sponsor_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  sponsor_profile_id uuid NOT NULL REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'bronze',
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, sponsor_profile_id)
);

-- Enable RLS
ALTER TABLE public.tournament_sponsor_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view tournament sponsors" 
ON public.tournament_sponsor_links FOR SELECT USING (true);

CREATE POLICY "Scoped admins can manage tournament sponsors" 
ON public.tournament_sponsor_links FOR ALL 
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Update sponsor approval to also grant sponsor role
CREATE OR REPLACE FUNCTION public.sync_sponsor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  tier_limit integer;
  sponsor_user_id uuid;
BEGIN
  -- When a sponsor application is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get blog post limit from tier settings
    SELECT blog_posts_limit INTO tier_limit
    FROM public.sponsor_tier_settings
    WHERE tier = NEW.tier;
    
    -- Update sponsor profile with approval status
    UPDATE public.sponsor_profiles SET
      is_approved = true,
      approved_tier = NEW.tier,
      blog_posts_limit = COALESCE(tier_limit, 0),
      approved_at = now(),
      approved_by = NEW.approved_by
    WHERE id = NEW.sponsor_profile_id
    RETURNING user_id INTO sponsor_user_id;
    
    -- Add sponsor role to user_roles if user_id exists
    IF sponsor_user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (sponsor_user_id, 'sponsor')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    -- Create notification for sponsor
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      priority,
      metadata
    ) VALUES (
      'Sponsor Application Approved',
      'Your sponsor application has been approved! You can now access sponsor features.',
      'sponsor_approved',
      'high',
      jsonb_build_object('sponsor_profile_id', NEW.sponsor_profile_id, 'tier', NEW.tier)
    );
  END IF;
  
  -- When sponsor is rejected/withdrawn, check if they have other approved apps
  IF NEW.status IN ('rejected', 'withdrawn') AND OLD.status = 'approved' THEN
    -- Check if sponsor has any other approved applications
    IF NOT EXISTS (
      SELECT 1 FROM public.sponsor_applications 
      WHERE sponsor_profile_id = NEW.sponsor_profile_id 
      AND status = 'approved'
      AND id != NEW.id
    ) THEN
      UPDATE public.sponsor_profiles SET
        is_approved = false,
        approved_tier = NULL
      WHERE id = NEW.sponsor_profile_id;
      
      -- Remove sponsor role
      SELECT user_id INTO sponsor_user_id
      FROM public.sponsor_profiles
      WHERE id = NEW.sponsor_profile_id;
      
      IF sponsor_user_id IS NOT NULL THEN
        DELETE FROM public.user_roles
        WHERE user_id = sponsor_user_id AND role = 'sponsor';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;