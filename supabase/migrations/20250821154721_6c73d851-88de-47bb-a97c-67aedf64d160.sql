
-- 1) Judges core
create table if not exists public.judge_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  club text,
  experience text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.judge_profiles enable row level security;

-- Admins manage all
create policy if not exists "Admins manage judge_profiles"
on public.judge_profiles
for all
using (public.is_admin())
with check (public.is_admin());

-- Judges can view/update their own profile (when linked)
create policy if not exists "Judges view own judge_profile"
on public.judge_profiles
for select
using (user_id = auth.uid());

create policy if not exists "Judges update own judge_profile"
on public.judge_profiles
for update
using (user_id = auth.uid());

-- 2) Tournament judge pool
create table if not exists public.tournament_judges (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  judge_id uuid not null references public.judge_profiles(id) on delete cascade,
  available boolean not null default true,
  notes text,
  conflicts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.tournament_judges enable row level security;

-- Admins manage all pool rows
create policy if not exists "Admins manage tournament_judges"
on public.tournament_judges
for all
using (public.is_admin())
with check (public.is_admin());

-- Judges can view their own tournament pool rows
create policy if not exists "Judges view their tournament_judges rows"
on public.tournament_judges
for select
using (exists (
  select 1 from public.judge_profiles jp
  where jp.id = tournament_judges.judge_id
    and jp.user_id = auth.uid()
));

-- 3) Rounds
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  number integer,
  type text, -- prelim, elim, custom
  scheduled_at timestamptz,
  released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rounds enable row level security;

-- Admins manage all rounds
create policy if not exists "Admins manage rounds"
on public.rounds
for all
using (public.is_admin())
with check (public.is_admin());

-- Anyone can view released rounds (optional: make rounds public)
create policy if not exists "Anyone can view rounds"
on public.rounds
for select
using (true);

-- 4) Pairings
create table if not exists public.pairings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_id uuid references public.rounds(id) on delete set null,
  aff_registration_id uuid not null references public.tournament_registrations(id),
  neg_registration_id uuid not null references public.tournament_registrations(id),
  room text,
  scheduled_time timestamptz,
  scheduling_status text not null default 'unassigned', -- unassigned | proposed | confirmed
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  notes text,
  released boolean not null default false,
  reveal_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pairings enable row level security;

-- Helper functions
create or replace function public.user_in_pairing(_pairing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pairings p
    join public.tournament_registrations aff on aff.id = p.aff_registration_id
    join public.tournament_registrations neg on neg.id = p.neg_registration_id
    where p.id = _pairing_id
      and (
        (aff.user_id is not null and aff.user_id = auth.uid())
        or
        (neg.user_id is not null and neg.user_id = auth.uid())
      )
  );
$$;

create or replace function public.user_is_assigned_judge(_pairing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.judge_assignments ja
    join public.judge_profiles jp on jp.id = ja.judge_id
    where ja.pairing_id = _pairing_id
      and jp.user_id = auth.uid()
  );
$$;

-- Admins manage pairings
create policy if not exists "Admins manage pairings"
on public.pairings
for all
using (public.is_admin())
with check (public.is_admin());

-- Competitors & assigned judges can view their own pairing rows
create policy if not exists "Participants and judges can view their pairings"
on public.pairings
for select
using (public.user_in_pairing(id) or public.user_is_assigned_judge(id));

-- 5) Pairing messages (chat)
create table if not exists public.pairing_messages (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists pairing_messages_pairing_id_idx on public.pairing_messages(pairing_id);
alter table public.pairing_messages enable row level security;

-- Admins manage all messages
create policy if not exists "Admins manage pairing_messages"
on public.pairing_messages
for all
using (public.is_admin())
with check (public.is_admin());

-- Participants and assigned judges can view pairing messages
create policy if not exists "View messages for own pairing"
on public.pairing_messages
for select
using (
  public.user_in_pairing(pairing_id) or public.user_is_assigned_judge(pairing_id)
);

-- Participants and assigned judges can send messages
create policy if not exists "Send messages to own pairing"
on public.pairing_messages
for insert
with check (
  (auth.uid() = sender_user_id)
  and (public.user_in_pairing(pairing_id) or public.user_is_assigned_judge(pairing_id) or public.is_admin())
);

-- 6) Judge assignments
create table if not exists public.judge_assignments (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  judge_id uuid not null references public.judge_profiles(id) on delete cascade,
  role text not null default 'judge', -- chair, panelist, etc.
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique(pairing_id, judge_id)
);
create index if not exists judge_assignments_pairing_id_idx on public.judge_assignments(pairing_id);
alter table public.judge_assignments enable row level security;

-- Admins manage all assignments
create policy if not exists "Admins manage judge_assignments"
on public.judge_assignments
for all
using (public.is_admin())
with check (public.is_admin());

-- Judges can view their own assignments
create policy if not exists "Judges view their assignments"
on public.judge_assignments
for select
using (exists (
  select 1
  from public.judge_profiles jp
  where jp.id = judge_assignments.judge_id
    and jp.user_id = auth.uid()
));

-- Participants can view assignments on their pairings
create policy if not exists "Participants view assignments for own pairings"
on public.judge_assignments
for select
using (public.user_in_pairing(pairing_id));

-- 7) Judge requests (for manual/auto assignment workflow)
create table if not exists public.judge_requests (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  requested_by_user_id uuid not null references auth.users(id) on delete cascade,
  requested_count integer not null default 1,
  status text not null default 'open', -- open | fulfilled | cancelled
  auto boolean not null default false,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);
create index if not exists judge_requests_pairing_id_idx on public.judge_requests(pairing_id);
alter table public.judge_requests enable row level security;

-- Admins manage all requests
create policy if not exists "Admins manage judge_requests"
on public.judge_requests
for all
using (public.is_admin())
with check (public.is_admin());

-- Competitors can create/view requests for their pairings
create policy if not exists "Participants create judge_requests"
on public.judge_requests
for insert
with check (
  auth.uid() = requested_by_user_id
  and public.user_in_pairing(pairing_id)
);

create policy if not exists "Participants & judges view judge_requests"
on public.judge_requests
for select
using (
  public.user_in_pairing(pairing_id)
  or public.user_is_assigned_judge(pairing_id)
);

-- 8) Ballot templates (admin-editable)
create table if not exists public.ballot_templates (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  event_style text not null, -- e.g., 'LD', 'PF', 'Parli'
  template_key text not null,
  schema jsonb not null default '{}'::jsonb, -- scoring fields, structure, labels
  html text, -- optional HTML layout
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coalesce(tournament_id, '00000000-0000-0000-0000-000000000000'::uuid), template_key)
);
alter table public.ballot_templates enable row level security;

create policy if not exists "Admins manage ballot_templates"
on public.ballot_templates
for all
using (public.is_admin())
with check (public.is_admin());

-- 9) Ballots
create table if not exists public.ballots (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  judge_id uuid not null references public.judge_profiles(id) on delete cascade,
  template_key text,
  status text not null default 'draft', -- draft | submitted
  scores jsonb not null default '{}'::jsonb,
  winner text, -- 'aff' | 'neg' or text
  submitted_at timestamptz,
  locked boolean not null default false,
  revealed boolean not null default false, -- manual override if needed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pairing_id, judge_id)
);
create index if not exists ballots_pairing_id_idx on public.ballots(pairing_id);
alter table public.ballots enable row level security;

-- Tournament setting: control reveal behavior
alter table public.tournaments
add column if not exists ballot_reveal_mode text not null default 'after_tournament'; -- 'auto_on_submit' | 'after_tournament'

-- Helper: compute reveal eligibility
create or replace function public.ballot_is_revealed(_ballot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with b as (
    select
      bal.status,
      bal.revealed,
      t.ballot_reveal_mode,
      t.end_date,
      p.tournament_id
    from public.ballots bal
    join public.pairings p on p.id = bal.pairing_id
    join public.tournaments t on t.id = p.tournament_id
    where bal.id = _ballot_id
  )
  select coalesce(b.revealed, false)
         or (
           b.ballot_reveal_mode = 'auto_on_submit' and b.status = 'submitted'
         )
         or (
           b.ballot_reveal_mode = 'after_tournament' and (now()::date > b.end_date)
         )
  from b;
$$;

-- Admins manage ballots
create policy if not exists "Admins manage ballots"
on public.ballots
for all
using (public.is_admin())
with check (public.is_admin());

-- Judges can read their ballots
create policy if not exists "Judges read their ballots"
on public.ballots
for select
using (exists (
  select 1
  from public.judge_profiles jp
  where jp.id = ballots.judge_id
    and jp.user_id = auth.uid()
));

-- Judges can write their ballots while not locked
create policy if not exists "Judges update own ballots while unlocked"
on public.ballots
for update
using (
  exists (
    select 1
    from public.judge_profiles jp
    where jp.id = ballots.judge_id
      and jp.user_id = auth.uid()
  )
  and ballots.locked = false
);

-- Competitors can view ballots when revealed per tournament rule
create policy if not exists "Competitors view revealed ballots"
on public.ballots
for select
using (
  public.ballot_is_revealed(id) and exists (
    select 1
    from public.pairings p
    join public.tournament_registrations aff on aff.id = p.aff_registration_id
    join public.tournament_registrations neg on neg.id = p.neg_registration_id
    where p.id = ballots.pairing_id
      and (
        (aff.user_id is not null and aff.user_id = auth.uid())
        or
        (neg.user_id is not null and neg.user_id = auth.uid())
      )
  )
);

-- 10) RPC for safe time confirmation by participants
create or replace function public.confirm_pairing_time(_pairing_id uuid, _scheduled_time timestamptz)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  -- Only participants in the pairing or admins may call
  allowed := public.is_admin() or public.user_in_pairing(_pairing_id);
  if not allowed then
    raise exception 'Not authorized to confirm time for this pairing';
  end if;

  update public.pairings
  set scheduled_time = _scheduled_time,
      scheduling_status = 'confirmed',
      confirmed_by = auth.uid(),
      confirmed_at = now(),
      updated_at = now()
  where id = _pairing_id;

  return true;
end;
$$;

-- 11) updated_at triggers to keep timestamps fresh
drop trigger if exists trg_update_judge_profiles on public.judge_profiles;
create trigger trg_update_judge_profiles
before update on public.judge_profiles
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_update_rounds on public.rounds;
create trigger trg_update_rounds
before update on public.rounds
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_update_pairings on public.pairings;
create trigger trg_update_pairings
before update on public.pairings
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_update_ballots on public.ballots;
create trigger trg_update_ballots
before update on public.ballots
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_update_ballot_templates on public.ballot_templates;
create trigger trg_update_ballot_templates
before update on public.ballot_templates
for each row execute function public.update_updated_at_column();
