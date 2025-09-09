create table if not exists public.judge_assignments (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  judge_id uuid not null references public.judge_profiles(id) on delete cascade,
  role text not null default 'judge',
  assigned_at timestamptz not null default now()
);

alter table public.judge_assignments enable row level security;

create policy if not exists "Admins can manage judge assignments"
  on public.judge_assignments
  as permissive
  for all
  using (public.is_admin())
  with check (public.is_admin());

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
