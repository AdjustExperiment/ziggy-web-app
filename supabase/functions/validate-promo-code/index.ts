
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { code, tournament_id, registration_amount } = await req.json()

    // Get promo code details
    const { data: promoData, error: promoError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single()

    if (promoError || !promoData) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Promo code not found or inactive' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check tournament restriction
    if (promoData.tournament_id && promoData.tournament_id !== tournament_id) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Promo code not valid for this tournament' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check date validity
    const now = new Date()
    if (promoData.valid_from && new Date(promoData.valid_from) > now) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Promo code is not yet active' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (promoData.valid_to && new Date(promoData.valid_to) < now) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Promo code has expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check email restrictions
    if (promoData.allowed_emails.length > 0) {
      const userEmail = userData.user.email?.toLowerCase()
      if (!userEmail || !promoData.allowed_emails.some(email => email.toLowerCase() === userEmail)) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Promo code not available for your account' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check max redemptions
    if (promoData.max_redemptions) {
      const { count: totalRedemptions } = await supabaseAdmin
        .from('promo_redemptions')
        .select('id', { count: 'exact' })
        .eq('promo_code_id', promoData.id)

      if (totalRedemptions >= promoData.max_redemptions) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Promo code has reached maximum redemptions' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check per-user limit
    const { count: userRedemptions } = await supabaseAdmin
      .from('promo_redemptions')
      .select('id', { count: 'exact' })
      .eq('promo_code_id', promoData.id)
      .eq('user_id', userData.user.id)

    if (userRedemptions >= promoData.per_user_limit) {
      return new Response(
        JSON.stringify({ valid: false, message: 'You have already used this promo code the maximum number of times' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (promoData.discount_type === 'percent') {
      discountAmount = (registration_amount * promoData.discount_value) / 100
    } else {
      discountAmount = Math.min(promoData.discount_value, registration_amount)
    }

    return new Response(
      JSON.stringify({
        valid: true,
        discount_type: promoData.discount_type,
        discount_value: promoData.discount_value,
        discount_amount: Math.round(discountAmount * 100) / 100,
        message: `${promoData.discount_type === 'percent' ? promoData.discount_value + '%' : '$' + promoData.discount_value} discount applied!`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error validating promo code:', error)
    return new Response(
      JSON.stringify({ valid: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
