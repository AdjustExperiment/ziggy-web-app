
-- 0) Ensure you are admin
select public.make_admin_by_email('piperjustus14@gmail.com');

-- 1) Debate formats for reusable styles
create table if not exists public.debate_formats (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null unique,
  description text,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.debate_formats enable row level security;

-- Admins manage all
create policy if not exists "Admins can manage debate formats"
  on public.debate_formats
  as permissive
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Anyone can view formats
create policy if not exists "Anyone can view debate formats"
  on public.debate_formats
  as permissive
  for select
  using (true);

-- update updated_at
drop trigger if exists debate_formats_set_updated_at on public.debate_formats;
create trigger debate_formats_set_updated_at
  before update on public.debate_formats
  for each row execute function public.update_updated_at_column();

-- Seed requested formats (upsert by key)
insert into public.debate_formats (key, name, description, rules)
values
  ('lincoln_douglas', 'Lincoln-Douglas', 'One-on-one value debate.', jsonb_build_object('speeches', ['AC','NC','1AR','NR','2AR'], 'timings', jsonb_build_object('AC',6,'NC',7,'1AR',4,'NR',6,'2AR',3))),
  ('team_policy', 'Team Policy', 'Two-on-two policy debate.', jsonb_build_object('speeches', ['1AC','1NC','2AC','2NC','1NR','1AR','2NR','2AR'], 'timings', jsonb_build_object('constructive',8,'rebuttal',5))),
  ('individual_parli', 'Individual Parli', 'Single-person parliamentary debate.', jsonb_build_object('notes','Individual parliamentary event')),
  ('team_parli', 'Team Parli', 'Two-person parliamentary debate.', jsonb_build_object('notes','Team parliamentary event')),
  ('moot_court', 'Moot Court', 'Appellate advocacy simulation.', jsonb_build_object('notes','Moot Court format')),
  ('juniors_debate', 'Juniors Debate', 'Younger division format.', jsonb_build_object('notes','Juniors division'))
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    rules = excluded.rules,
    updated_at = now();

-- 2) Enhance tournaments with resolution and format_key
alter table public.tournaments
  add column if not exists resolution text,
  add column if not exists format_key text references public.debate_formats(key);

-- 3) Rounds table for tabulation
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  sequence integer not null default 1,
  scheduled_at timestamptz,
  status text not null default 'scheduled', -- scheduled | in_progress | completed | cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rounds enable row level security;

-- Admins manage all rounds
create policy if not exists "Admins can manage rounds"
  on public.rounds
  as permissive
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Anyone can view rounds
create policy if not exists "Anyone can view rounds"
  on public.rounds
  as permissive
  for select
  using (true);

drop trigger if exists rounds_set_updated_at on public.rounds;
create trigger rounds_set_updated_at
  before update on public.rounds
  for each row execute function public.update_updated_at_column();

-- 4) Pairings table
create table if not exists public.pairings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  aff_registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  neg_registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  room text,
  scheduled_time timestamptz,
  released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pairings enable row level security;

-- Admins manage all pairings
create policy if not exists "Admins can manage pairings"
  on public.pairings
  as permissive
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Users can view their own pairings (or released)
create policy if not exists "Users can view pairings they are in or released"
  on public.pairings
  as permissive
  for select
  using (
    released = true
    OR exists (
      select 1
      from public.tournament_registrations r
      where r.id in (pairings.aff_registration_id, pairings.neg_registration_id)
        and r.user_id = auth.uid()
    )
  );

drop trigger if exists pairings_set_updated_at on public.pairings;
create trigger pairings_set_updated_at
  before update on public.pairings
  for each row execute function public.update_updated_at_column();

-- 5) Judge profiles
create table if not exists public.judge_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null, -- optional link to a user profile
  name text not null,
  phone text,
  email text,
  bio text,
  qualifications text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.judge_profiles enable row level security;

-- Admins manage all judges
create policy if not exists "Admins can manage judge profiles"
  on public.judge_profiles
  as permissive
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Linked judges can view/update their own record
create policy if not exists "Judges can view own profile"
  on public.judge_profiles
  as permissive
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = judge_profiles.profile_id
        and p.user_id = auth.uid()
    )
  );

create policy if not exists "Judges can update own profile"
  on public.judge_profiles
  as permissive
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = judge_profiles.profile_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = judge_profiles.profile_id
        and p.user_id = auth.uid()
    )
  );

drop trigger if exists judge_profiles_set_updated_at on public.judge_profiles;
create trigger judge_profiles_set_updated_at
  before update on public.judge_profiles
  for each row execute function public.update_updated_at_column();

-- 6) Judge assignments
create table if not exists public.judge_assignments (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  judge_id uuid not null references public.judge_profiles(id) on delete cascade,
  role text not null default 'judge', -- judge | chair | panel | etc
  assigned_at timestamptz not null default now()
);

alter table public.judge_assignments enable row level security;

-- Admins manage all assignments
create policy if not exists "Admins can manage judge assignments"
  on public.judge_assignments
  as permissive
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Judges can view own assignments
create policy if not exists "Judges can view own assignments"
  on public.judge_assignments
  as permissive
  for select
  using (
    exists (
      select 1 from public.judge_profiles jp
      join public.profiles p on p.id = jp.profile_id
      where jp.id = judge_assignments.judge_id
        and p.user_id = auth.uid()
    )
  );

-- 7) Registration fields for online tournaments (judge info + partner workflow)
alter table public.tournament_registrations
  add column if not exists judge_name text,
  add column if not exists judge_phone text,
  add column if not exists partner_email text,
  add column if not exists partnership_status text not null default 'single'; -- single | partner pending | partnership confirmed

-- Partnership sync trigger: auto-set 'partner pending' or 'partnership confirmed'
create or replace function public.sync_partnership_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reciprocal_id uuid;
begin
  -- default to single
  new.partnership_status := 'single';

  if new.partner_email is not null and new.partner_name is not null then
    -- set to pending by default
    new.partnership_status := 'partner pending';

    -- look for reciprocal registration in same tournament
    select id into reciprocal_id
    from public.tournament_registrations r
    where r.tournament_id = new.tournament_id
      and r.participant_email = new.partner_email
      and r.partner_email = new.participant_email
    limit 1;

    if reciprocal_id is not null then
      -- mark both as confirmed
      new.partnership_status := 'partnership confirmed';
      update public.tournament_registrations r2
      set partnership_status = 'partnership confirmed'
      where r2.id = reciprocal_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_partnership_status_ins on public.tournament_registrations;
create trigger trg_sync_partnership_status_ins
  before insert on public.tournament_registrations
  for each row execute function public.sync_partnership_status();

drop trigger if exists trg_sync_partnership_status_upd on public.tournament_registrations;
create trigger trg_sync_partnership_status_upd
  before update of partner_email, partner_name, participant_email, tournament_id on public.tournament_registrations
  for each row execute function public.sync_partnership_status();

-- 8) Refund requests and notifications
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  user_id uuid not null,
  reason text,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now()
);

alter table public.refund_requests enable row level security;

-- Admins manage all refund requests
create policy if not exists "Admins can manage refund requests"
  on public.refund_requests
  as permissive
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Users can create/select their own refund requests
create policy if not exists "Users can create refund requests for their registrations"
  on public.refund_requests
  as permissive
  for insert
  with check (
    auth.uid() is not null and exists (
      select 1 from public.tournament_registrations r
      where r.id = refund_requests.registration_id
        and r.user_id = auth.uid()
    )
  );

create policy if not exists "Users can view their own refund requests"
  on public.refund_requests
  as permissive
  for select
  using (auth.uid() = user_id);

-- Trigger to notify admins on refund request
create or replace function public.generate_refund_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (
    title,
    message,
    type,
    priority,
    action_url,
    action_text,
    metadata,
    registration_id
  ) values (
    'Refund Request',
    'A refund was requested for a registration. Click to review in Payments.',
    'refund_request',
    'medium',
    '/admin?tab=payments',
    'Review Refund',
    jsonb_build_object(
      'registration_id', new.registration_id,
      'user_id', new.user_id,
      'reason', new.reason
    ),
    new.registration_id
  );

  return new;
end;
$$;

drop trigger if exists trg_refund_notify on public.refund_requests;
create trigger trg_refund_notify
  after insert on public.refund_requests
  for each row execute function public.generate_refund_notifications();
