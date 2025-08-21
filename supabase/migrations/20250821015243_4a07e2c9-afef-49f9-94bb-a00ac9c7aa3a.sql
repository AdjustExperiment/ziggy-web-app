
-- 1) Ensure profiles are created when a new auth user is created
--    (Function public.handle_new_user already exists; add the trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2) Keep tournaments.registration_open in sync with tournaments.status
--    'Registration Open'  => registration_open = true
--    'Registration Closed' => registration_open = false
CREATE OR REPLACE FUNCTION public.sync_registration_open_from_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NULL THEN
    RETURN NEW;
  END IF;

  IF lower(NEW.status) = 'registration open' THEN
    NEW.registration_open := true;
  ELSIF lower(NEW.status) = 'registration closed' THEN
    NEW.registration_open := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_registration_open_ins ON public.tournaments;
CREATE TRIGGER trg_sync_registration_open_ins
  BEFORE INSERT ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.sync_registration_open_from_status();

DROP TRIGGER IF EXISTS trg_sync_registration_open_upd ON public.tournaments;
CREATE TRIGGER trg_sync_registration_open_upd
  BEFORE UPDATE OF status ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.sync_registration_open_from_status();

-- Backfill existing rows once so UI immediately reflects "Registration Open"
UPDATE public.tournaments
SET registration_open = CASE 
  WHEN lower(status) = 'registration open' THEN true
  WHEN lower(status) = 'registration closed' THEN false
  ELSE registration_open
END;

-- 3) Keep tournaments.current_participants in sync with registrations
--    (Function public.update_tournament_participants exists; add the trigger)
DROP TRIGGER IF EXISTS trg_update_tournament_participants ON public.tournament_registrations;
CREATE TRIGGER trg_update_tournament_participants
  AFTER INSERT OR DELETE ON public.tournament_registrations
  FOR EACH ROW EXECUTE PROCEDURE public.update_tournament_participants();

-- 4) Secure RPC to promote a user to admin by email
--    Only callable by admins (enforced inside function).
CREATE OR REPLACE FUNCTION public.make_admin_by_email(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Allow only admins to use this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote users to admin';
  END IF;

  -- Find the user in auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;

  -- Update profile role; create a profile if it's missing
  UPDATE public.profiles
  SET role = 'admin', updated_at = now()
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, role)
    VALUES (target_user_id, 'admin');
  END IF;

  RETURN true;
END;
$$;

-- Restrict RPC execution to authenticated users
REVOKE ALL ON FUNCTION public.make_admin_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.make_admin_by_email(text) TO authenticated;
