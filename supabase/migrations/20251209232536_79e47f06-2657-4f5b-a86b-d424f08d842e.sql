-- =============================================
-- MULTI-TENANT FOUNDATION MIGRATION
-- =============================================

-- 1. Create Organizations Table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  contact_email text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create Tournament Admins Table
CREATE TABLE public.tournament_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  permissions jsonb DEFAULT '{}',
  UNIQUE(user_id, tournament_id)
);

ALTER TABLE public.tournament_admins ENABLE ROW LEVEL SECURITY;

-- 3. Create Organization Admins Table
CREATE TABLE public.organization_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'owner')),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;

-- 4. Add organization_id to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_tournaments_org_id ON public.tournaments(organization_id);

-- 5. Create Pairing Edit History Table (for manual pairing edits)
CREATE TABLE public.pairing_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id uuid NOT NULL REFERENCES public.pairings(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  field_changed text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_reason text
);

ALTER TABLE public.pairing_edit_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if user is a tournament admin for specific tournament
CREATE OR REPLACE FUNCTION public.is_tournament_admin(_tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.tournament_admins
    WHERE user_id = auth.uid() AND tournament_id = _tournament_id
  );
$$;

-- Check if user is an organization admin for specific org
CREATE OR REPLACE FUNCTION public.is_org_admin(_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.organization_admins
    WHERE user_id = auth.uid() AND organization_id = _organization_id
  );
$$;

-- Check if user can administer a tournament (global admin, tournament admin, or org admin)
CREATE OR REPLACE FUNCTION public.can_admin_tournament(_tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    public.is_admin() -- Global admin
    OR EXISTS ( -- Direct tournament admin
      SELECT 1 FROM public.tournament_admins
      WHERE user_id = auth.uid() AND tournament_id = _tournament_id
    )
    OR EXISTS ( -- Org admin with matching tournament
      SELECT 1 FROM public.organization_admins oa
      JOIN public.tournaments t ON t.organization_id = oa.organization_id
      WHERE oa.user_id = auth.uid() AND t.id = _tournament_id
    );
$$;

-- Get all tournament IDs a user can administer
CREATE OR REPLACE FUNCTION public.get_admin_tournament_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT t.id
  FROM public.tournaments t
  WHERE public.is_admin() -- Global admins see all
  UNION
  SELECT tournament_id FROM public.tournament_admins WHERE user_id = auth.uid()
  UNION
  SELECT t.id 
  FROM public.tournaments t
  JOIN public.organization_admins oa ON t.organization_id = oa.organization_id
  WHERE oa.user_id = auth.uid();
$$;

-- =============================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================

-- Organizations policies
CREATE POLICY "Global admins can manage organizations"
ON public.organizations FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Org admins can view their organization"
ON public.organizations FOR SELECT
USING (public.is_org_admin(id));

CREATE POLICY "Anyone can view organizations"
ON public.organizations FOR SELECT
USING (true);

-- Tournament Admins policies
CREATE POLICY "Global admins can manage tournament admins"
ON public.tournament_admins FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Tournament admins can view their own assignment"
ON public.tournament_admins FOR SELECT
USING (user_id = auth.uid());

-- Organization Admins policies
CREATE POLICY "Global admins can manage organization admins"
ON public.organization_admins FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Org admins can view their own assignment"
ON public.organization_admins FOR SELECT
USING (user_id = auth.uid());

-- Pairing Edit History policies
CREATE POLICY "Scoped admins can manage pairing history"
ON public.pairing_edit_history FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.pairings p 
  WHERE p.id = pairing_edit_history.pairing_id 
  AND public.can_admin_tournament(p.tournament_id)
));

CREATE POLICY "Scoped admins can insert pairing history"
ON public.pairing_edit_history FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pairings p 
  WHERE p.id = pairing_edit_history.pairing_id 
  AND public.can_admin_tournament(p.tournament_id)
));

-- =============================================
-- UPDATE EXISTING RLS POLICIES FOR SCOPED ACCESS
-- =============================================

-- Tournament Registrations
DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.tournament_registrations;
CREATE POLICY "Scoped admins can manage registrations"
ON public.tournament_registrations FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Rounds
DROP POLICY IF EXISTS "Admins can manage rounds" ON public.rounds;
CREATE POLICY "Scoped admins can manage rounds"
ON public.rounds FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Pairings
DROP POLICY IF EXISTS "Admins can manage pairings" ON public.pairings;
CREATE POLICY "Scoped admins can manage pairings"
ON public.pairings FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Ballots (via pairing join)
DROP POLICY IF EXISTS "Admins can manage ballots" ON public.ballots;
CREATE POLICY "Scoped admins can manage ballots"
ON public.ballots FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.pairings p 
  WHERE p.id = ballots.pairing_id 
  AND public.can_admin_tournament(p.tournament_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pairings p 
  WHERE p.id = ballots.pairing_id 
  AND public.can_admin_tournament(p.tournament_id)
));

-- Tournament Content
DROP POLICY IF EXISTS "Admins can manage tournament content" ON public.tournament_content;
CREATE POLICY "Scoped admins can manage tournament content"
ON public.tournament_content FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Tournament Events
DROP POLICY IF EXISTS "Admins can manage tournament events" ON public.tournament_events;
CREATE POLICY "Scoped admins can manage tournament events"
ON public.tournament_events FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Pairing Judge Assignments (via pairing join)
DROP POLICY IF EXISTS "Admins can manage panel assignments" ON public.pairing_judge_assignments;
CREATE POLICY "Scoped admins can manage panel assignments"
ON public.pairing_judge_assignments FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.pairings p 
  WHERE p.id = pairing_judge_assignments.pairing_id 
  AND public.can_admin_tournament(p.tournament_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pairings p 
  WHERE p.id = pairing_judge_assignments.pairing_id 
  AND public.can_admin_tournament(p.tournament_id)
));

-- Round Opt Outs
DROP POLICY IF EXISTS "Admins can manage round opt outs" ON public.round_opt_outs;
CREATE POLICY "Scoped admins can manage round opt outs"
ON public.round_opt_outs FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Break Categories
DROP POLICY IF EXISTS "Admins can manage break categories" ON public.break_categories;
CREATE POLICY "Scoped admins can manage break categories"
ON public.break_categories FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Judge Notifications (via tournament_id)
DROP POLICY IF EXISTS "Admins can manage all judge notifications" ON public.judge_notifications;
CREATE POLICY "Scoped admins can manage judge notifications"
ON public.judge_notifications FOR ALL
USING (tournament_id IS NULL OR public.can_admin_tournament(tournament_id))
WITH CHECK (tournament_id IS NULL OR public.can_admin_tournament(tournament_id));

-- Competitor Notifications
DROP POLICY IF EXISTS "Admins can manage all competitor notifications" ON public.competitor_notifications;
CREATE POLICY "Scoped admins can manage competitor notifications"
ON public.competitor_notifications FOR ALL
USING (tournament_id IS NULL OR public.can_admin_tournament(tournament_id))
WITH CHECK (tournament_id IS NULL OR public.can_admin_tournament(tournament_id));

-- Schedule Proposals (via pairing join)
DROP POLICY IF EXISTS "Admins can manage schedule proposals" ON public.schedule_proposals;
CREATE POLICY "Scoped admins can manage schedule proposals"
ON public.schedule_proposals FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.pairings p 
  WHERE p.id = schedule_proposals.pairing_id 
  AND public.can_admin_tournament(p.tournament_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pairings p 
  WHERE p.id = schedule_proposals.pairing_id 
  AND public.can_admin_tournament(p.tournament_id)
));

-- Tournament Judge Registrations
DROP POLICY IF EXISTS "Admins can manage judge registrations" ON public.tournament_judge_registrations;
CREATE POLICY "Scoped admins can manage judge registrations"
ON public.tournament_judge_registrations FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Resolutions
DROP POLICY IF EXISTS "Admins can manage resolutions" ON public.resolutions;
CREATE POLICY "Scoped admins can manage resolutions"
ON public.resolutions FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_admins_user_id ON public.tournament_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_admins_tournament_id ON public.tournament_admins(tournament_id);
CREATE INDEX IF NOT EXISTS idx_organization_admins_user_id ON public.organization_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_admins_org_id ON public.organization_admins(organization_id);
CREATE INDEX IF NOT EXISTS idx_pairing_edit_history_pairing_id ON public.pairing_edit_history(pairing_id);