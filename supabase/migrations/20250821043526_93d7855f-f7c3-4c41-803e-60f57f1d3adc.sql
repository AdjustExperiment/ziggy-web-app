-- Create site_settings table for the webpage editor
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'Tournament Platform',
  site_description TEXT,
  primary_font TEXT NOT NULL DEFAULT 'unbounded',
  secondary_font TEXT NOT NULL DEFAULT 'space-grotesk',
  primary_color TEXT NOT NULL DEFAULT '#dc2626',
  accent_color TEXT NOT NULL DEFAULT '#991b1b',
  dark_mode_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_css TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pages table for content management
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create policies for site_settings
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view published site settings" ON public.site_settings FOR SELECT USING (is_published = true);

-- Create policies for pages
CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view published pages" ON public.pages FOR SELECT USING (is_published = true);

-- Insert default site settings
INSERT INTO public.site_settings (site_title, site_description) 
VALUES ('Tournament Platform', 'Professional debate tournament management platform')
ON CONFLICT DO NOTHING;