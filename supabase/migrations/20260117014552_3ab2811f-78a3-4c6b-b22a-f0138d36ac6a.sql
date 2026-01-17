-- Add admin policy for pairing_chat_messages
CREATE POLICY "Admins can manage all chat messages"
  ON public.pairing_chat_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add tournament-wide chat policy (for messages without pairing_id)
CREATE POLICY "Tournament participants can use tournament chat"
  ON public.pairing_chat_messages FOR ALL
  TO authenticated
  USING (
    message_type = 'tournament_chat'
    AND pairing_id IS NULL
    AND metadata IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.tournament_registrations tr
      WHERE tr.tournament_id::text = (metadata->>'tournament_id')
      AND tr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    sender_id = auth.uid()
    AND message_type = 'tournament_chat'
    AND pairing_id IS NULL
  );

-- Add policy for judges assigned via pairings.judge_id to view chat
CREATE POLICY "Primary judges can view pairing chat"
  ON public.pairing_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairings p
      JOIN public.judge_profiles jp ON jp.id = p.judge_id
      WHERE p.id = pairing_chat_messages.pairing_id
      AND jp.user_id = auth.uid()
    )
  );

-- Add admin policy for pairing_evidence
CREATE POLICY "Admins can manage all evidence"
  ON public.pairing_evidence FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add judge evidence access policy
CREATE POLICY "Judges can view evidence for their pairings"
  ON public.pairing_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairings p
      JOIN public.judge_profiles jp ON jp.id = p.judge_id
      WHERE p.id = pairing_evidence.pairing_id
      AND jp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.pairing_judge_assignments pja
      JOIN public.judge_profiles jp ON jp.id = pja.judge_profile_id
      WHERE pja.pairing_id = pairing_evidence.pairing_id
      AND jp.user_id = auth.uid()
    )
  );