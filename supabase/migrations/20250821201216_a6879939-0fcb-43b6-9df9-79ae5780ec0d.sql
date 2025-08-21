
-- 1) Debate formats
create table if not exists public.debate_formats (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.debate_formats enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'debate_formats' and policyname = 'Anyone can view debate formats'
  ) then
    create policy "Anyone can view debate formats"
      on public.debate_formats
      for select
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'debate_formats' and policyname = 'Admins can manage debate formats'
  ) then
    create policy "Admins can manage debate formats"
      on public.debate_formats
      for all
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

create trigger set_timestamp_debate_formats
before update on public.debate_formats
for each row execute function public.update_updated_at_column();


-- 2) Judges
create table if not exists public.judge_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- optional but used for RLS
  name text not null,
  email text not null unique,
  phone text,
  experience_level text not null default 'novice',
  specializations text[] not null default '{}',
  availability jsonb not null default '{}'::jsonb,
  bio text,
  qualifications text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.judge_profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'judge_profiles' and policyname = 'Admins can manage judge profiles'
  ) then
    create policy "Admins can manage judge profiles"
      on public.judge_profiles
      for all
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

-- Judges can view/update their own profile (by user_id)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'judge_profiles' and policyname = 'Judges can select own profile'
  ) then
    create policy "Judges can select own profile"
      on public.judge_profiles
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'judge_profiles' and policyname = 'Judges can update own profile'
  ) then
    create policy "Judges can update own profile"
      on public.judge_profiles
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Allow judges to create their own profile (or admins)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'judge_profiles' and policyname = 'Judges can create own profile'
  ) then
    create policy "Judges can create own profile"
      on public.judge_profiles
      for insert
      with check (auth.uid() = user_id or is_admin());
  end if;
end $$;

create trigger set_timestamp_judge_profiles
before update on public.judge_profiles
for each row execute function public.update_updated_at_column();


-- 3) Extend tournaments with ballot reveal mode
alter table public.tournaments
  add column if not exists ballot_reveal_mode text not null default 'after_tournament'; 
-- allowed values: 'auto_on_submit' | 'after_tournament' (validated in app code)

-- Optionally link debate format key (non-breaking; nullable)
-- alter table public.tournaments add column if not exists debate_format_key text references public.debate_formats(key);


-- 4) Ballot templates (global or per-tournament)
create table if not exists public.ballot_templates (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  event_style text not null,
  template_key text not null,
  schema jsonb not null default '{}'::jsonb,
  html text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- one default per (event_style, scope), using coalesce to treat global as a single scope
create unique index if not exists ballot_templates_one_default_per_scope
on public.ballot_templates (event_style, coalesce(tournament_id, '00000000-0000-0000-0000-000000000000'::uuid))
where is_default = true;

alter table public.ballot_templates enable row level security;

-- Anyone can view templates (safe content), admins manage
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ballot_templates' and policyname = 'Anyone can view ballot templates'
  ) then
    create policy "Anyone can view ballot templates"
      on public.ballot_templates
      for select
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ballot_templates' and policyname = 'Admins can manage ballot templates'
  ) then
    create policy "Admins can manage ballot templates"
      on public.ballot_templates
      for all
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

create trigger set_timestamp_ballot_templates
before update on public.ballot_templates
for each row execute function public.update_updated_at_column();


-- 5) Ensure foreign keys and additions on rounds and pairings
-- Rounds -> Tournaments
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'rounds_tournament_id_fkey'
  ) then
    alter table public.rounds
      add constraint rounds_tournament_id_fkey
      foreign key (tournament_id) references public.tournaments(id) on delete cascade;
  end if;
end $$;

-- Pairings: add released flag
alter table public.pairings
  add column if not exists released boolean not null default false;

-- Pairings -> Tournaments
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'pairings_tournament_id_fkey'
  ) then
    alter table public.pairings
      add constraint pairings_tournament_id_fkey
      foreign key (tournament_id) references public.tournaments(id) on delete cascade;
  end if;
end $$;

-- Pairings -> Rounds
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'pairings_round_id_fkey'
  ) then
    alter table public.pairings
      add constraint pairings_round_id_fkey
      foreign key (round_id) references public.rounds(id) on delete cascade;
  end if;
end $$;

-- Pairings -> Registrations (aff/neg)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'pairings_aff_registration_id_fkey'
  ) then
    alter table public.pairings
      add constraint pairings_aff_registration_id_fkey
      foreign key (aff_registration_id) references public.tournament_registrations(id) on delete cascade;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'pairings_neg_registration_id_fkey'
  ) then
    alter table public.pairings
      add constraint pairings_neg_registration_id_fkey
      foreign key (neg_registration_id) references public.tournament_registrations(id) on delete cascade;
  end if;
end $$;

-- Pairings -> Judges (optional assignment)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'pairings_judge_id_fkey'
  ) then
    alter table public.pairings
      add constraint pairings_judge_id_fkey
      foreign key (judge_id) references public.judge_profiles(id) on delete set null;
  end if;
end $$;

-- Helpful indexes
create index if not exists idx_rounds_tournament_id on public.rounds(tournament_id);
create index if not exists idx_pairings_tournament_id on public.pairings(tournament_id);
create index if not exists idx_pairings_round_id on public.pairings(round_id);
create index if not exists idx_pairings_aff_reg on public.pairings(aff_registration_id);
create index if not exists idx_pairings_neg_reg on public.pairings(neg_registration_id);


-- 6) Ballots
create table if not exists public.ballots (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  judge_profile_id uuid not null references public.judge_profiles(id) on delete restrict,
  judge_user_id uuid not null,
  payload jsonb not null default '{}'::jsonb, -- content keyed by template schema
  status text not null default 'draft', -- draft | submitted | locked (future)
  is_published boolean not null default false,
  revealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pairing_id) -- single-judge ballots for now; can relax later for panels
);

alter table public.ballots enable row level security;

-- Helper functions for RLS
create or replace function public.can_submit_ballot(_pairing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.pairings p
    join public.judge_profiles jp on p.judge_id = jp.id
    where p.id = _pairing_id
      and jp.user_id = auth.uid()
  );
$$;

create or replace function public.user_is_competitor_for_pairing(_pairing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.pairings p
    join public.tournament_registrations tr
      on tr.id = p.aff_registration_id or tr.id = p.neg_registration_id
    where p.id = _pairing_id
      and tr.user_id = auth.uid()
  );
$$;

-- Admins manage all ballots
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ballots' and policyname='Admins can manage ballots'
  ) then
    create policy "Admins can manage ballots"
      on public.ballots
      for all
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

-- Judges can view their assigned ballots
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ballots' and policyname='Judges can select own ballots'
  ) then
    create policy "Judges can select own ballots"
      on public.ballots
      for select
      using (can_submit_ballot(pairing_id) and judge_user_id = auth.uid());
  end if;
end $$;

-- Judges can insert their ballots for assigned pairings
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ballots' and policyname='Judges can insert own ballots'
  ) then
    create policy "Judges can insert own ballots"
      on public.ballots
      for insert
      with check (can_submit_ballot(pairing_id) and judge_user_id = auth.uid());
  end if;
end $$;

-- Judges can update their ballots for assigned pairings
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ballots' and policyname='Judges can update own ballots'
  ) then
    create policy "Judges can update own ballots"
      on public.ballots
      for update
      using (can_submit_ballot(pairing_id) and judge_user_id = auth.uid())
      with check (can_submit_ballot(pairing_id) and judge_user_id = auth.uid());
  end if;
end $$;

-- Competitors can view published ballots from their debates
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ballots' and policyname='Competitors can view published ballots for their pairings'
  ) then
    create policy "Competitors can view published ballots for their pairings"
      on public.ballots
      for select
      using (is_published = true and public.user_is_competitor_for_pairing(pairing_id));
  end if;
end $$;

create trigger set_timestamp_ballots
before update on public.ballots
for each row execute function public.update_updated_at_column();

-- Auto-publish ballots if tournament mode is 'auto_on_submit'
create or replace function public.ballots_auto_publish_if_needed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mode text;
begin
  -- Only when new.status is submitted
  if tg_op in ('INSERT', 'UPDATE') and new.status = 'submitted' then
    select t.ballot_reveal_mode
    into mode
    from public.pairings p
    join public.tournaments t on t.id = p.tournament_id
    where p.id = new.pairing_id;

    if mode = 'auto_on_submit' then
      new.is_published := true;
      new.revealed_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists ballots_auto_publish_before on public.ballots;
create trigger ballots_auto_publish_before
before insert or update of status on public.ballots
for each row execute function public.ballots_auto_publish_if_needed();


-- Function to publish ballots for completed tournaments (after end date)
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
      updated_at = now()
  from public.pairings p
  join public.tournaments t on t.id = p.tournament_id
  where b.pairing_id = p.id
    and b.is_published = false
    and b.status = 'submitted'
    and t.ballot_reveal_mode = 'after_tournament'
    and t.end_date <= now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;


-- 7) Add optional tournament_id to results_recent for future linkage
alter table public.results_recent
  add column if not exists tournament_id uuid;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'results_recent_tournament_id_fkey'
  ) then
    alter table public.results_recent
      add constraint results_recent_tournament_id_fkey
      foreign key (tournament_id) references public.tournaments(id) on delete set null;
  end if;
end $$;

create index if not exists idx_results_recent_tournament_id on public.results_recent(tournament_id);


-- 8) Updated-at triggers on existing tables (safe because they have updated_at)
drop trigger if exists set_timestamp_rounds on public.rounds;
create trigger set_timestamp_rounds
before update on public.rounds
for each row execute function public.update_updated_at_column();

drop trigger if exists set_timestamp_pairings on public.pairings;
create trigger set_timestamp_pairings
before update on public.pairings
for each row execute function public.update_updated_at_column();


-- 9) Enable realtime
alter table public.ballots replica identity full;
alter table public.pairings replica identity full;

-- Add to realtime publication (ignore errors if already added)
do $$ begin
  begin
    execute 'alter publication supabase_realtime add table public.ballots';
  exception when others then
    null;
  end;
  begin
    execute 'alter publication supabase_realtime add table public.pairings';
  exception when others then
    null;
  end;
end $$;
