
-- 1) schedule_proposals: proposed time/room changes for a pairing
create table if not exists public.schedule_proposals (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  proposer_user_id uuid not null,
  proposed_time timestamptz,
  proposed_room text,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.schedule_proposals enable row level security;

-- Admins manage all
create policy if not exists "Admins can manage schedule proposals"
on public.schedule_proposals
as permissive
for all
to public
using (public.is_admin())
with check (public.is_admin());

-- Users can create proposals for their own pairings
create policy if not exists "Users can create schedule proposals for their pairings"
on public.schedule_proposals
as permissive
for insert
to authenticated
with check (
  auth.uid() = proposer_user_id
  and exists (
    select 1
    from public.pairings p
    join public.tournament_registrations tr_aff on tr_aff.id = p.aff_registration_id
    join public.tournament_registrations tr_neg on tr_neg.id = p.neg_registration_id
    where p.id = schedule_proposals.pairing_id
      and (tr_aff.user_id = auth.uid() or tr_neg.user_id = auth.uid())
  )
);

-- Users can view proposals for their pairings
create policy if not exists "Users can view schedule proposals for their pairings"
on public.schedule_proposals
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.pairings p
    join public.tournament_registrations tr_aff on tr_aff.id = p.aff_registration_id
    join public.tournament_registrations tr_neg on tr_neg.id = p.neg_registration_id
    where p.id = schedule_proposals.pairing_id
      and (tr_aff.user_id = auth.uid() or tr_neg.user_id = auth.uid())
  )
);

-- Trigger to auto-update updated_at
drop trigger if exists trg_schedule_proposals_updated_at on public.schedule_proposals;
create trigger trg_schedule_proposals_updated_at
before update on public.schedule_proposals
for each row
execute procedure public.update_updated_at_column();

-- Helpful indexes
create index if not exists idx_schedule_proposals_pairing on public.schedule_proposals(pairing_id);
create index if not exists idx_schedule_proposals_status on public.schedule_proposals(status);


-- 2) pairing_judge_assignments: optional multi-judge panels
create table if not exists public.pairing_judge_assignments (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  judge_id uuid not null references public.judge_profiles(id) on delete cascade,
  role text not null default 'panel',
  assigned_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pairing_judge_assignments enable row level security;

-- Admins manage all
create policy if not exists "Admins can manage pairing judge assignments"
on public.pairing_judge_assignments
as permissive
for all
to public
using (public.is_admin())
with check (public.is_admin());

-- Judges can view their own assignments
create policy if not exists "Judges can view their own assignments"
on public.pairing_judge_assignments
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.judge_profiles jp
    where jp.id = pairing_judge_assignments.judge_id
      and jp.user_id = auth.uid()
  )
);

-- Trigger to auto-update updated_at
drop trigger if exists trg_pairing_judge_assignments_updated_at on public.pairing_judge_assignments;
create trigger trg_pairing_judge_assignments_updated_at
before update on public.pairing_judge_assignments
for each row
execute procedure public.update_updated_at_column();

-- Helpful indexes
create index if not exists idx_pja_pairing on public.pairing_judge_assignments(pairing_id);
create index if not exists idx_pja_judge on public.pairing_judge_assignments(judge_id);


-- 3) Admin-only procedures to resolve judge requests and schedule proposals

-- Approve or reject a judge request
create or replace function public.admin_resolve_judge_request(
  _request_id uuid,
  _action text,
  _use_panel boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can resolve judge requests';
  end if;

  select * into req
  from public.judge_requests
  where id = _request_id;

  if not found then
    raise exception 'Judge request not found';
  end if;

  if _action = 'approve' then
    if _use_panel then
      insert into public.pairing_judge_assignments (pairing_id, judge_id, role, assigned_by)
      values (req.pairing_id, req.judge_id, 'panel', auth.uid());
    else
      update public.pairings
      set judge_id = req.judge_id,
          updated_at = now()
      where id = req.pairing_id;
    end if;

    update public.judge_requests
    set status = 'approved',
        updated_at = now(),
        admin_response = coalesce(admin_response, 'Approved by admin')
    where id = _request_id;

    return true;
  elsif _action = 'reject' then
    update public.judge_requests
    set status = 'rejected',
        updated_at = now(),
        admin_response = coalesce(admin_response, 'Rejected by admin')
    where id = _request_id;

    return true;
  else
    raise exception 'Unsupported action %', _action;
  end if;
end;
$$;

-- Approve or reject a schedule proposal
create or replace function public.admin_finalize_schedule_proposal(
  _proposal_id uuid,
  _action text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  prop record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can finalize schedule proposals';
  end if;

  select * into prop
  from public.schedule_proposals
  where id = _proposal_id;

  if not found then
    raise exception 'Schedule proposal not found';
  end if;

  if _action = 'approve' then
    update public.pairings
    set scheduled_time = coalesce(prop.proposed_time, scheduled_time),
        room = coalesce(prop.proposed_room, room),
        updated_at = now()
    where id = prop.pairing_id;

    update public.schedule_proposals
    set status = 'approved',
        updated_at = now()
    where id = _proposal_id;

    return true;
  elsif _action = 'reject' then
    update public.schedule_proposals
    set status = 'rejected',
        updated_at = now()
    where id = _proposal_id;

    return true;
  else
    raise exception 'Unsupported action %', _action;
  end if;
end;
$$;

-- 4) Helpful indexes to speed up admin filters (optional but useful)
create index if not exists idx_judge_requests_status on public.judge_requests(status);
create index if not exists idx_pairings_round on public.pairings(tournament_id, round_id);
create index if not exists idx_pairings_judge on public.pairings(judge_id);
create index if not exists idx_pairings_scheduled_time on public.pairings(scheduled_time);
