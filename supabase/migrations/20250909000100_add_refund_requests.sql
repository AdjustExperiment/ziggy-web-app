-- Create refund_requests table
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  user_id uuid not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.refund_requests enable row level security;

create policy if not exists "Users manage own refunds" on public.refund_requests
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Admins manage refunds" on public.refund_requests
  for all
  using (public.is_admin())
  with check (public.is_admin());
