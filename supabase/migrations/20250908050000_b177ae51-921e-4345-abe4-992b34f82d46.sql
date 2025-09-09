-- Add scheduling fields to rounds and create pairing generation function

-- 1) Add new columns for scheduling
alter table public.rounds
  add column if not exists start_time timestamptz,
  add column if not exists format text,
  add column if not exists notes text;

-- 2) Function to generate pairings for a round
create or replace function public.generate_pairings_for_round(_round_id uuid)
returns setof public.pairings
language plpgsql
security definer
set search_path = public
as $$
declare
  _tournament_id uuid;
  _registrations uuid[];
  _pair public.pairings%rowtype;
  _i int;
  _count int;
begin
  -- Ensure only admins can execute
  if not public.is_admin() then
    raise exception 'Only admins can generate pairings';
  end if;

  -- Lookup tournament id for the round
  select tournament_id into _tournament_id
  from public.rounds
  where id = _round_id;

  if _tournament_id is null then
    raise exception 'Round % not found', _round_id;
  end if;

  -- Get registrations for the tournament in random order
  select array_agg(id) into _registrations
  from public.tournament_registrations
  where tournament_id = _tournament_id
  order by random();

  _count := coalesce(array_length(_registrations,1),0);
  _i := 1;
  while _i < _count loop
    insert into public.pairings (tournament_id, round_id, aff_registration_id, neg_registration_id)
    values (_tournament_id, _round_id, _registrations[_i], _registrations[_i+1])
    returning * into _pair;
    return next _pair;
    _i := _i + 2;
  end loop;

  return;
end;
$$;
