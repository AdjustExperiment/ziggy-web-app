
-- Phase 5 — Realtime + notifications

-- 1) Create schedule_proposals table (matching current code expectations)
create table if not exists public.schedule_proposals (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  proposer_user_id uuid not null,
  proposed_time timestamptz,
  proposed_room text,
  note text,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.schedule_proposals enable row level security;

-- RLS: Admins can manage all
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'schedule_proposals' 
      and policyname = 'Admins can manage schedule proposals'
  ) then
    create policy "Admins can manage schedule proposals"
      on public.schedule_proposals
      as permissive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- RLS: Competitors can create proposals for their pairings
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'schedule_proposals' 
      and policyname = 'Users can create proposals for their pairings'
  ) then
    create policy "Users can create proposals for their pairings"
      on public.schedule_proposals
      as permissive
      for insert
      with check (
        proposer_user_id = auth.uid() and exists (
          select 1
          from public.pairings p
          join public.tournament_registrations tr_aff on tr_aff.id = p.aff_registration_id
          join public.tournament_registrations tr_neg on tr_neg.id = p.neg_registration_id
          where p.id = schedule_proposals.pairing_id
            and (tr_aff.user_id = auth.uid() or tr_neg.user_id = auth.uid())
        )
      );
  end if;
end $$;

-- RLS: Competitors can view proposals for their pairings
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'schedule_proposals' 
      and policyname = 'Users can view proposals for their pairings'
  ) then
    create policy "Users can view proposals for their pairings"
      on public.schedule_proposals
      as permissive
      for select
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
  end if;
end $$;

-- Only admins can update/delete proposals (implicit via the admin policy above)

-- Updated_at trigger
drop trigger if exists schedule_proposals_set_updated_at on public.schedule_proposals;
create trigger schedule_proposals_set_updated_at
before update on public.schedule_proposals
for each row execute function public.update_updated_at_column();

-- 2) Enable Supabase Realtime on the requested tables (+ judge_notifications)
-- Make sure complete row data is available
alter table public.pairing_messages replica identity full;
alter table public.judge_requests replica identity full;
alter table public.schedule_proposals replica identity full;
alter table public.judge_notifications replica identity full;

-- Add to the supabase_realtime publication (idempotent)
do $$ begin
  alter publication supabase_realtime add table public.pairing_messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.judge_requests;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.schedule_proposals;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.judge_notifications;
exception when duplicate_object then null; end $$;

-- 3) Notifications: generate judge notifications via triggers

-- When a judge is assigned or changed on a pairing, notify the judge
create or replace function public.generate_judge_assignment_notification()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if tg_op = 'UPDATE' and new.judge_id is not null and (old.judge_id is distinct from new.judge_id) then
    insert into public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
    values (
      new.judge_id,
      new.id,
      new.tournament_id,
      'New Judging Assignment',
      'You have been assigned to judge a round.',
      'judge_assigned'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists judge_assignment_notification on public.pairings;
create trigger judge_assignment_notification
after update of judge_id on public.pairings
for each row execute function public.generate_judge_assignment_notification();

-- When a schedule proposal is approved, notify the assigned judge (if any)
create or replace function public.generate_schedule_approval_notifications()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  jpid uuid;
begin
  if tg_op = 'UPDATE' and new.status = 'approved' and (old.status is distinct from new.status) then
    select p.judge_id into jpid
    from public.pairings p
    where p.id = new.pairing_id;

    if jpid is not null then
      insert into public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
      select 
        jpid,
        p.id,
        p.tournament_id,
        'Schedule Approved',
        'The schedule proposal has been approved.',
        'schedule_approved'
      from public.pairings p
      where p.id = new.pairing_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists schedule_proposal_approval_notify on public.schedule_proposals;
create trigger schedule_proposal_approval_notify
after update of status on public.schedule_proposals
for each row execute function public.generate_schedule_approval_notifications();
