
-- Create a global email provider settings table (single row)
create table if not exists public.email_provider_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'resend' check (provider in ('resend', 'sendgrid')),
  from_email text,
  reply_to text,
  singleton boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure single-row pattern
create unique index if not exists email_provider_settings_singleton_idx
  on public.email_provider_settings (singleton);

-- Auto-update updated_at on changes
create trigger set_email_provider_settings_updated_at
before update on public.email_provider_settings
for each row
execute function public.update_updated_at_column();

-- Enable RLS
alter table public.email_provider_settings enable row level security;

-- Admin-only manage + view
drop policy if exists "Admins can manage email provider settings" on public.email_provider_settings;
create policy "Admins can manage email provider settings"
  on public.email_provider_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can view email provider settings" on public.email_provider_settings;
create policy "Admins can view email provider settings"
  on public.email_provider_settings
  for select
  using (public.is_admin());

-- Insert a default row if empty (defaults to provider='resend')
insert into public.email_provider_settings (provider, singleton)
values ('resend', true)
on conflict (singleton) do nothing;
