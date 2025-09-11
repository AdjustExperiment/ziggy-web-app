-- Fix function search path security issues
-- Update functions to use SET search_path = public for security

-- Fix the audit log function
CREATE OR REPLACE FUNCTION public.log_profile_lock_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  action_name text;
  actor uuid := auth.uid();
begin
  if (new.is_locked is distinct from old.is_locked)
     or (coalesce(new.locked_until, to_timestamp(0)) is distinct from coalesce(old.locked_until, to_timestamp(0)))
  then
    if (new.is_locked = true) or (new.locked_until is not null and new.locked_until > now()) then
      action_name := 'account_locked';
    else
      action_name := 'account_unlocked';
    end if;

    insert into public.security_audit_logs (user_id, action, ip, user_agent, context)
    values (
      new.user_id,
      action_name,
      null,
      null,
      jsonb_build_object(
        'locked_until', new.locked_until,
        'lock_reason', new.lock_reason,
        'locked_by_user_id', coalesce(new.locked_by_user_id, actor)
      )
    );
  end if;
  return new;
end;
$$;

-- Fix tournament notification function
CREATE OR REPLACE FUNCTION public.generate_tournament_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a tournament status changes to 'Completed' or 'Finished'
  IF NEW.status IS DISTINCT FROM OLD.status AND lower(NEW.status) IN ('completed', 'finished', 'ended') THEN
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

  -- When registration closes (registration_open changes from true to false)
  IF OLD.registration_open = true AND NEW.registration_open = false THEN
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

-- Fix payment notification function
CREATE OR REPLACE FUNCTION public.generate_payment_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When payment status changes to 'paid'
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

-- Fix user notification function
CREATE OR REPLACE FUNCTION public.generate_user_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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