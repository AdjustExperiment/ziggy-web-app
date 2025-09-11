-- Create missing tables for enhanced payment and refund management
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, denied, processed
  requested_amount INTEGER, -- Amount in cents, NULL for full refund
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view own payment transactions" ON public.payment_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payment transactions" ON public.payment_transactions
  FOR ALL USING (is_admin());

CREATE POLICY "System can insert payment transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for refund_requests  
CREATE POLICY "Users can manage own refund requests" ON public.refund_requests
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all refund requests" ON public.refund_requests
  FOR ALL USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_registration_id ON public.payment_transactions(registration_id);
CREATE INDEX idx_payment_transactions_stripe_session_id ON public.payment_transactions(stripe_session_id);
CREATE INDEX idx_refund_requests_user_id ON public.refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);

-- Create ballot_submissions table for enhanced ballot tracking
CREATE TABLE public.ballot_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ballot_id UUID REFERENCES public.ballots(id) ON DELETE CASCADE,
  judge_profile_id UUID REFERENCES public.judge_profiles(id) ON DELETE CASCADE,
  pairing_id UUID REFERENCES public.pairings(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL DEFAULT '{}',
  submission_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ballot_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can manage own ballot submissions" ON public.ballot_submissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.judge_profiles jp 
    WHERE jp.id = ballot_submissions.judge_profile_id 
    AND jp.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all ballot submissions" ON public.ballot_submissions
  FOR ALL USING (is_admin());

-- Add pairing chat messages table
CREATE TABLE public.pairing_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID REFERENCES public.pairings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, system, file
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pairing_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat for their pairings" ON public.pairing_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pairings p
      JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
      JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
      WHERE p.id = pairing_chat_messages.pairing_id
      AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.pairing_judge_assignments pja
      JOIN public.judge_profiles jp ON pja.judge_profile_id = jp.id
      WHERE pja.pairing_id = pairing_chat_messages.pairing_id
      AND jp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their pairings" ON public.pairing_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.pairings p
        JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
        JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
        WHERE p.id = pairing_chat_messages.pairing_id
        AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.pairing_judge_assignments pja
        JOIN public.judge_profiles jp ON pja.judge_profile_id = jp.id
        WHERE pja.pairing_id = pairing_chat_messages.pairing_id
        AND jp.user_id = auth.uid()
      )
    )
  );

CREATE INDEX idx_pairing_chat_messages_pairing_id ON public.pairing_chat_messages(pairing_id);
CREATE INDEX idx_pairing_chat_messages_created_at ON public.pairing_chat_messages(created_at);