-- 1. Add session_id column to user_interaction_logs if not exists
ALTER TABLE public.user_interaction_logs 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 2. Create global_role_access table for platform-wide role permissions
CREATE TABLE IF NOT EXISTS public.global_role_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL UNIQUE,
  can_view_pairings BOOLEAN NOT NULL DEFAULT false,
  can_view_rooms BOOLEAN NOT NULL DEFAULT false,
  can_view_stream BOOLEAN NOT NULL DEFAULT true,
  can_chat BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on global_role_access
ALTER TABLE public.global_role_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for global_role_access (ignore if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'global_role_access' AND policyname = 'Anyone can view global role access'
  ) THEN
    CREATE POLICY "Anyone can view global role access" 
    ON public.global_role_access 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'global_role_access' AND policyname = 'Admins can manage global role access'
  ) THEN
    CREATE POLICY "Admins can manage global role access" 
    ON public.global_role_access 
    FOR ALL 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Seed default role permissions
INSERT INTO public.global_role_access (role, can_view_pairings, can_view_rooms, can_view_stream, can_chat)
VALUES 
  ('admin', true, true, true, true),
  ('judge', true, true, true, true),
  ('participant', true, false, true, true),
  ('observer', false, false, true, false),
  ('user', false, false, true, false)
ON CONFLICT (role) DO NOTHING;

-- Create trigger for updated_at on global_role_access (ignore if exists)
DROP TRIGGER IF EXISTS update_global_role_access_updated_at ON public.global_role_access;
CREATE TRIGGER update_global_role_access_updated_at
BEFORE UPDATE ON public.global_role_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();