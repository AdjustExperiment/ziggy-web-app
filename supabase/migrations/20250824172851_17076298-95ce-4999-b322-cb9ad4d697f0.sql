
-- 1) Tournament-level toggle
alter table public.tournaments
add column if not exists opt_outs_enabled boolean not null default false;

-- 2) Round opt-outs
create table if not exists public.round_opt_outs (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (round_id, registration_id)
);

alter table public.round_opt_outs enable row level security;

-- Admins can manage all
create policy "Admins can manage round opt outs"
  on public.round_opt_outs
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Competitors can view their own opt-outs
create policy "Competitors can view own round opt outs"
  on public.round_opt_outs
  for select
  using (
    exists (
      select 1
      from public.tournament_registrations tr
      where tr.id = round_opt_outs.registration_id
        and tr.user_id = auth.uid()
    )
  );

-- Competitors can create their own opt-outs (only when tournament has opt-outs enabled)
create policy "Competitors can create own round opt outs when enabled"
  on public.round_opt_outs
  for insert
  with check (
    exists (
      select 1
      from public.tournament_registrations tr
      where tr.id = round_opt_outs.registration_id
        and tr.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.tournaments t
      where t.id = round_opt_outs.tournament_id
        and t.opt_outs_enabled = true
    )
  );

-- Competitors can update their own opt-outs (e.g., reason)
create policy "Competitors can update own round opt outs"
  on public.round_opt_outs
  for update
  using (
    exists (
      select 1
      from public.tournament_registrations tr
      where tr.id = round_opt_outs.registration_id
        and tr.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tournament_registrations tr
      where tr.id = round_opt_outs.registration_id
        and tr.user_id = auth.uid()
    )
  );

-- Competitors can delete their own opt-outs
create policy "Competitors can delete own round opt outs"
  on public.round_opt_outs
  for delete
  using (
    exists (
      select 1
      from public.tournament_registrations tr
      where tr.id = round_opt_outs.registration_id
        and tr.user_id = auth.uid()
    )
  );

-- 3) Extra round requests
create table if not exists public.extra_round_requests (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  note text,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at timestamptz not null default now(),
  unique (round_id, registration_id)
);

alter table public.extra_round_requests enable row level security;

-- Admins can manage all extra round requests
create policy "Admins can manage extra round requests"
  on public.extra_round_requests
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Competitors can view their own extra round requests
create policy "Competitors can view own extra round requests"
  on public.extra_round_requests
  for select
  using (
    exists (
      select 1
      from public.tournament_registrations tr
      where tr.id = extra_round_requests.registration_id
        and tr.user_id = auth.uid()
    )
  );

-- Competitors can create their own extra round requests (only when opt-outs enabled)
create policy "Competitors can create own extra round requests when enabled"
  on public.extra_round_requests
  for insert
  with check (
    exists (
      select 1
      from public.tournament_registrations tr
      where tr.id = extra_round_requests.registration_id
        and tr.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.tournaments t
      where t.id = extra_round_requests.tournament_id
        and t.opt_outs_enabled = true
    )
  );

-- Competitors can delete their own extra round requests
create policy "Competitors can delete own extra round requests"
  on public.extra_round_requests
  for delete
  using (
    exists (
      select 1
      from public.tournament_registrations tr
      where tr.id = extra_round_requests.registration_id
        and tr.user_id = auth.uid()
    )
  );

-- Optional indexes for admin views
create index if not exists round_opt_outs_round_idx on public.round_opt_outs (round_id);
create index if not exists round_opt_outs_tournament_idx on public.round_opt_outs (tournament_id);
create index if not exists extra_round_requests_round_idx on public.extra_round_requests (round_id);
create index if not exists extra_round_requests_tournament_idx on public.extra_round_requests (tournament_id);
