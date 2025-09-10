-- Create payment_links table for admin-configurable payment options
CREATE TABLE public.payment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID, -- NULL for global links, specific tournament ID for tournament-specific
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'venmo')),
  link_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage payment links" 
ON public.payment_links 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active payment links" 
ON public.payment_links 
FOR SELECT 
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_payment_links_updated_at
BEFORE UPDATE ON public.payment_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();