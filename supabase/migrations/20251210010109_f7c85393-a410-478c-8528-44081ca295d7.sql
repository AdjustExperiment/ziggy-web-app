-- Add 'sponsor' to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sponsor';

-- Enhance sponsor_profiles table with approval and blog tracking columns
ALTER TABLE sponsor_profiles 
ADD COLUMN IF NOT EXISTS approved_tier text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blog_posts_limit integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS blog_posts_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Add sponsor_id to blog_posts table for sponsor-authored posts
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS sponsor_id uuid REFERENCES sponsor_profiles(id);

-- Create sponsor_tier_settings table for global admin control
CREATE TABLE IF NOT EXISTS sponsor_tier_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text UNIQUE NOT NULL,
  blog_posts_limit integer NOT NULL DEFAULT 0,
  display_priority integer NOT NULL DEFAULT 0,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on sponsor_tier_settings
ALTER TABLE sponsor_tier_settings ENABLE ROW LEVEL SECURITY;

-- Insert default tiers
INSERT INTO sponsor_tier_settings (tier, blog_posts_limit, display_priority, features) VALUES
  ('bronze', 1, 4, '{"show_logo": true, "show_description": false, "featured_badge": false, "highlighted": false}'::jsonb),
  ('silver', 3, 3, '{"show_logo": true, "show_description": true, "featured_badge": false, "highlighted": false}'::jsonb),
  ('gold', 6, 2, '{"show_logo": true, "show_description": true, "featured_badge": true, "highlighted": false}'::jsonb),
  ('platinum', 12, 1, '{"show_logo": true, "show_description": true, "featured_badge": true, "highlighted": true}'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- RLS policies for sponsor_tier_settings
CREATE POLICY "Anyone can view sponsor tier settings"
ON sponsor_tier_settings FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage sponsor tier settings"
ON sponsor_tier_settings FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create helper function for approved sponsor check
CREATE OR REPLACE FUNCTION public.is_approved_sponsor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sponsor_profiles
    WHERE user_id = auth.uid()
    AND is_approved = true
  );
$$;

-- Create function to get sponsor's blog post quota
CREATE OR REPLACE FUNCTION public.get_sponsor_blog_quota(_user_id uuid)
RETURNS TABLE(posts_limit integer, posts_used integer, posts_remaining integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.blog_posts_limit,
    sp.blog_posts_used,
    (sp.blog_posts_limit - sp.blog_posts_used) as posts_remaining
  FROM sponsor_profiles sp
  WHERE sp.user_id = _user_id
  AND sp.is_approved = true
  LIMIT 1;
$$;

-- RLS policy: Allow approved sponsors to create blog posts (within quota)
CREATE POLICY "Approved sponsors can create own blog posts"
ON blog_posts FOR INSERT
WITH CHECK (
  sponsor_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM sponsor_profiles sp
    WHERE sp.id = blog_posts.sponsor_id
    AND sp.user_id = auth.uid()
    AND sp.is_approved = true
    AND sp.blog_posts_used < sp.blog_posts_limit
  )
);

-- RLS policy: Allow sponsors to update their own draft posts
CREATE POLICY "Sponsors can update own draft posts"
ON blog_posts FOR UPDATE
USING (
  sponsor_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM sponsor_profiles sp
    WHERE sp.id = blog_posts.sponsor_id
    AND sp.user_id = auth.uid()
  )
  AND status = 'draft'
)
WITH CHECK (
  sponsor_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM sponsor_profiles sp
    WHERE sp.id = blog_posts.sponsor_id
    AND sp.user_id = auth.uid()
  )
);

-- RLS policy: Allow sponsors to view their own posts
CREATE POLICY "Sponsors can view own blog posts"
ON blog_posts FOR SELECT
USING (
  sponsor_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM sponsor_profiles sp
    WHERE sp.id = blog_posts.sponsor_id
    AND sp.user_id = auth.uid()
  )
);

-- Trigger function to sync sponsor approval and increment blog post count
CREATE OR REPLACE FUNCTION sync_sponsor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tier_limit integer;
  sponsor_user_id uuid;
BEGIN
  -- When a sponsor application is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get blog post limit from tier settings
    SELECT blog_posts_limit INTO tier_limit
    FROM public.sponsor_tier_settings
    WHERE tier = NEW.tier;
    
    -- Update sponsor profile with approval status
    UPDATE public.sponsor_profiles SET
      is_approved = true,
      approved_tier = NEW.tier,
      blog_posts_limit = COALESCE(tier_limit, 0),
      approved_at = now(),
      approved_by = NEW.approved_by
    WHERE id = NEW.sponsor_profile_id
    RETURNING user_id INTO sponsor_user_id;
    
    -- Add sponsor role to user_roles if user_id exists
    IF sponsor_user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (sponsor_user_id, 'sponsor')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  -- When sponsor is rejected/withdrawn, check if they have other approved apps
  IF NEW.status IN ('rejected', 'withdrawn') AND OLD.status = 'approved' THEN
    -- Check if sponsor has any other approved applications
    IF NOT EXISTS (
      SELECT 1 FROM public.sponsor_applications 
      WHERE sponsor_profile_id = NEW.sponsor_profile_id 
      AND status = 'approved'
      AND id != NEW.id
    ) THEN
      UPDATE public.sponsor_profiles SET
        is_approved = false,
        approved_tier = NULL
      WHERE id = NEW.sponsor_profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for sponsor application status changes
DROP TRIGGER IF EXISTS on_sponsor_application_status_change ON sponsor_applications;
CREATE TRIGGER on_sponsor_application_status_change
AFTER UPDATE ON sponsor_applications
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_sponsor_approval();

-- Also trigger on insert for new approved applications
DROP TRIGGER IF EXISTS on_sponsor_application_insert ON sponsor_applications;
CREATE TRIGGER on_sponsor_application_insert
AFTER INSERT ON sponsor_applications
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION sync_sponsor_approval();

-- Function to increment blog posts used count
CREATE OR REPLACE FUNCTION increment_sponsor_blog_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.sponsor_id IS NOT NULL THEN
    UPDATE public.sponsor_profiles
    SET blog_posts_used = blog_posts_used + 1
    WHERE id = NEW.sponsor_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to increment blog post count on insert
DROP TRIGGER IF EXISTS on_sponsor_blog_post_insert ON blog_posts;
CREATE TRIGGER on_sponsor_blog_post_insert
AFTER INSERT ON blog_posts
FOR EACH ROW
WHEN (NEW.sponsor_id IS NOT NULL)
EXECUTE FUNCTION increment_sponsor_blog_posts();

-- Function to decrement blog posts used count on delete
CREATE OR REPLACE FUNCTION decrement_sponsor_blog_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.sponsor_id IS NOT NULL THEN
    UPDATE public.sponsor_profiles
    SET blog_posts_used = GREATEST(0, blog_posts_used - 1)
    WHERE id = OLD.sponsor_id;
  END IF;
  RETURN OLD;
END;
$$;

-- Trigger to decrement blog post count on delete
DROP TRIGGER IF EXISTS on_sponsor_blog_post_delete ON blog_posts;
CREATE TRIGGER on_sponsor_blog_post_delete
AFTER DELETE ON blog_posts
FOR EACH ROW
WHEN (OLD.sponsor_id IS NOT NULL)
EXECUTE FUNCTION decrement_sponsor_blog_posts();