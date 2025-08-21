
-- 1) Link registrations to a requested judge profile
alter table public.tournament_registrations
  add column if not exists requested_judge_profile_id uuid
    references public.judge_profiles(id) on delete set null;

create index if not exists idx_tournament_registrations_requested_judge_profile_id
  on public.tournament_registrations (requested_judge_profile_id);

-- 2) Notify judge when they're requested (inserts a row into judge_notifications)
create or replace function public.notify_requested_judge()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  t_name text;
begin
  if (tg_op = 'INSERT' and new.requested_judge_profile_id is not null)
     or (tg_op = 'UPDATE' and new.requested_judge_profile_id is distinct from old.requested_judge_profile_id and new.requested_judge_profile_id is not null)
  then
    select name into t_name
    from public.tournaments
    where id = new.tournament_id;

    insert into public.judge_notifications (judge_profile_id, pairing_id, tournament_id, title, message, type)
    values (
      new.requested_judge_profile_id,
      null,
      new.tournament_id,
      'Judge Requested',
      coalesce(new.participant_name, 'A competitor') || ' has requested you to judge ' || coalesce(t_name, 'a tournament') || '. Please update your availability.',
      'judge_requested'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_requested_judge on public.tournament_registrations;

create trigger trg_notify_requested_judge
after insert or update of requested_judge_profile_id on public.tournament_registrations
for each row execute function public.notify_requested_judge();
