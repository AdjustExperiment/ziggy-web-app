-- Create enhanced email templates table with image support
CREATE TABLE IF NOT EXISTS public.email_templates_enhanced (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  images JSONB DEFAULT '[]',
  from_email TEXT,
  reply_to TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_templates_enhanced ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage enhanced email templates" 
ON public.email_templates_enhanced 
FOR ALL 
USING (public.is_admin());

-- Create index for performance
CREATE INDEX idx_email_templates_enhanced_tournament_id ON public.email_templates_enhanced(tournament_id);
CREATE INDEX idx_email_templates_enhanced_template_key ON public.email_templates_enhanced(template_key);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_templates_enhanced_updated_at
BEFORE UPDATE ON public.email_templates_enhanced
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for storing API keys that admins can configure
CREATE TABLE IF NOT EXISTS public.email_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('resend', 'sendgrid')),
  api_key_name TEXT NOT NULL, -- The name of the secret in Supabase
  is_active BOOLEAN DEFAULT true,
  test_email TEXT, -- For testing the API key
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage email API keys" 
ON public.email_api_keys 
FOR ALL 
USING (public.is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_api_keys_updated_at
BEFORE UPDATE ON public.email_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();