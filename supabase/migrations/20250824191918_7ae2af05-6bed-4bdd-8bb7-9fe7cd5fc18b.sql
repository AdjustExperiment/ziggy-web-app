
-- 1) Helper: is_admin(uid) based on public.profiles.role
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- 2) Timestamp trigger function to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) Auto-increment page version per page_id
create or replace function public.assign_next_page_version()
returns trigger
language plpgsql
as $$
declare
  next_version int;
begin
  select coalesce(max(version), 0) + 1 into next_version
  from public.site_page_versions
  where page_id = new.page_id;

  new.version = next_version;
  return new;
end;
$$;

-- 4) Tables

-- 4a) Global site settings (theme, typography, nav, footer, SEO defaults)
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  theme jsonb not null default '{}',
  typography jsonb not null default '{}',
  nav jsonb not null default '[]',
  footer jsonb not null default '[]',
  seo_defaults jsonb not null default '{}',
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid null references public.profiles(id) on delete set null,
  unique (name)
);

-- 4b) Pages (draft/published)
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo jsonb not null default '{}',
  canonical_url text null,
  robots_noindex boolean not null default false,
  robots_nofollow boolean not null default false,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  constraint valid_slug check (slug ~ '^/[a-z0-9\\-\\/]+$')
);

-- 4c) Blocks belonging to pages (order by position)
create table if not exists public.site_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  parent_block_id uuid null references public.site_blocks(id) on delete cascade,
  type text not null,
  content jsonb not null default '{}',
  position int not null default 0,
  visible boolean not null default true
);

-- 4d) Version snapshots (immutable)
create table if not exists public.site_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  version int not null,
  snapshot jsonb not null,  -- includes page + blocks + seo
  created_at timestamptz not null default now(),
  created_by uuid null references public.profiles(id) on delete set null,
  unique (page_id, version)
);

-- 4e) AI SEO analyses log
create table if not exists public.ai_seo_analyses (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  model text not null,
  prompt text null,
  analysis jsonb not null,  -- suggestions and scores
  applied boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid null references public.profiles(id) on delete set null
);

-- 5) Indexes
create index if not exists idx_site_pages_slug on public.site_pages(slug);
create index if not exists idx_site_pages_status on public.site_pages(status);
create index if not exists idx_site_blocks_page_position on public.site_blocks(page_id, position);
create index if not exists idx_ai_seo_analyses_page on public.ai_seo_analyses(page_id);

-- 6) Triggers
drop trigger if exists trg_site_pages_updated_at on public.site_pages;
create trigger trg_site_pages_updated_at
before update on public.site_pages
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_assign_page_version on public.site_page_versions;
create trigger trg_assign_page_version
before insert on public.site_page_versions
for each row
execute procedure public.assign_next_page_version();

-- 7) RLS
alter table public.site_settings enable row level security;
alter table public.site_pages enable row level security;
alter table public.site_blocks enable row level security;
alter table public.site_page_versions enable row level security;
alter table public.ai_seo_analyses enable row level security;

-- Admin full access on all builder tables
drop policy if exists "Admins full access - site_settings" on public.site_settings;
create policy "Admins full access - site_settings"
on public.site_settings
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins full access - site_pages" on public.site_pages;
create policy "Admins full access - site_pages"
on public.site_pages
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins full access - site_blocks" on public.site_blocks;
create policy "Admins full access - site_blocks"
on public.site_blocks
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins full access - site_page_versions" on public.site_page_versions;
create policy "Admins full access - site_page_versions"
on public.site_page_versions
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins full access - ai_seo_analyses" on public.ai_seo_analyses;
create policy "Admins full access - ai_seo_analyses"
on public.ai_seo_analyses
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Public read of published content (no auth required)
drop policy if exists "Public can read published settings" on public.site_settings;
create policy "Public can read published settings"
on public.site_settings
for select
using (published = true);

drop policy if exists "Public can read published pages" on public.site_pages;
create policy "Public can read published pages"
on public.site_pages
for select
using (status = 'published');

drop policy if exists "Public can read blocks of published pages" on public.site_blocks;
create policy "Public can read blocks of published pages"
on public.site_blocks
for select
using (
  exists (
    select 1 from public.site_pages p
    where p.id = site_blocks.page_id
      and p.status = 'published'
  )
);

-- No public policies for versions and AI analyses (admin-only)
