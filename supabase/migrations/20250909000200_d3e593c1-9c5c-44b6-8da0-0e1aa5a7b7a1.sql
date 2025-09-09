-- Store previous versions of ballot templates
create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.ballot_templates(id) on delete cascade,
  schema jsonb not null,
  html text,
  created_at timestamptz default now()
);

create index if not exists template_versions_template_id_idx on public.template_versions(template_id);

create or replace function public.log_template_version()
returns trigger as $$
begin
  insert into public.template_versions(template_id, schema, html)
  values (old.id, old.schema, old.html);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_template_version on public.ballot_templates;
create trigger trg_log_template_version
before update on public.ballot_templates
for each row execute function public.log_template_version();
