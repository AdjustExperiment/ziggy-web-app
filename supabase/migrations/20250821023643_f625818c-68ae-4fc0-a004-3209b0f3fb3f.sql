
-- 1) Email templates to manage content per tournament
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  template_key text not null, -- 'registration_success' | 'payment_pending'
  subject text not null,
  html text not null,
  text text,
  from_email text,
  reply_to text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure quick lookups by tournament + key
create index if not exists email_templates_tournament_key_idx
  on public.email_templates(tournament_id, template_key);

-- Updated_at trigger
drop trigger if exists set_timestamp_email_templates on public.email_templates;
create trigger set_timestamp_email_templates
before update on public.email_templates
for each row
execute function public.update_updated_at_column();

-- RLS
alter table public.email_templates enable row level security;

-- Admin-only manage/view
drop policy if exists "Admins can manage email templates" on public.email_templates;
create policy "Admins can manage email templates"
on public.email_templates
for all
using (public.is_admin())
with check (public.is_admin());

-- 2) Email logs for audit and debugging
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.tournament_registrations(id) on delete cascade not null,
  email_type text not null, -- 'registration_success' | 'payment_pending' | 'test'
  status text not null default 'sent', -- 'sent' | 'failed'
  error text,
  attempt integer not null default 1,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists email_logs_registration_idx
  on public.email_logs(registration_id);

alter table public.email_logs enable row level security;

drop policy if exists "Admins can manage email logs" on public.email_logs;
create policy "Admins can manage email logs"
on public.email_logs
for all
using (public.is_admin())
with check (public.is_admin());

-- 3) Per-tournament email settings (scheduling and toggles)
create table if not exists public.tournament_email_settings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade not null unique,
  send_success_email boolean not null default true,
  send_pending_reminders boolean not null default true,
  reminder_initial_delay_minutes integer not null default 60,
  reminder_repeat_minutes integer not null default 1440,
  reminder_max_count integer not null default 3,
  from_email text,
  reply_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp_tournament_email_settings on public.tournament_email_settings;
create trigger set_timestamp_tournament_email_settings
before update on public.tournament_email_settings
for each row
execute function public.update_updated_at_column();

alter table public.tournament_email_settings enable row level security;

drop policy if exists "Admins can manage email settings" on public.tournament_email_settings;
create policy "Admins can manage email settings"
on public.tournament_email_settings
for all
using (public.is_admin())
with check (public.is_admin());

-- 4) Tracking fields on registrations
alter table public.tournament_registrations
add column if not exists success_email_sent_at timestamptz,
add column if not exists last_reminder_sent_at timestamptz,
add column if not exists reminder_count integer not null default 0;

-- Helpful indexes for reminder scans
create index if not exists tr_payment_status_created_idx
  on public.tournament_registrations(payment_status, created_at);

create index if not exists tr_last_reminder_idx
  on public.tournament_registrations(last_reminder_sent_at);

-- 5) Optional: Seed default templates for all tournaments (global templates where tournament_id is null)
-- You can edit these defaults in the Email Manager UI later or create per-tournament overrides.
insert into public.email_templates (tournament_id, template_key, subject, html, text, from_email, reply_to, enabled)
values
  (null, 'registration_success',
   'Registration Confirmed: {{tournament_name}}',
   '<h2>Thanks for registering, {{participant_name}}!</h2>
    <p>Your registration for <strong>{{tournament_name}}</strong> is confirmed.</p>
    <p><strong>Dates:</strong> {{dates}}<br/>
       <strong>Location:</strong> {{location}}</p>
    <div>{{tournament_info}}</div>
    <p>We look forward to seeing you.</p>',
   'Thanks for registering! Your registration for {{tournament_name}} is confirmed.
Dates: {{dates}}
Location: {{location}}',
   null, null, true)
on conflict do nothing;

insert into public.email_templates (tournament_id, template_key, subject, html, text, from_email, reply_to, enabled)
values
  (null, 'payment_pending',
   'Complete Your Registration: {{tournament_name}}',
   '<h2>Almost there, {{participant_name}}!</h2>
    <p>We noticed you started registering for <strong>{{tournament_name}}</strong> but haven''t completed payment yet.</p>
    <p><strong>Dates:</strong> {{dates}}<br/>
       <strong>Location:</strong> {{location}}</p>
    <p>Please complete your payment to secure your spot.</p>',
   'Finish your registration for {{tournament_name}}.
Dates: {{dates}}
Location: {{location}}',
   null, null, true)
on conflict do nothing;
