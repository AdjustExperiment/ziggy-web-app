-- Add ballot privacy, reveal delay, and judge anonymity to tournaments
-- and update ballot publication functions

-- 1) Create ballot_privacy enum if not exists
do $$ begin
  if not exists (select 1 from pg_type where typname = 'ballot_privacy') then
    create type public.ballot_privacy as enum ('public', 'private');
  end if;
end $$;

-- 2) Add columns to tournaments table
alter table public.tournaments
  add column if not exists ballot_privacy public.ballot_privacy not null default 'public',
  add column if not exists reveal_delay_minutes integer not null default 0,
  add column if not exists judge_anonymity boolean not null default false;

-- 3) Update trigger function for auto publishing
create or replace function public.ballots_auto_publish_if_needed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mode text;
  delay integer;
  anonymity boolean;
begin
  if tg_op in ('INSERT', 'UPDATE') and new.status = 'submitted' then
    select t.ballot_reveal_mode, t.reveal_delay_minutes, t.judge_anonymity
    into mode, delay, anonymity
    from public.pairings p
    join public.tournaments t on t.id = p.tournament_id
    where p.id = new.pairing_id;

    if mode = 'auto_on_submit' and coalesce(delay,0) = 0 then
      new.is_published := true;
      new.revealed_at := now();
      if anonymity then
        new.payload := jsonb_set(coalesce(new.payload, '{}'::jsonb), '{judge_name}', to_jsonb('Anonymous'), true);
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- 4) Function to publish ballots when delay has passed or tournament ended
create or replace function public.publish_due_ballots()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.ballots b
  set is_published = true,
      revealed_at = now(),
      payload = case
        when t.judge_anonymity then jsonb_set(coalesce(b.payload, '{}'::jsonb), '{judge_name}', to_jsonb('Anonymous'), true)
        else b.payload
      end,
      updated_at = now()
  from public.pairings p
  join public.tournaments t on t.id = p.tournament_id
  where b.pairing_id = p.id
    and b.is_published = false
    and b.status = 'submitted'
    and (
      (t.ballot_reveal_mode = 'after_tournament'
        and t.end_date + (t.reveal_delay_minutes || ' minutes')::interval <= now())
      or
      (t.ballot_reveal_mode = 'auto_on_submit'
        and t.reveal_delay_minutes > 0
        and b.updated_at + (t.reveal_delay_minutes || ' minutes')::interval <= now())
    );

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;
