
-- Phase 6 — Multi-judge panels

-- 1) Create pairing_judge_assignments table
create table if not exists public.pairing_judge_assignments (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  judge_profile_id uuid not null references public.judge_profiles(id) on delete cascade,
  role text not null default 'panelist',          -- suggested: 'chair' | 'panelist' | 'shadow' | 'trainee'
  status text not null default 'assigned',        -- suggested: 'assigned' | 'confirmed' | 'declined' | 'removed'
  assigned_by uuid,                               -- auth.users.id of the assigning admin (optional)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pairing_id, judge_profile_id)
);

-- Indexes for performance
create index if not exists idx_pja_pairing_id on public.pairing_judge_assignments (pairing_id);
create index if not exists idx_pja_judge_profile_id on public.pairing_judge_assignments (judge_profile_id);
-- Only one chair per pairing (partial unique index)
do $$
begin
  perform 1
  from pg_indexes 
  where schemaname='public' and indexname='uniq_pja_pairing_chair';
  if not found then
    execute 'create unique index uniq_pja_pairing_chair on public.pairing_judge_assignments (pairing_id) where role = ''chair'' and status <> ''removed''';
  end if;
end $$;

-- 2) RLS
alter table public.pairing_judge_assignments enable row level security;

-- Admins can manage all
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='pairing_judge_assignments' and policyname='Admins can manage panel assignments'
  ) then
    create policy "Admins can manage panel assignments"
      on public.pairing_judge_assignments
      as permissive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- Judges can view their own assignments
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='pairing_judge_assignments' and policyname='Judges can view their own assignments'
  ) then
    create policy "Judges can view their own assignments"
      on public.pairing_judge_assignments
      as permissive
      for select
      using (
        exists (
          select 1
          from public.judge_profiles jp
          where jp.id = pairing_judge_assignments.judge_profile_id
            and jp.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Judges can update status of their own assignments
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='pairing_judge_assignments' and policyname='Judges can update own assignment status'
  ) then
    create policy "Judges can update own assignment status"
      on public.pairing_judge_assignments
      as permissive
      for update
      using (
        exists (
          select 1
          from public.judge_profiles jp
          where jp.id = pairing_judge_assignments.judge_profile_id
            and jp.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.judge_profiles jp
          where jp.id = pairing_judge_assignments.judge_profile_id
            and jp.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Optional: lightweight guard to restrict non-admin updates to the status and notes only
-- This is best-effort; app should also restrict fields.
create or replace function public.guard_pja_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if (new.pairing_id is distinct from old.pairing_id)
       or (new.judge_profile_id is distinct from old.judge_profile_id)
       or (new.role is distinct from old.role)
       or (new.assigned_by is distinct from old.assigned_by) then
      raise exception 'Only admins can change assignment structure (pairing/judge/role/assigned_by)';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_pja_updates on public.pairing_judge_assignments;
create trigger trg_guard_pja_updates
before update on public.pairing_judge_assignments
for each row execute function public.guard_pja_updates();

-- Updated_at trigger
drop trigger if exists pairing_judge_assignments_set_updated_at on public.pairing_judge_assignments;
create trigger pairing_judge_assignments_set_updated_at
before update on public.pairing_judge_assignments
for each row execute function public.update_updated_at_column();

-- 3) Keep pairings.judge_id in sync with the chair assignment (backward compatibility)
create or replace function public.sync_primary_judge_from_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_chair uuid;
begin
  -- Only act when the affected row is for a 'chair' or when deleting a chair row
  if (tg_op in ('INSERT','UPDATE') and new.role = 'chair') or (tg_op = 'DELETE' and old.role = 'chair') then
    select judge_profile_id
    into current_chair
    from public.pairing_judge_assignments
    where pairing_id = coalesce(new.pairing_id, old.pairing_id)
      and role = 'chair'
      and status <> 'removed'
    order by created_at asc
    limit 1;

    update public.pairings
    set judge_id = current_chair,
        updated_at = now()
    where id = coalesce(new.pairing_id, old.pairing_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_primary_judge_from_assignments_ins on public.pairing_judge_assignments;
drop trigger if exists trg_sync_primary_judge_from_assignments_upd on public.pairing_judge_assignments;
drop trigger if exists trg_sync_primary_judge_from_assignments_del on public.pairing_judge_assignments;

create trigger trg_sync_primary_judge_from_assignments_ins
after insert on public.pairing_judge_assignments
for each row execute function public.sync_primary_judge_from_assignments();

create trigger trg_sync_primary_judge_from_assignments_upd
after update on public.pairing_judge_assignments
for each row execute function public.sync_primary_judge_from_assignments();

create trigger trg_sync_primary_judge_from_assignments_del
after delete on public.pairing_judge_assignments
for each row execute function public.sync_primary_judge_from_assignments();

-- 4) Notifications: notify judges on new assignments and on status changes
create or replace function public.generate_panel_assignment_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- New assignment
    insert into public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
    select
      new.judge_profile_id,
      p.id,
      p.tournament_id,
      'New Panel Assignment',
      'You have been assigned to a panel (' || new.role || ').',
      'judge_assigned'
    from public.pairings p
    where p.id = new.pairing_id;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
    select
      new.judge_profile_id,
      p.id,
      p.tournament_id,
      'Assignment Status Updated',
      'Your assignment status is now: ' || new.status || '.',
      'judge_assignment_status'
    from public.pairings p
    where p.id = new.pairing_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_panel_assignment_notifications on public.pairing_judge_assignments;
create trigger trg_panel_assignment_notifications
after insert or update on public.pairing_judge_assignments
for each row execute function public.generate_panel_assignment_notifications();

-- 5) Supabase Realtime
alter table public.pairing_judge_assignments replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.pairing_judge_assignments;
exception when duplicate_object then null; end $$;

-- 6) Update can_submit_ballot to allow any assigned judge to submit
create or replace function public.can_submit_ballot(_pairing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists(
    -- Backward compatibility: single judge on pairings
    select 1
    from public.pairings p
    join public.judge_profiles jp on p.judge_id = jp.id
    where p.id = _pairing_id
      and jp.user_id = auth.uid()
  )
  or exists(
    -- Multi-judge: any assigned or confirmed judge for this pairing
    select 1
    from public.pairing_judge_assignments a
    join public.judge_profiles jp on jp.id = a.judge_profile_id
    where a.pairing_id = _pairing_id
      and a.status in ('assigned','confirmed')
      and jp.user_id = auth.uid()
  );
$function$;
