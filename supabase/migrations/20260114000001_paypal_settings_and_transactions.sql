-- Migration: Add PayPal-specific columns for secure credential storage and transaction tracking
-- Part of PayPal Checkout Integration

-- ============================================================
-- 1. Extend tournament_payment_settings for PayPal
-- ============================================================

-- Add columns for encrypted PayPal credentials and config
ALTER TABLE public.tournament_payment_settings
  ADD COLUMN IF NOT EXISTS paypal_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paypal_mode TEXT DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS paypal_secret_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS paypal_secret_iv TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_user_id UUID REFERENCES auth.users(id);

-- Add constraint for paypal_mode values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tournament_payment_settings_paypal_mode_check'
  ) THEN
    ALTER TABLE public.tournament_payment_settings
      ADD CONSTRAINT tournament_payment_settings_paypal_mode_check
      CHECK (paypal_mode IS NULL OR paypal_mode IN ('sandbox', 'production'));
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tournament_payment_settings_paypal_enabled 
  ON public.tournament_payment_settings(tournament_id) 
  WHERE paypal_enabled = true;

-- ============================================================
-- 2. Extend payment_transactions for PayPal orders
-- ============================================================

-- Add PayPal-specific columns
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS cart_id UUID REFERENCES public.registration_carts(id),
  ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id),
  ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe';

-- Add constraint for payment_provider values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_transactions_provider_check'
  ) THEN
    ALTER TABLE public.payment_transactions
      ADD CONSTRAINT payment_transactions_provider_check
      CHECK (payment_provider IN ('stripe', 'paypal', 'manual', 'free'));
  END IF;
END $$;

-- Index for PayPal order lookup (idempotency)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paypal_order 
  ON public.payment_transactions(paypal_order_id) 
  WHERE paypal_order_id IS NOT NULL;

-- Index for cart-based lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_cart 
  ON public.payment_transactions(cart_id) 
  WHERE cart_id IS NOT NULL;

-- ============================================================
-- 3. Create public-safe view for PayPal client config
-- ============================================================

-- This view exposes ONLY non-sensitive PayPal settings needed by the frontend
-- (clientId, mode, enabled status). Secrets are never exposed.
CREATE OR REPLACE VIEW public.tournament_payment_public AS
SELECT 
  tps.tournament_id,
  tps.paypal_enabled,
  tps.paypal_client_id,
  tps.paypal_mode,
  tps.payment_handler
FROM public.tournament_payment_settings tps;

-- Grant read access to authenticated users (they need this to load PayPal SDK)
GRANT SELECT ON public.tournament_payment_public TO authenticated;

-- ============================================================
-- 4. Function to check if user can admin a tournament's payment settings
-- ============================================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.can_admin_tournament_payments(UUID) TO authenticated;

-- ============================================================
-- 5. Update RLS policy for tournament_payment_settings
-- ============================================================

-- Allow scoped tournament admins to read their tournament's settings
-- (The existing policy only allows global admins)
DROP POLICY IF EXISTS "Scoped admins can read tournament payment settings" ON public.tournament_payment_settings;

CREATE POLICY "Scoped admins can read tournament payment settings"
ON public.tournament_payment_settings
FOR SELECT
USING (
  public.is_admin() OR public.can_admin_tournament(tournament_id)
);

-- Drop the old "all" policy if it exists and recreate with better granularity
DROP POLICY IF EXISTS "Admins can manage tournament payment settings" ON public.tournament_payment_settings;

CREATE POLICY "Global admins can manage tournament payment settings"
ON public.tournament_payment_settings
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Scoped admins can update (but not delete) their tournament's payment settings
CREATE POLICY "Scoped admins can update tournament payment settings"
ON public.tournament_payment_settings
FOR UPDATE
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- ============================================================
-- 6. Add RLS policy for payment_transactions cart-based access
-- ============================================================

-- Users can view their own cart's payment transactions
DROP POLICY IF EXISTS "Users can view own cart payment transactions" ON public.payment_transactions;

CREATE POLICY "Users can view own cart payment transactions"
ON public.payment_transactions
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.registration_carts rc
    WHERE rc.id = cart_id AND rc.user_id = auth.uid()
  )
);
