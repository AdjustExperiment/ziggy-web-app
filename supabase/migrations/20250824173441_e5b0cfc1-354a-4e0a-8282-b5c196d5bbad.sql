
-- 1) Add numeric region column with constraint
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS region_number smallint;

-- Add a constraint to enforce 1..16 (allow NULLs for unset)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_region_number_range'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_region_number_range
    CHECK (
      region_number IS NULL OR (region_number >= 1 AND region_number <= 16)
    );
  END IF;
END
$$;

-- 2) Backfill when existing region text is already a number 1..16
UPDATE public.profiles
SET region_number = region::smallint
WHERE region ~ '^[0-9]{1,2}$'
  AND (region::int) BETWEEN 1 AND 16
  AND region_number IS NULL;

-- (Optional) You can later drop the old region text column after
-- the UI has fully migrated, but we keep it for compatibility now.
