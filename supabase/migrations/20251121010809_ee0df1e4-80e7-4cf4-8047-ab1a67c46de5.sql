-- SECURITY FIX: Update all functions to use empty search_path for better security
-- This forces all references to be fully qualified, preventing search_path manipulation attacks

-- Fix: map_sponsor_tier_for_display
CREATE OR REPLACE FUNCTION public.map_sponsor_tier_for_display(_tier TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE LOWER(_tier)
    WHEN 'bronze' THEN 'supporting'
    WHEN 'silver' THEN 'major'
    WHEN 'gold' THEN 'presenting'
    WHEN 'platinum' THEN 'title'
    ELSE 'supporting'
  END;
$$;

-- Fix: is_account_locked
CREATE OR REPLACE FUNCTION public.is_account_locked(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND (
        p.is_locked = TRUE
        OR (p.locked_until IS NOT NULL AND p.locked_until > NOW())
      )
  );
$$;

-- Fix: log_sensitive_access
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'SELECT' AND TG_TABLE_NAME IN ('judge_profiles', 'tournament_registrations', 'payment_transactions') THEN
    INSERT INTO public.security_audit_logs (user_id, action, context)
    VALUES (
      auth.uid(),
      'sensitive_data_access',
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix: lock_account
CREATE OR REPLACE FUNCTION public.lock_account(_target_user_id UUID, _until TIMESTAMP WITH TIME ZONE DEFAULT NULL, _reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can lock accounts';
  END IF;

  UPDATE public.profiles
     SET is_locked = TRUE,
         locked_until = _until,
         lock_reason = _reason,
         locked_by_user_id = auth.uid(),
         updated_at = NOW()
   WHERE user_id = _target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', _target_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- Fix: unlock_account
CREATE OR REPLACE FUNCTION public.unlock_account(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can unlock accounts';
  END IF;

  UPDATE public.profiles
     SET is_locked = FALSE,
         locked_until = NULL,
         lock_reason = NULL,
         locked_by_user_id = auth.uid(),
         updated_at = NOW()
   WHERE user_id = _target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', _target_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- Fix: sync_approved_sponsor_to_content
CREATE OR REPLACE FUNCTION public.sync_approved_sponsor_to_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament_content_id UUID;
  v_name TEXT;
  v_logo TEXT;
  v_website TEXT;
  v_display_tier TEXT;
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
     OR (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN

    SELECT sp.name, sp.logo_url, sp.website
      INTO v_name, v_logo, v_website
    FROM public.sponsor_profiles sp
    WHERE sp.id = NEW.sponsor_profile_id;

    v_display_tier := public.map_sponsor_tier_for_display(NEW.tier);

    SELECT id INTO v_tournament_content_id
    FROM public.tournament_content
    WHERE tournament_id = NEW.tournament_id
    LIMIT 1;

    IF v_tournament_content_id IS NULL THEN
      INSERT INTO public.tournament_content (tournament_id, sponsors)
      VALUES (NEW.tournament_id, JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT(
        'name', v_name,
        'logo_url', v_logo,
        'website', v_website,
        'tier', v_display_tier
      )));
    ELSE
      UPDATE public.tournament_content tc
      SET sponsors = (
        COALESCE(
          (SELECT JSONB_AGG(e)
             FROM JSONB_ARRAY_ELEMENTS(COALESCE(tc.sponsors, '[]'::jsonb)) AS e
            WHERE e->>'name' IS DISTINCT FROM v_name),
          '[]'::jsonb
        ) || JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT(
          'name', v_name,
          'logo_url', v_logo,
          'website', v_website,
          'tier', v_display_tier
        ))
      ),
      updated_at = NOW()
      WHERE tc.id = v_tournament_content_id;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status IN ('rejected','withdrawn') THEN
    SELECT id INTO v_tournament_content_id
    FROM public.tournament_content
    WHERE tournament_id = NEW.tournament_id
    LIMIT 1;

    IF v_tournament_content_id IS NOT NULL THEN
      SELECT sp.name INTO v_name
      FROM public.sponsor_profiles sp
      WHERE sp.id = NEW.sponsor_profile_id;

      UPDATE public.tournament_content tc
      SET sponsors = (
        COALESCE(
          (SELECT JSONB_AGG(e)
             FROM JSONB_ARRAY_ELEMENTS(COALESCE(tc.sponsors, '[]'::jsonb)) AS e
            WHERE e->>'name' IS DISTINCT FROM v_name),
          '[]'::jsonb
        )
      ),
      updated_at = NOW()
      WHERE tc.id = v_tournament_content_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: log_profile_lock_changes
CREATE OR REPLACE FUNCTION public.log_profile_lock_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  action_name TEXT;
  actor UUID := auth.uid();
BEGIN
  IF (NEW.is_locked IS DISTINCT FROM OLD.is_locked)
     OR (COALESCE(NEW.locked_until, TO_TIMESTAMP(0)) IS DISTINCT FROM COALESCE(OLD.locked_until, TO_TIMESTAMP(0)))
  THEN
    IF (NEW.is_locked = TRUE) OR (NEW.locked_until IS NOT NULL AND NEW.locked_until > NOW()) THEN
      action_name := 'account_locked';
    ELSE
      action_name := 'account_unlocked';
    END IF;

    INSERT INTO public.security_audit_logs (user_id, action, ip, user_agent, context)
    VALUES (
      NEW.user_id,
      action_name,
      NULL,
      NULL,
      jsonb_build_object(
        'locked_until', NEW.locked_until,
        'lock_reason', NEW.lock_reason,
        'locked_by_user_id', COALESCE(NEW.locked_by_user_id, actor)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix: generate_tournament_notifications
CREATE OR REPLACE FUNCTION public.generate_tournament_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND LOWER(NEW.status) IN ('completed', 'finished', 'ended') THEN
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      priority,
      action_url,
      action_text,
      metadata,
      tournament_id
    ) VALUES (
      'Tournament Completed: ' || NEW.name,
      'Tournament "' || NEW.name || '" has completed. Please update the tournament results and winners.',
      'tournament_completed',
      'high',
      '/admin?tab=results',
      'Update Results',
      jsonb_build_object(
        'tournament_name', NEW.name,
        'tournament_id', NEW.id,
        'end_date', NEW.end_date
      ),
      NEW.id
    );
  END IF;

  IF OLD.registration_open = TRUE AND NEW.registration_open = FALSE THEN
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      priority,
      action_url,
      action_text,
      metadata,
      tournament_id
    ) VALUES (
      'Registration Closed: ' || NEW.name,
      'Registration for "' || NEW.name || '" has closed. Consider sending confirmation emails to registered participants.',
      'registration_closed',
      'medium',
      '/admin?tab=emails',
      'Send Emails',
      jsonb_build_object(
        'tournament_name', NEW.name,
        'tournament_id', NEW.id,
        'participant_count', NEW.current_participants
      ),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: generate_user_notifications
CREATE OR REPLACE FUNCTION public.generate_user_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    title,
    message,
    type,
    priority,
    action_url,
    action_text,
    metadata
  ) VALUES (
    'New User Registration',
    'A new user has registered: ' || COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Unknown Name'),
    'new_user',
    'low',
    '/admin?tab=users',
    'View Users',
    jsonb_build_object(
      'user_name', COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Unknown'),
      'user_id', NEW.user_id
    )
  );

  RETURN NEW;
END;
$$;

-- Fix: guard_pja_updates
CREATE OR REPLACE FUNCTION public.guard_pja_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF (NEW.pairing_id IS DISTINCT FROM OLD.pairing_id)
       OR (NEW.judge_profile_id IS DISTINCT FROM OLD.judge_profile_id)
       OR (NEW.role IS DISTINCT FROM OLD.role)
       OR (NEW.assigned_by IS DISTINCT FROM OLD.assigned_by) THEN
      RAISE EXCEPTION 'Only admins can change assignment structure (pairing/judge/role/assigned_by)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix: can_submit_ballot
CREATE OR REPLACE FUNCTION public.can_submit_ballot(_pairing_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.pairings p
    JOIN public.judge_profiles jp ON p.judge_id = jp.id
    WHERE p.id = _pairing_id
      AND jp.user_id = auth.uid()
  )
  OR EXISTS(
    SELECT 1
    FROM public.pairing_judge_assignments a
    JOIN public.judge_profiles jp ON jp.id = a.judge_profile_id
    WHERE a.pairing_id = _pairing_id
      AND a.status IN ('assigned','confirmed')
      AND jp.user_id = auth.uid()
  );
$$;

-- Fix: sync_primary_judge_from_assignments
CREATE OR REPLACE FUNCTION public.sync_primary_judge_from_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_chair UUID;
BEGIN
  IF (TG_OP IN ('INSERT','UPDATE') AND NEW.role = 'chair') OR (TG_OP = 'DELETE' AND OLD.role = 'chair') THEN
    SELECT judge_profile_id
    INTO current_chair
    FROM public.pairing_judge_assignments
    WHERE pairing_id = COALESCE(NEW.pairing_id, OLD.pairing_id)
      AND role = 'chair'
      AND status <> 'removed'
    ORDER BY created_at ASC
    LIMIT 1;

    UPDATE public.pairings
    SET judge_id = current_chair,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.pairing_id, OLD.pairing_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix: generate_panel_assignment_notifications
CREATE OR REPLACE FUNCTION public.generate_panel_assignment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
    SELECT
      NEW.judge_profile_id,
      p.id,
      p.tournament_id,
      'New Panel Assignment',
      'You have been assigned to a panel (' || NEW.role || ').',
      'judge_assigned'
    FROM public.pairings p
    WHERE p.id = NEW.pairing_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
    SELECT
      NEW.judge_profile_id,
      p.id,
      p.tournament_id,
      'Assignment Status Updated',
      'Your assignment status is now: ' || NEW.status || '.',
      'judge_assignment_status'
    FROM public.pairings p
    WHERE p.id = NEW.pairing_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: handle_new_user (already updated in previous migration)
-- Keeping the version from the previous migration which already uses empty search_path

-- Fix: update_tournament_participants
CREATE OR REPLACE FUNCTION public.update_tournament_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants - 1
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix: sync_registration_open_from_status
CREATE OR REPLACE FUNCTION public.sync_registration_open_from_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS NULL THEN
    RETURN NEW;
  END IF;

  IF LOWER(NEW.status) = 'registration open' THEN
    NEW.registration_open := TRUE;
  ELSIF LOWER(NEW.status) = 'registration closed' THEN
    NEW.registration_open := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: is_admin (already updated in previous migration)
-- Keeping the version from the previous migration which already uses empty search_path

-- Fix: make_admin_by_email (already updated in previous migration)
-- Keeping the version from the previous migration which already uses empty search_path

-- Fix: user_is_competitor_for_pairing
CREATE OR REPLACE FUNCTION public.user_is_competitor_for_pairing(_pairing_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.pairings p
    JOIN public.tournament_registrations tr
      ON tr.id = p.aff_registration_id OR tr.id = p.neg_registration_id
    WHERE p.id = _pairing_id
      AND tr.user_id = auth.uid()
  );
$$;

-- Fix: generate_payment_notifications
CREATE OR REPLACE FUNCTION public.generate_payment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    INSERT INTO public.admin_notifications (
      title,
      message,
      type,
      priority,
      metadata,
      registration_id
    ) VALUES (
      'Payment Received',
      'Payment of $' || COALESCE(NEW.amount_paid::text, 'N/A') || ' received from ' || NEW.participant_name || ' for tournament registration.',
      'payment_received',
      'low',
      jsonb_build_object(
        'participant_name', NEW.participant_name,
        'participant_email', NEW.participant_email,
        'amount', NEW.amount_paid,
        'tournament_id', NEW.tournament_id
      ),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: ballots_auto_publish_if_needed
CREATE OR REPLACE FUNCTION public.ballots_auto_publish_if_needed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  mode TEXT;
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'submitted' THEN
    SELECT t.ballot_reveal_mode
    INTO mode
    FROM public.pairings p
    JOIN public.tournaments t ON t.id = p.tournament_id
    WHERE p.id = NEW.pairing_id;

    IF mode = 'auto_on_submit' THEN
      NEW.is_published := TRUE;
      NEW.revealed_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: publish_due_ballots
CREATE OR REPLACE FUNCTION public.publish_due_ballots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.ballots b
  SET is_published = TRUE,
      revealed_at = NOW(),
      updated_at = NOW()
  FROM public.pairings p
  JOIN public.tournaments t ON t.id = p.tournament_id
  WHERE b.pairing_id = p.id
    AND b.is_published = FALSE
    AND b.status = 'submitted'
    AND t.ballot_reveal_mode = 'after_tournament'
    AND t.end_date <= NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Fix: admin_lock_ballots
CREATE OR REPLACE FUNCTION public.admin_lock_ballots(_tournament_id UUID, _round_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can lock ballots';
  END IF;

  UPDATE public.ballots b
  SET status = 'submitted',
      updated_at = NOW()
  FROM public.pairings p
  WHERE b.pairing_id = p.id
    AND p.tournament_id = _tournament_id
    AND (_round_id IS NULL OR p.round_id = _round_id)
    AND b.status <> 'submitted';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Fix: recompute_results_from_ballots
CREATE OR REPLACE FUNCTION public.recompute_results_from_ballots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_tournaments INTEGER;
BEGIN
  WITH tids AS (
    SELECT DISTINCT p.tournament_id
    FROM public.ballots b
    JOIN public.pairings p ON p.id = b.pairing_id
    WHERE b.is_published = TRUE AND b.status = 'submitted'
  )
  SELECT COUNT(*) INTO affected_tournaments FROM tids;

  DELETE FROM public.results_recent
  WHERE tournament_id IN (
    SELECT tournament_id FROM (
      SELECT DISTINCT p.tournament_id
      FROM public.ballots b
      JOIN public.pairings p ON p.id = b.pairing_id
      WHERE b.is_published = TRUE AND b.status = 'submitted'
    ) q
  );

  INSERT INTO public.results_recent (
    tournament_id, tournament, position, format, date, participants, points, prize
  )
  SELECT
    t.id AS tournament_id,
    t.name AS tournament,
    'Win' AS position,
    t.format AS format,
    COALESCE(t.end_date, t.start_date) AS date,
    2 AS participants,
    1 AS points,
    NULL::text AS prize
  FROM public.ballots b
  JOIN public.pairings p ON p.id = b.pairing_id
  JOIN public.tournaments t ON t.id = p.tournament_id
  WHERE b.is_published = TRUE AND b.status = 'submitted'
    AND (b.payload ? 'winner');

  DELETE FROM public.top_performers;

  WITH winners AS (
    SELECT
      CASE WHEN b.payload->>'winner' = 'aff' THEN ar.id ELSE nr.id END AS reg_id,
      p.tournament_id AS tid
    FROM public.ballots b
    JOIN public.pairings p ON p.id = b.pairing_id
    JOIN public.tournament_registrations ar ON ar.id = p.aff_registration_id
    JOIN public.tournament_registrations nr ON nr.id = p.neg_registration_id
    WHERE b.is_published = TRUE AND b.status = 'submitted'
      AND (b.payload->>'winner') IN ('aff','neg')
  ),
  matches AS (
    SELECT ar.id AS reg_id, p.tournament_id AS tid
    FROM public.ballots b
    JOIN public.pairings p ON p.id = b.pairing_id
    JOIN public.tournament_registrations ar ON ar.id = p.aff_registration_id
    WHERE b.is_published = TRUE AND b.status = 'submitted'
    UNION ALL
    SELECT nr.id AS reg_id, p.tournament_id AS tid
    FROM public.ballots b
    JOIN public.pairings p ON p.id = b.pairing_id
    JOIN public.tournament_registrations nr ON nr.id = p.neg_registration_id
    WHERE b.is_published = TRUE AND b.status = 'submitted'
  ),
  agg AS (
    SELECT
      r.participant_name AS name,
      COALESCE(r.school_organization, 'Independent') AS school,
      COUNT(*) AS total_matches,
      COUNT(DISTINCT m.tid) AS tournaments,
      COUNT(w.reg_id) AS wins
    FROM matches m
    JOIN public.tournament_registrations r ON r.id = m.reg_id
    LEFT JOIN winners w ON w.reg_id = m.reg_id AND w.tid = m.tid
    GROUP BY r.participant_name, r.school_organization
  )
  INSERT INTO public.top_performers (rank, name, school, points, tournaments, win_rate)
  SELECT
    ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC) AS rank,
    name,
    school,
    wins AS points,
    tournaments,
    CASE WHEN total_matches = 0 THEN 0 ELSE wins::numeric / total_matches END AS win_rate
  FROM agg;

  RETURN affected_tournaments;
END;
$$;

-- Fix: generate_judge_assignment_notification
CREATE OR REPLACE FUNCTION public.generate_judge_assignment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.judge_id IS NOT NULL AND (OLD.judge_id IS DISTINCT FROM NEW.judge_id) THEN
    INSERT INTO public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
    VALUES (
      NEW.judge_id,
      NEW.id,
      NEW.tournament_id,
      'New Judging Assignment',
      'You have been assigned to judge a round.',
      'judge_assigned'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix: generate_schedule_approval_notifications
CREATE OR REPLACE FUNCTION public.generate_schedule_approval_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jpid UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT p.judge_id INTO jpid
    FROM public.pairings p
    WHERE p.id = NEW.pairing_id;

    IF jpid IS NOT NULL THEN
      INSERT INTO public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
      SELECT 
        jpid,
        p.id,
        p.tournament_id,
        'Schedule Approved',
        'The schedule proposal has been approved.',
        'schedule_approved'
      FROM public.pairings p
      WHERE p.id = NEW.pairing_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix: notify_requested_judge
CREATE OR REPLACE FUNCTION public.notify_requested_judge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  t_name TEXT;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.requested_judge_profile_id IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.requested_judge_profile_id IS DISTINCT FROM OLD.requested_judge_profile_id AND NEW.requested_judge_profile_id IS NOT NULL)
  THEN
    SELECT name INTO t_name
    FROM public.tournaments
    WHERE id = NEW.tournament_id;

    INSERT INTO public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
    VALUES (
      NEW.requested_judge_profile_id,
      NULL,
      NEW.tournament_id,
      'Judge Requested',
      COALESCE(NEW.participant_name, 'A competitor') || ' has requested you to judge ' || COALESCE(t_name, 'a tournament') || '. Please update your availability.',
      'judge_requested'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: update_spectate_request_status
CREATE OR REPLACE FUNCTION public.update_spectate_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.aff_team_approval = TRUE AND NEW.neg_team_approval = TRUE AND OLD.status = 'pending' THEN
    NEW.status := 'approved';
  ELSIF (NEW.aff_team_approval = FALSE OR NEW.neg_team_approval = FALSE) AND OLD.status = 'pending' THEN
    NEW.status := 'rejected';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: has_role (already updated in previous migration)
-- Keeping the version from the previous migration which already uses empty search_path

-- Fix: get_user_role (already updated in previous migration)
-- Keeping the version from the previous migration which already uses empty search_path