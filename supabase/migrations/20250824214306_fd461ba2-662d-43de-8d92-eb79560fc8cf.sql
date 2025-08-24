
-- 1) Add lock fields to profiles (idempotent)
alter table public.profiles
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_until timestamptz null,
  add column if not exists lock_reason text null,
  add column if not exists locked_by_user_id uuid null;

create index if not exists idx_profiles_is_locked on public.profiles (is_locked);
create index if not exists idx_profiles_locked_until on public.profiles (locked_until);

-- 2) Helper: is_account_locked(user) for future use in RLS or app checks
create or replace function public.is_account_locked(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = _user_id
      and (
        p.is_locked = true
        or (p.locked_until is not null and p.locked_until > now())
      )
  );
$$;

-- 3) Audit logs to track actions
create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  ip text,
  user_agent text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.security_audit_logs enable row level security;

-- Admins can manage all logs
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'security_audit_logs'
      and policyname = 'Admins can manage audit logs'
  ) then
    create policy "Admins can manage audit logs"
      on public.security_audit_logs
      as permissive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- Users can write their own logs (optional but useful)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'security_audit_logs'
      and policyname = 'Users can insert their own audit logs'
  ) then
    create policy "Users can insert their own audit logs"
      on public.security_audit_logs
      as permissive
      for insert
      with check (auth.uid() is not null and user_id = auth.uid());
  end if;
end $$;

-- Users can read their own logs (optional)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'security_audit_logs'
      and policyname = 'Users can view their own audit logs'
  ) then
    create policy "Users can view their own audit logs"
      on public.security_audit_logs
      as permissive
      for select
      using (user_id = auth.uid());
  end if;
end $$;

create index if not exists idx_security_audit_logs_user_id on public.security_audit_logs (user_id);
create index if not exists idx_security_audit_logs_created_at on public.security_audit_logs (created_at);

-- 4) Security flags for messages/actions/suspicious activity
create table if not exists public.security_flags (
  id uuid primary key default gen_random_uuid(),
  -- 'message' | 'action' | 'suspicious'
  type text not null,
  -- 'open' | 'reviewing' | 'resolved' | 'dismissed'
  status text not null default 'open',
  -- 'low' | 'medium' | 'high' | 'critical'
  severity text not null default 'medium',
  -- optional link to where it originated
  source_table text,
  source_id uuid,
  -- the user who is associated with the flagged item (actor)
  related_user_id uuid,
  -- the user who raised the flag
  raised_by_user_id uuid,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid,
  resolution_note text
);

alter table public.security_flags enable row level security;

-- Admins can manage all flags
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'security_flags'
      and policyname = 'Admins can manage flags'
  ) then
    create policy "Admins can manage flags"
      on public.security_flags
      as permissive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- Authenticated users can create flags for transparency (optional)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'security_flags'
      and policyname = 'Users can create flags'
  ) then
    create policy "Users can create flags"
      on public.security_flags
      as permissive
      for insert
      with check (auth.uid() is not null and (raised_by_user_id = auth.uid()));
  end if;
end $$;

-- Indexes for fast filtering
create index if not exists idx_security_flags_status on public.security_flags (status);
create index if not exists idx_security_flags_type on public.security_flags (type);
create index if not exists idx_security_flags_severity on public.security_flags (severity);
create index if not exists idx_security_flags_related_user on public.security_flags (related_user_id);
create index if not exists idx_security_flags_created_at on public.security_flags (created_at);

-- 5) Trigger to auto-log account lock/unlock events
create or replace function public.log_profile_lock_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  action_name text;
  actor uuid := auth.uid();
begin
  if (new.is_locked is distinct from old.is_locked)
     or (coalesce(new.locked_until, to_timestamp(0)) is distinct from coalesce(old.locked_until, to_timestamp(0)))
  then
    if (new.is_locked = true) or (new.locked_until is not null and new.locked_until > now()) then
      action_name := 'account_locked';
    else
      action_name := 'account_unlocked';
    end if;

    insert into public.security_audit_logs (user_id, action, ip, user_agent, context)
    values (
      new.user_id,
      action_name,
      null,
      null,
      jsonb_build_object(
        'locked_until', new.locked_until,
        'lock_reason', new.lock_reason,
        'locked_by_user_id', coalesce(new.locked_by_user_id, actor)
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_profile_lock_changes on public.profiles;
create trigger trg_log_profile_lock_changes
after update of is_locked, locked_until, lock_reason, locked_by_user_id on public.profiles
for each row execute function public.log_profile_lock_changes();

-- 6) Helper functions to lock/unlock accounts from the app (optional, admin-only)
create or replace function public.lock_account(_target_user_id uuid, _until timestamptz default null, _reason text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can lock accounts';
  end if;

  update public.profiles
     set is_locked = true,
         locked_until = _until,
         lock_reason = _reason,
         locked_by_user_id = auth.uid(),
         updated_at = now()
   where user_id = _target_user_id;

  if not found then
    raise exception 'Profile not found for user %', _target_user_id;
  end if;

  return true;
end;
$$;

create or replace function public.unlock_account(_target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can unlock accounts';
  end if;

  update public.profiles
     set is_locked = false,
         locked_until = null,
         lock_reason = null,
         locked_by_user_id = auth.uid(),
         updated_at = now()
   where user_id = _target_user_id;

  if not found then
    raise exception 'Profile not found for user %', _target_user_id;
  end if;

  return true;
end;
$$;
