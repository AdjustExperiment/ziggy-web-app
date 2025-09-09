create table if not exists public.ballot_entries (
  id uuid primary key default gen_random_uuid(),
  judge_assignment_id uuid not null references public.judge_assignments(id) on delete cascade,
  judge_profile_id uuid not null references public.judge_profiles(id) on delete cascade,
  judge_user_id uuid not null,
  status text not null default 'draft',
  winner text,
  aff_points numeric,
  neg_points numeric,
  aff_rank integer,
  neg_rank integer,
  aff_feedback text,
  neg_feedback text,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ballot_entries enable row level security;

create policy if not exists "Admins can manage ballot entries"
  on public.ballot_entries
  as permissive
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "Judges can manage own ballot entries"
  on public.ballot_entries
  as permissive
  for all
  using (judge_user_id = auth.uid())
  with check (judge_user_id = auth.uid());
