-- Fix remaining function search path issue
-- Update the guard function for pairing judge assignments

CREATE OR REPLACE FUNCTION public.guard_pja_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if not public.is_admin() then
    if (new.pairing_id is distinct from old.pairing_id)
       or (new.judge_profile_id is distinct from old.judge_profile_id)
       or (new.role is distinct from old.role)
       or (new.assigned_by is distinct from old.assigned_by) then
      raise exception 'Only admins can change assignment structure (pairing/judge/role/assigned_by)';
    end if;
  end if;
  return new;
end;
$$;