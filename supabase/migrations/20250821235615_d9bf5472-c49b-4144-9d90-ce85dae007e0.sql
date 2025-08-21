-- Temporarily remove the judge_profiles_public view to test if it's causing the linter issue
-- We'll assess if we actually need this view or can work without it

DROP VIEW IF EXISTS public.judge_profiles_public;

-- Remove any permissions we granted to the view
-- (No need to revoke since the view is dropped)