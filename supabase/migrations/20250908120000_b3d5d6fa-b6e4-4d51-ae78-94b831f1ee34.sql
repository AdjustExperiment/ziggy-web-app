-- Add custom_css to site_pages and create site_page_versions table

alter table if exists public.site_pages
  add column if not exists custom_css text;

create table if not exists public.site_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  version_number integer not null,
  blocks jsonb not null,
  custom_css text,
  created_at timestamp with time zone default now()
);

alter table public.site_page_versions enable row level security;
