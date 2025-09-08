
-- 1) Sponsor profiles: one profile per user
create table if not exists public.sponsor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  logo_url text,
  description text,
  website text,
  resources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.sponsor_profiles enable row level security;

-- RLS: Admins manage all
create policy "Admins can manage sponsor profiles"
on public.sponsor_profiles
as restrictive
for all
using (is_admin())
with check (is_admin());

-- RLS: Owners manage their own
create policy "Owners can manage their sponsor profile"
on public.sponsor_profiles
as restrictive
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Updated_at trigger
create trigger sponsor_profiles_set_updated_at
before update on public.sponsor_profiles
for each row execute function public.update_updated_at_column();


-- 2) Sponsor applications
create table if not exists public.sponsor_applications (
  id uuid primary key default gen_random_uuid(),
  sponsor_profile_id uuid not null references public.sponsor_profiles(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  tier text not null check (tier in ('bronze','silver','gold','platinum')),
  offerings text,
  requests text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sponsor_profile_id, tournament_id)
);

alter table public.sponsor_applications enable row level security;

-- RLS: Admins manage everything
create policy "Admins can manage sponsor applications"
on public.sponsor_applications
as restrictive
for all
using (is_admin())
with check (is_admin());

-- RLS: Owners can insert their own application
create policy "Owners can insert own sponsor applications"
on public.sponsor_applications
as restrictive
for insert
with check (
  exists (
    select 1 from public.sponsor_profiles sp
    where sp.id = sponsor_applications.sponsor_profile_id
      and sp.user_id = auth.uid()
  )
);

-- RLS: Owners can view their applications
create policy "Owners can view own sponsor applications"
on public.sponsor_applications
as restrictive
for select
using (
  exists (
    select 1 from public.sponsor_profiles sp
    where sp.id = sponsor_applications.sponsor_profile_id
      and sp.user_id = auth.uid()
  )
);

-- RLS: Owners can update/delete while pending
create policy "Owners can update pending sponsor applications"
on public.sponsor_applications
as restrictive
for update
using (
  exists (
    select 1 from public.sponsor_profiles sp
    where sp.id = sponsor_applications.sponsor_profile_id
      and sp.user_id = auth.uid()
  )
  and status = 'pending'
)
with check (
  exists (
    select 1 from public.sponsor_profiles sp
    where sp.id = sponsor_applications.sponsor_profile_id
      and sp.user_id = auth.uid()
  )
);

create policy "Owners can delete pending sponsor applications"
on public.sponsor_applications
as restrictive
for delete
using (
  exists (
    select 1 from public.sponsor_profiles sp
    where sp.id = sponsor_applications.sponsor_profile_id
      and sp.user_id = auth.uid()
  )
  and status = 'pending'
);

-- Updated_at trigger
create trigger sponsor_applications_set_updated_at
before update on public.sponsor_applications
for each row execute function public.update_updated_at_column();


-- 3) Sync approved applications to tournament_content.sponsors
-- Map bronze/silver/gold/platinum to existing display tiers
create or replace function public.map_sponsor_tier_for_display(_tier text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case lower(_tier)
    when 'bronze' then 'supporting'
    when 'silver' then 'major'
    when 'gold' then 'presenting'
    when 'platinum' then 'title'
    else 'supporting'
  end;
$$;

create or replace function public.sync_approved_sponsor_to_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_tournament_content_id uuid;
  v_name text;
  v_logo text;
  v_website text;
  v_display_tier text;
begin
  -- Only act when status transitions to approved or a new row is inserted as approved
  if (tg_op = 'UPDATE' and new.status = 'approved' and old.status is distinct from 'approved')
     or (tg_op = 'INSERT' and new.status = 'approved') then

    -- Fetch sponsor profile info
    select sp.name, sp.logo_url, sp.website
      into v_name, v_logo, v_website
    from public.sponsor_profiles sp
    where sp.id = new.sponsor_profile_id;

    v_display_tier := public.map_sponsor_tier_for_display(new.tier);

    -- Ensure tournament_content exists
    select id into v_tournament_content_id
    from public.tournament_content
    where tournament_id = new.tournament_id
    limit 1;

    if v_tournament_content_id is null then
      insert into public.tournament_content (tournament_id, sponsors)
      values (new.tournament_id, jsonb_build_array(jsonb_build_object(
        'name', v_name,
        'logo_url', v_logo,
        'website', v_website,
        'tier', v_display_tier
      )));
    else
      -- Replace any existing entry for the same sponsor name, then append current details
      update public.tournament_content tc
      set sponsors = (
        coalesce(
          (select jsonb_agg(e)
             from jsonb_array_elements(coalesce(tc.sponsors, '[]'::jsonb)) as e
            where e->>'name' is distinct from v_name),
          '[]'::jsonb
        ) || jsonb_build_array(jsonb_build_object(
          'name', v_name,
          'logo_url', v_logo,
          'website', v_website,
          'tier', v_display_tier
        )),
          updated_at = now()
      )
      where tc.id = v_tournament_content_id;
    end if;
  end if;

  -- If an approved application becomes rejected/withdrawn, remove from sponsors list
  if tg_op = 'UPDATE' and old.status = 'approved' and new.status in ('rejected','withdrawn') then
    select id into v_tournament_content_id
    from public.tournament_content
    where tournament_id = new.tournament_id
    limit 1;

    if v_tournament_content_id is not null then
      select sp.name into v_name
      from public.sponsor_profiles sp
      where sp.id = new.sponsor_profile_id;

      update public.tournament_content tc
      set sponsors = (
        coalesce(
          (select jsonb_agg(e)
             from jsonb_array_elements(coalesce(tc.sponsors, '[]'::jsonb)) as e
            where e->>'name' is distinct from v_name),
          '[]'::jsonb
        ),
          updated_at = now()
      )
      where tc.id = v_tournament_content_id;
    end if;
  end if;

  return new;
end;
$func$;

drop trigger if exists trg_sync_approved_sponsor_to_content on public.sponsor_applications;

create trigger trg_sync_approved_sponsor_to_content
after insert or update of status on public.sponsor_applications
for each row execute function public.sync_approved_sponsor_to_content();

