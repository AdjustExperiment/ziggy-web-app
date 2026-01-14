-- Fix SECURITY DEFINER warning on tournament_payment_public view
-- Drop and recreate without SECURITY DEFINER (uses SECURITY INVOKER by default)

DROP VIEW IF EXISTS public.tournament_payment_public;

-- Recreate as a regular view (SECURITY INVOKER is default)
CREATE VIEW public.tournament_payment_public AS
SELECT 
  tps.tournament_id,
  tps.paypal_enabled,
  tps.paypal_client_id,
  tps.paypal_mode,
  tps.payment_handler
FROM public.tournament_payment_settings tps;

-- Ensure authenticated users can read this view
GRANT SELECT ON public.tournament_payment_public TO authenticated;

-- Also fix the search_path on can_admin_tournament_payments function
CREATE OR REPLACE FUNCTION public.can_admin_tournament_payments(p_tournament_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Global admins can always manage payments
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Scoped tournament admins can manage their tournament's payments
  RETURN public.can_admin_tournament(p_tournament_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;
