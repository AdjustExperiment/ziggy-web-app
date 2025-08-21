
-- PHASE 3: Tabulation, Constraints, Brackets, Admin Registrations

-- 1) Per-round pairing settings and elimination flags
alter table public.rounds
  add column if not exists pairing_method text not null default 'high_high',
  add column if not exists club_protect boolean not null default true,
  add column if not exists avoid_rematches boolean not null default true,
  add column if not exists is_elimination boolean not null default false,
  add column if not exists elimination_name text null,
  add column if not exists locked boolean not null default false;

-- 2) Tournament-level tab settings scaffold
alter table public.tournaments
  add column if not exists tab_settings jsonb not null default '{}'::jsonb;

-- 3) Pairings enhancements: bracket fields, run linkage, locking and validations
alter table public.pairings
  add column if not exists generated_by_run_id uuid null,
  add column if not exists locked boolean not null default false,
  add column if not exists seed_aff integer null,
  add column if not exists seed_neg integer null,
  add column if not exists is_elimination boolean not null default false,
  add column if not exists advances_to_pairing_id uuid null;

-- Prevent AFF and NEG from being the same team
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'pairings_aff_not_neg'
  ) then
    alter table public.pairings
      add constraint pairings_aff_not_neg check (aff_registration_id <> neg_registration_id);
  end if;
end$$;

-- Self-reference FK for bracket progression (nullable)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'pairings_advances_to_fk'
  ) then
    alter table public.pairings
      add constraint pairings_advances_to_fk
      foreign key (advances_to_pairing_id) references public.pairings(id) on delete set null;
  end if;
end$$;

-- Helpful indexes
create index if not exists idx_pairings_round_id on public.pairings(round_id);
create index if not exists idx_pairings_aff_reg on public.pairings(aff_registration_id);
create index if not exists idx_pairings_neg_reg on public.pairings(neg_registration_id);
create index if not exists idx_pairings_judge_id on public.pairings(judge_id);
create index if not exists idx_pairings_generated_run on public.pairings(generated_by_run_id);

-- 4) Unique-team-per-round validation via trigger (covers both AFF and NEG)
create or replace function public.validate_unique_team_per_round()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conflict_exists boolean;
begin
  -- Skip when any key is null
  if new.round_id is null or new.aff_registration_id is null or new.neg_registration_id is null then
    return new;
  end if;

  -- Is any pairing in this round already using either team (in either side)?
  select exists (
    select 1
    from public.pairings p
    where p.round_id = new.round_id
      and p.id is distinct from new.id
      and (
        p.aff_registration_id = new.aff_registration_id or
        p.neg_registration_id = new.aff_registration_id or
        p.aff_registration_id = new.neg_registration_id or
        p.neg_registration_id = new.neg_registration_id
      )
  ) into conflict_exists;

  if conflict_exists then
    raise exception 'Team already assigned in this round';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_unique_team_per_round on public.pairings;
create trigger trg_validate_unique_team_per_round
before insert or update on public.pairings
for each row
execute function public.validate_unique_team_per_round();

-- 5) Pairing run ledger
create table if not exists public.round_pairing_runs (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  method text not null,
  params jsonb not null default '{}'::jsonb,
  summary text null,
  created_by uuid null, -- actor id (optional; audit only)
  created_at timestamptz not null default now()
);

alter table public.round_pairing_runs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='round_pairing_runs' and policyname='Admins can manage pairing runs'
  ) then
    create policy "Admins can manage pairing runs"
      on public.round_pairing_runs
      for all
      using (is_admin())
      with check (is_admin());
  end if;
end$$;

-- optional readonly for anyone? keep admin-only for now.

-- 6) Constraints tables
create table if not exists public.team_conflicts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  cannot_face_registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  reason text null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  unique (tournament_id, registration_id, cannot_face_registration_id)
);

create index if not exists idx_team_conflicts_tourn on public.team_conflicts(tournament_id);

alter table public.team_conflicts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='team_conflicts' and policyname='Admins can manage team conflicts'
  ) then
    create policy "Admins can manage team conflicts"
      on public.team_conflicts
      for all
      using (is_admin())
      with check (is_admin());
  end if;
end$$;

create table if not exists public.judge_team_conflicts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  judge_profile_id uuid not null references public.judge_profiles(id) on delete cascade,
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  reason text null,
  created_at timestamptz not null default now(),
  unique (tournament_id, judge_profile_id, registration_id)
);

create index if not exists idx_jtc_tourn on public.judge_team_conflicts(tournament_id);

alter table public.judge_team_conflicts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='judge_team_conflicts' and policyname='Admins can manage judge-team conflicts'
  ) then
    create policy "Admins can manage judge-team conflicts"
      on public.judge_team_conflicts
      for all
      using (is_admin())
      with check (is_admin());
  end if;
end$$;

create table if not exists public.judge_school_conflicts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  judge_profile_id uuid not null references public.judge_profiles(id) on delete cascade,
  school_name text not null,
  reason text null,
  created_at timestamptz not null default now(),
  unique (tournament_id, judge_profile_id, school_name)
);

create index if not exists idx_jsc_tourn on public.judge_school_conflicts(tournament_id);

alter table public.judge_school_conflicts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='judge_school_conflicts' and policyname='Admins can manage judge-school conflicts'
  ) then
    create policy "Admins can manage judge-school conflicts"
      on public.judge_school_conflicts
      for all
      using (is_admin())
      with check (is_admin());
  end if;
end$$;

-- 7) Elimination seeding
create table if not exists public.elimination_seeds (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  seed integer not null,
  created_at timestamptz not null default now(),
  unique (tournament_id, registration_id),
  unique (tournament_id, seed)
);

create index if not exists idx_elim_seeds_tourn on public.elimination_seeds(tournament_id);

alter table public.elimination_seeds enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='elimination_seeds' and policyname='Admins can manage elimination seeds'
  ) then
    create policy "Admins can manage elimination seeds"
      on public.elimination_seeds
      for all
      using (is_admin())
      with check (is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='elimination_seeds' and policyname='Anyone can view elimination seeds'
  ) then
    create policy "Anyone can view elimination seeds"
      on public.elimination_seeds
      for select
      using (true);
  end if;
end$$;

-- 8) Standings table + recalculation logic
create table if not exists public.tournament_standings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  wins integer not null default 0,
  losses integer not null default 0,
  speaks_total numeric not null default 0,
  speaks_avg numeric not null default 0,
  opp_strength numeric not null default 0,
  last_calculated_at timestamptz not null default now(),
  unique (tournament_id, registration_id)
);

create index if not exists idx_standings_tourn on public.tournament_standings(tournament_id);

alter table public.tournament_standings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournament_standings' and policyname='Admins can manage standings'
  ) then
    create policy "Admins can manage standings"
      on public.tournament_standings
      for all
      using (is_admin())
      with check (is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournament_standings' and policyname='Anyone can view standings'
  ) then
    create policy "Anyone can view standings"
      on public.tournament_standings
      for select
      using (true);
  end if;
end$$;

create or replace function public.recalc_tournament_standings(_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Aggregate current results from pairings.result JSON
  insert into public.tournament_standings as ts (
    tournament_id, registration_id, wins, losses, speaks_total, speaks_avg, opp_strength, last_calculated_at
  )
  select
    _tournament_id,
    s.reg_id,
    sum(s.wins)::int,
    sum(s.losses)::int,
    sum(s.speaks)::numeric,
    avg(s.speaks)::numeric,
    0::numeric as opp_strength, -- placeholder; can be computed later
    now()
  from (
    -- AFF rows
    select
      p.aff_registration_id as reg_id,
      case when (p.result->>'winner') = 'aff' then 1 else 0 end as wins,
      case when (p.result->>'winner') = 'neg' then 1 else 0 end as losses,
      coalesce((p.result->>'aff_speaks')::numeric, 0) as speaks
    from public.pairings p
    where p.tournament_id = _tournament_id
      and p.result ? 'winner'
    union all
    -- NEG rows
    select
      p.neg_registration_id as reg_id,
      case when (p.result->>'winner') = 'neg' then 1 else 0 end as wins,
      case when (p.result->>'winner') = 'aff' then 1 else 0 end as losses,
      coalesce((p.result->>'neg_speaks')::numeric, 0) as speaks
    from public.pairings p
    where p.tournament_id = _tournament_id
      and p.result ? 'winner'
  ) s
  group by s.reg_id
  on conflict (tournament_id, registration_id)
  do update
    set wins = excluded.wins,
        losses = excluded.losses,
        speaks_total = excluded.speaks_total,
        speaks_avg = excluded.speaks_avg,
        opp_strength = excluded.opp_strength,
        last_calculated_at = now();

  -- Optionally, remove standings for teams no longer present; skip for safety.
end;
$$;

-- Trigger wrapper to call recalc after pairings result changes
create or replace function public.trg_recalc_standings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalc_tournament_standings(new.tournament_id);
  return null;
end;
$$;

drop trigger if exists trg_pairings_recalc_standings on public.pairings;
create trigger trg_pairings_recalc_standings
after insert or update of result on public.pairings
for each row
when (new.result is distinct from coalesce(old.result, '{}'::jsonb))
execute function public.trg_recalc_standings();

-- 9) Link pairings to run ledger via FK (optional; nullable)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'pairings_generated_by_run_fk'
  ) then
    alter table public.pairings
      add constraint pairings_generated_by_run_fk
      foreign key (generated_by_run_id) references public.round_pairing_runs(id) on delete set null;
  end if;
end$$;

-- 10) Admin manual registrations: allow null user_id and mark admin-created
alter table public.tournament_registrations
  alter column user_id drop not null;

alter table public.tournament_registrations
  add column if not exists created_by_admin boolean not null default false;

-- RLS policies on tournament_registrations already grant Admins ALL via is_admin().
-- Insert policy for authenticated users remains unchanged and will still require auth.uid() = user_id.

-- 11) Optional: small quality-of-life indexes
create index if not exists idx_rounds_tourn on public.rounds(tournament_id);
create index if not exists idx_registrations_tourn on public.tournament_registrations(tournament_id);

-- Done.
