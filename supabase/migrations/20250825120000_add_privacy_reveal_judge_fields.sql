-- Add privacy level, reveal delay, and judge anonymity to tournaments
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS privacy_level TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS reveal_delay INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS judge_anonymity BOOLEAN NOT NULL DEFAULT false;
