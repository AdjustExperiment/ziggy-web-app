
-- 1) Add "platform partner" fields to sponsor_profiles
alter table public.sponsor_profiles
  add column if not exists is_platform_partner boolean not null default false,
  add column if not exists partnership_notes text;

-- 2) Create and publish a "Sponsors" site page (editable via your Website Builder)
do $$
declare
  v_page_id uuid;
begin
  select id into v_page_id
  from public.site_pages
  where slug = 'sponsors'
  limit 1;

  if v_page_id is null then
    insert into public.site_pages (slug, title, description, status, seo, published_at)
    values (
      'sponsors',
      'Sponsors',
      'Our partners and tournament sponsors',
      'published',
      '{}'::jsonb,
      now()
    )
    returning id into v_page_id;
  end if;

  -- Seed a couple of default content blocks if none exist yet
  if not exists (select 1 from public.site_blocks where page_id = v_page_id) then
    insert into public.site_blocks (page_id, type, position, content, visible)
    values
      (v_page_id, 'heading', 1, jsonb_build_object('level', 'h1', 'text', 'Our Sponsors'), true),
      (v_page_id, 'text', 2, jsonb_build_object('html', '<p>We proudly recognize our platform partners and tournament sponsors.</p>'), true);
  end if;
end $$;
