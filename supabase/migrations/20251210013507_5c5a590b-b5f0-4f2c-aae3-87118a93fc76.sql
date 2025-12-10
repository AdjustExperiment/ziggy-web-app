-- Drop existing restrictive policies on sponsor_profiles
DROP POLICY IF EXISTS "Admins can manage sponsor profiles" ON sponsor_profiles;
DROP POLICY IF EXISTS "Owners can manage their sponsor profile" ON sponsor_profiles;

-- Create permissive policies for sponsor_profiles
CREATE POLICY "Users can create their own sponsor profile"
  ON sponsor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can view their own sponsor profile"
  ON sponsor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can update their own sponsor profile"
  ON sponsor_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sponsor profiles"
  ON sponsor_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Update the claim_pending_sponsor_invitations trigger to NOT auto-create profile
CREATE OR REPLACE FUNCTION public.claim_pending_sponsor_invitations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only mark invitations as claimed, do NOT create sponsor profile
  -- User must apply separately via the application form
  UPDATE public.pending_sponsor_invitations
  SET claimed_at = NOW(),
      claimed_by_user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND claimed_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN NEW;
END;
$function$;