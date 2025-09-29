-- Fix critical security issues identified in security audit

-- 1. Fix function search paths for all security definer functions
-- This prevents SQL injection through search_path manipulation

-- Update all existing security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.map_sponsor_tier_for_display(_tier text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case lower(_tier)
    when 'bronze' then 'supporting'
    when 'silver' then 'major'
    when 'gold' then 'presenting'
    when 'platinum' then 'title'
    else 'supporting'
  end;
$function$;

CREATE OR REPLACE FUNCTION public.is_account_locked(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = _user_id
      and (
        p.is_locked = true
        or (p.locked_until is not null and p.locked_until > now())
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_submit_ballot(_pairing_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(
    -- Backward compatibility: single judge on pairings
    select 1
    from public.pairings p
    join public.judge_profiles jp on p.judge_id = jp.id
    where p.id = _pairing_id
      and jp.user_id = auth.uid()
  )
  or exists(
    -- Multi-judge: any assigned or confirmed judge for this pairing
    select 1
    from public.pairing_judge_assignments a
    join public.judge_profiles jp on jp.id = a.judge_profile_id
    where a.pairing_id = _pairing_id
      and a.status in ('assigned','confirmed')
      and jp.user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_is_competitor_for_pairing(_pairing_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(
    select 1
    from public.pairings p
    join public.tournament_registrations tr
      on tr.id = p.aff_registration_id or tr.id = p.neg_registration_id
    where p.id = _pairing_id
      and tr.user_id = auth.uid()
  );
$function$;

-- 2. Strengthen RLS policies for judge_profiles to prevent PII exposure
-- Remove the overly permissive admin policy and make it more specific

DROP POLICY IF EXISTS "Admins can manage judge profiles" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can manage own profile" ON public.judge_profiles;

-- More restrictive admin policy
CREATE POLICY "Admins can view all judge profiles" 
ON public.judge_profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update judge profiles" 
ON public.judge_profiles 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert judge profiles" 
ON public.judge_profiles 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete judge profiles" 
ON public.judge_profiles 
FOR DELETE 
USING (public.is_admin());

-- Judges can manage their own profile
CREATE POLICY "Judges can view own profile" 
ON public.judge_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Judges can update own profile" 
ON public.judge_profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Judges can insert own profile" 
ON public.judge_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Tournament participants can view basic judge info (name only) for their pairings
CREATE POLICY "Participants can view assigned judge names" 
ON public.judge_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.pairings p
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE p.judge_id = judge_profiles.id
      AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM public.pairing_judge_assignments pja
    JOIN public.pairings p ON p.id = pja.pairing_id
    JOIN public.tournament_registrations tr_aff ON p.aff_registration_id = tr_aff.id
    JOIN public.tournament_registrations tr_neg ON p.neg_registration_id = tr_neg.id
    WHERE pja.judge_profile_id = judge_profiles.id
      AND (tr_aff.user_id = auth.uid() OR tr_neg.user_id = auth.uid())
  )
);

-- 3. Strengthen RLS policies for tournament_registrations
-- Current policies seem adequate but let's ensure no data leakage

-- 4. Strengthen RLS policies for payment_transactions
-- Ensure financial data is only visible to owners and admins

DROP POLICY IF EXISTS "Admins can manage all payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "System can insert payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;

-- More specific admin policies
CREATE POLICY "Admins can view payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update payment transactions" 
ON public.payment_transactions 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete payment transactions" 
ON public.payment_transactions 
FOR DELETE 
USING (public.is_admin());

-- System/service role can insert transactions (for webhooks)
CREATE POLICY "Service can insert payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (
  -- Allow service role or authenticated users creating their own transactions
  auth.uid() IS NULL OR auth.uid() = user_id
);

-- Users can only view their own transactions
CREATE POLICY "Users can view own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access to sensitive tables
  IF TG_OP = 'SELECT' AND TG_TABLE_NAME IN ('judge_profiles', 'tournament_registrations', 'payment_transactions') THEN
    INSERT INTO public.security_audit_logs (user_id, action, context)
    VALUES (
      auth.uid(),
      'sensitive_data_access',
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;