-- Migration: add timing_rules and judging_criteria columns to debate_formats
alter table public.debate_formats
  add column if not exists timing_rules jsonb not null default '{}'::jsonb,
  add column if not exists judging_criteria jsonb not null default '{}'::jsonb;

-- Update existing seed data to move any timings from rules if present
update public.debate_formats
set timing_rules = coalesce(rules->'timings', '{}'::jsonb),
    judging_criteria = '{}'::jsonb
where timing_rules = '{}'::jsonb and judging_criteria = '{}'::jsonb;
