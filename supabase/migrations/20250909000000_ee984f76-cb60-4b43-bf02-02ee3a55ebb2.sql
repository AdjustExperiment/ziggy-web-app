-- Migration: add ballot_submissions table and template versioning
-- Adds version and layout columns to ballot_templates
-- Creates template_versions and ballot_submissions tables with basic policies

-- 1. Expand ballot_templates with version and layout fields
alter table public.ballot_templates
  add column if not exists version integer not null default 1,
  add column if not exists layout jsonb not null default '{}'::jsonb;

-- 2. Template versions history
create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.ballot_templates(id) on delete cascade,
  version integer not null,
  schema jsonb not null default '{}'::jsonb,
  html text,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists template_versions_unique_version
on public.template_versions (template_id, version);

alter table public.template_versions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'template_versions' and policyname = 'Anyone can view template_versions'
  ) then
    create policy "Anyone can view template_versions"
      on public.template_versions
      for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'template_versions' and policyname = 'Admins can manage template_versions'
  ) then
    create policy "Admins can manage template_versions"
      on public.template_versions
      for all using (is_admin()) with check (is_admin());
  end if;
end $$;

-- 3. Ballot submissions table
create table if not exists public.ballot_submissions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.ballot_templates(id) on delete cascade,
  template_version integer not null default 1,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.ballot_submissions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ballot_submissions' and policyname = 'Anyone can view ballot_submissions'
  ) then
    create policy "Anyone can view ballot_submissions"
      on public.ballot_submissions
      for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ballot_submissions' and policyname = 'Admins can manage ballot_submissions'
  ) then
    create policy "Admins can manage ballot_submissions"
      on public.ballot_submissions
      for all using (is_admin()) with check (is_admin());
  end if;
end $$;

-- End of migration
