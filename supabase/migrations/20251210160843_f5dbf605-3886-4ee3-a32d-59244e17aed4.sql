-- Phase 1: Create performance_metrics table for RUM (Real User Monitoring)
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  route TEXT NOT NULL,
  fcp NUMERIC,
  lcp NUMERIC,
  cls NUMERIC,
  ttfb NUMERIC,
  fid NUMERIC,
  inp NUMERIC,
  device_type TEXT,
  connection_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Public insert (anonymous metrics collection)
CREATE POLICY "Anyone can insert performance metrics"
ON public.performance_metrics FOR INSERT
WITH CHECK (true);

-- Admins can view all metrics
CREATE POLICY "Admins can view all performance metrics"
ON public.performance_metrics FOR SELECT
USING (public.is_admin());

-- Create index for route-based queries
CREATE INDEX idx_performance_metrics_route ON public.performance_metrics(route);
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at);

-- Phase 1: Create user_interaction_logs table for UX Heatmap
CREATE TABLE public.user_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  route TEXT NOT NULL,
  device TEXT,
  load_time_ms INTEGER,
  user_role TEXT,
  interaction_count INTEGER DEFAULT 0,
  scroll_depth INTEGER,
  time_on_page_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_interaction_logs ENABLE ROW LEVEL SECURITY;

-- Public insert (anonymous logging)
CREATE POLICY "Anyone can insert interaction logs"
ON public.user_interaction_logs FOR INSERT
WITH CHECK (true);

-- Admins can view all logs
CREATE POLICY "Admins can view all interaction logs"
ON public.user_interaction_logs FOR SELECT
USING (public.is_admin());

-- Create indexes
CREATE INDEX idx_interaction_logs_route ON public.user_interaction_logs(route);
CREATE INDEX idx_interaction_logs_created_at ON public.user_interaction_logs(created_at);

-- Phase 1: Create global_settings table
CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT DEFAULT 'general',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view global settings"
ON public.global_settings FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage global settings"
ON public.global_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_global_settings_updated_at
BEFORE UPDATE ON public.global_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.global_settings (key, value, category) VALUES
  ('branding', '{"site_name": "Ziggy Debate", "logo_url": null, "primary_color": "hsl(0, 84%, 60%)"}', 'branding'),
  ('seo_defaults', '{"meta_title_template": "{{page_title}} | Ziggy Debate", "meta_description": "Global debate tournament platform"}', 'seo'),
  ('feature_flags', '{"spectators_enabled": true, "sponsors_enabled": true, "analytics_enabled": true}', 'features'),
  ('default_language', '{"language": "en"}', 'localization')
ON CONFLICT (key) DO NOTHING;