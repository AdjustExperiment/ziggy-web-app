
-- 1) Create site_pages -------------------------------------------------------
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text null,
  status text not null default 'draft',
  seo jsonb not null default '{}'::jsonb,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;

-- Admins can do anything on site_pages
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_pages' and policyname = 'Admins can manage site pages'
  ) then
    create policy "Admins can manage site pages"
      on public.site_pages
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- Anyone can view published site pages
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_pages' and policyname = 'Anyone can view published site pages'
  ) then
    create policy "Anyone can view published site pages"
      on public.site_pages
      for select
      using (status = 'published');
  end if;
end$$;

-- updated_at trigger for site_pages
do $$
begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'set_timestamp_site_pages'
  ) then
    create trigger set_timestamp_site_pages
      before update on public.site_pages
      for each row
      execute function public.update_updated_at_column();
  end if;
end$$;

-- 2) Create site_blocks ------------------------------------------------------
create table if not exists public.site_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  type text not null,
  content jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  parent_block_id uuid null references public.site_blocks(id) on delete set null,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_blocks_page_pos_idx on public.site_blocks(page_id, position);

alter table public.site_blocks enable row level security;

-- Admins can do anything on site_blocks
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_blocks' and policyname = 'Admins can manage site blocks'
  ) then
    create policy "Admins can manage site blocks"
      on public.site_blocks
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- Anyone can view blocks of published pages (and visible=true)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_blocks' and policyname = 'Anyone can view blocks for published pages'
  ) then
    create policy "Anyone can view blocks for published pages"
      on public.site_blocks
      for select
      using (
        visible = true
        and exists (
          select 1 from public.site_pages p
          where p.id = site_blocks.page_id
            and p.status = 'published'
        )
      );
  end if;
end$$;

-- updated_at trigger for site_blocks
do $$
begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'set_timestamp_site_blocks'
  ) then
    create trigger set_timestamp_site_blocks
      before update on public.site_blocks
      for each row
      execute function public.update_updated_at_column();
  end if;
end$$;

-- 3) Create site_page_versions ----------------------------------------------
create table if not exists public.site_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.site_page_versions enable row level security;

-- Admins can do anything on site_page_versions
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_page_versions' and policyname = 'Admins can manage site page versions'
  ) then
    create policy "Admins can manage site page versions"
      on public.site_page_versions
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;
