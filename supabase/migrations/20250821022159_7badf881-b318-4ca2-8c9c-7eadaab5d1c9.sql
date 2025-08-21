
-- 1) Add new tournament fields for rich info and prize classification
DO $$
BEGIN
  -- Rich "Tournament Information" HTML
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'tournament_info'
  ) THEN
    ALTER TABLE public.tournaments
      ADD COLUMN tournament_info text;
  END IF;

  -- Numeric cash prize total
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'cash_prize_total'
  ) THEN
    ALTER TABLE public.tournaments
      ADD COLUMN cash_prize_total numeric DEFAULT 0;
  END IF;

  -- Bullet list of in-kind/service items
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'prize_items'
  ) THEN
    ALTER TABLE public.tournaments
      ADD COLUMN prize_items text[] DEFAULT '{}'::text[];
  END IF;
END
$$;

-- 2) Create a public storage bucket for sponsor logos (public read; admin write)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'sponsor-logos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('sponsor-logos', 'sponsor-logos', true);
  END IF;
END
$$;

-- 3) RLS policies for sponsor logo files in storage.objects
-- Public read (so logos render on the public site)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read sponsor logos'
  ) THEN
    CREATE POLICY "Public can read sponsor logos"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'sponsor-logos');
  END IF;
END
$$;

-- Admins can upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can upload sponsor logos'
  ) THEN
    CREATE POLICY "Admins can upload sponsor logos"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'sponsor-logos' AND public.is_admin());
  END IF;
END
$$;

-- Admins can update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can update sponsor logos'
  ) THEN
    CREATE POLICY "Admins can update sponsor logos"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'sponsor-logos' AND public.is_admin())
      WITH CHECK (bucket_id = 'sponsor-logos' AND public.is_admin());
  END IF;
END
$$;

-- Admins can delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete sponsor logos'
  ) THEN
    CREATE POLICY "Admins can delete sponsor logos"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'sponsor-logos' AND public.is_admin());
  END IF;
END
$$;
