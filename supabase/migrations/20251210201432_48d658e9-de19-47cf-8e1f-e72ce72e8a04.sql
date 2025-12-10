-- Fix overly permissive RLS on pending_sponsor_invitations
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON pending_sponsor_invitations;

-- Create secure policy that requires admin access or ownership
CREATE POLICY "View sponsor invitation securely" ON pending_sponsor_invitations
FOR SELECT USING (
  -- Admin can view all
  is_admin()
  -- Or user who claimed it
  OR (claimed_by_user_id IS NOT NULL AND claimed_by_user_id = auth.uid())
  -- Or invited user matching email (before claim)
  OR (claimed_at IS NULL AND EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND lower(u.email) = lower(pending_sponsor_invitations.email)
  ))
);