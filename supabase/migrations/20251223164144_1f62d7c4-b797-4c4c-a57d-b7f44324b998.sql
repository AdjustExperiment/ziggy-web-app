-- =============================================
-- Registration Cart System Database Migration
-- =============================================

-- Add currency column to tournaments if not exists
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Add PayPal and cart columns to payment_transactions
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
ADD COLUMN IF NOT EXISTS cart_id UUID,
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'unknown';

-- Create registration_carts table
CREATE TABLE public.registration_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.registration_carts(id) ON DELETE CASCADE,
  registrant_type TEXT NOT NULL DEFAULT 'self',
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_by_user_id UUID,
  claim_token TEXT UNIQUE,
  partner_name TEXT,
  partner_email TEXT,
  school_organization TEXT,
  event_id UUID REFERENCES public.tournament_events(id),
  role TEXT NOT NULL DEFAULT 'competitor',
  base_price NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  promo_code_id UUID REFERENCES public.promo_codes(id),
  additional_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create group_discount_rules table
CREATE TABLE public.group_discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  min_registrations INT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pending_registrant_invitations table
CREATE TABLE public.pending_registrant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_item_id UUID NOT NULL REFERENCES public.cart_items(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  claim_token TEXT NOT NULL UNIQUE,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL,
  registration_id UUID REFERENCES public.tournament_registrations(id),
  claimed_at TIMESTAMPTZ,
  claimed_by_user_id UUID,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key for cart_id in payment_transactions
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_cart_id_fkey 
FOREIGN KEY (cart_id) REFERENCES public.registration_carts(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.registration_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_registrant_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for registration_carts
CREATE POLICY "Users can manage their own carts"
ON public.registration_carts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all carts"
ON public.registration_carts FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for cart_items
CREATE POLICY "Users can manage items in their carts"
ON public.cart_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.registration_carts rc
  WHERE rc.id = cart_items.cart_id AND rc.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.registration_carts rc
  WHERE rc.id = cart_items.cart_id AND rc.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all cart items"
ON public.cart_items FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for group_discount_rules
CREATE POLICY "Anyone can view active group discounts"
ON public.group_discount_rules FOR SELECT
USING (is_active = true);

CREATE POLICY "Scoped admins can manage group discounts"
ON public.group_discount_rules FOR ALL
USING (public.can_admin_tournament(tournament_id))
WITH CHECK (public.can_admin_tournament(tournament_id));

-- RLS Policies for pending_registrant_invitations
CREATE POLICY "Users can view invitations for their email"
ON public.pending_registrant_invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND LOWER(u.email) = LOWER(pending_registrant_invitations.email)
  )
);

CREATE POLICY "Inviters can view their own invitations"
ON public.pending_registrant_invitations FOR SELECT
USING (invited_by_user_id = auth.uid());

CREATE POLICY "Users can claim invitations sent to their email"
ON public.pending_registrant_invitations FOR UPDATE
USING (
  claimed_at IS NULL AND
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND LOWER(u.email) = LOWER(pending_registrant_invitations.email)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND LOWER(u.email) = LOWER(pending_registrant_invitations.email)
  )
);

CREATE POLICY "Admins can manage all invitations"
ON public.pending_registrant_invitations FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create updated_at trigger for new tables
CREATE TRIGGER update_registration_carts_updated_at
BEFORE UPDATE ON public.registration_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_discount_rules_updated_at
BEFORE UPDATE ON public.group_discount_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster cart lookups
CREATE INDEX idx_registration_carts_user_tournament ON public.registration_carts(user_id, tournament_id);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_pending_registrant_invitations_email ON public.pending_registrant_invitations(LOWER(email));
CREATE INDEX idx_pending_registrant_invitations_claim_token ON public.pending_registrant_invitations(claim_token);