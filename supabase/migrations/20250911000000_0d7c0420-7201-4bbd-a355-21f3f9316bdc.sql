-- Create payment_transactions table and ensure refund_requests table with RLS

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.tournament_registrations(id) on delete cascade,
  user_id uuid not null,
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'pending',
  stripe_session_id text,
  created_at timestamptz not null default now()
);

alter table public.payment_transactions enable row level security;

create policy if not exists "Users can view own payment transactions"
  on public.payment_transactions
  for select
  using (auth.uid() = user_id);

create policy if not exists "Admins can manage payment transactions"
  on public.payment_transactions
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Refund requests table (ensures existence)
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  user_id uuid not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.refund_requests enable row level security;

create policy if not exists "Admins can manage refund requests"
  on public.refund_requests
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "Users can view their refund requests"
  on public.refund_requests
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can create refund requests"
  on public.refund_requests
  for insert
  with check (auth.uid() = user_id);
