-- Create a separate admin-only table for tournament payment settings
CREATE TABLE public.tournament_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  payment_handler TEXT DEFAULT 'paypal',
  paypal_client_id TEXT,
  paypal_button_html TEXT,
  venmo_button_html TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id)
);

-- Enable RLS and create admin-only policies
ALTER TABLE public.tournament_payment_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access payment settings
CREATE POLICY "Admins can manage tournament payment settings" 
ON public.tournament_payment_settings 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_tournament_payment_settings_updated_at
BEFORE UPDATE ON public.tournament_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing payment data from tournaments to the new table
INSERT INTO public.tournament_payment_settings (
  tournament_id, 
  payment_handler, 
  paypal_client_id, 
  paypal_button_html, 
  venmo_button_html
)
SELECT 
  id,
  payment_handler,
  paypal_client_id,
  paypal_button_html,
  venmo_button_html
FROM public.tournaments
WHERE payment_handler IS NOT NULL 
   OR paypal_client_id IS NOT NULL 
   OR paypal_button_html IS NOT NULL 
   OR venmo_button_html IS NOT NULL;

-- Remove payment fields from tournaments table (they're now in the secure table)
ALTER TABLE public.tournaments 
DROP COLUMN IF EXISTS payment_handler,
DROP COLUMN IF EXISTS paypal_client_id,
DROP COLUMN IF EXISTS paypal_button_html,
DROP COLUMN IF EXISTS venmo_button_html;