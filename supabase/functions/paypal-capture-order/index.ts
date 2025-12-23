import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, cart_id } = await req.json();

    if (!order_id || !cart_id) {
      return new Response(
        JSON.stringify({ error: 'order_id and cart_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const mode = Deno.env.get('PAYPAL_MODE') || 'sandbox';

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'PayPal is not configured', not_configured: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get PayPal access token
    const baseUrl = mode === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      console.error('PayPal auth failed');
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with PayPal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Capture the payment
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const captureError = await captureResponse.text();
      console.error('PayPal capture error:', captureError);
      return new Response(
        JSON.stringify({ error: 'Failed to capture PayPal payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const captureData = await captureResponse.json();
    console.log('PayPal capture successful:', captureData.id);

    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const capturedAmount = parseFloat(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0');
    const currency = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code || 'USD';

    // Fetch cart and items
    const { data: cart, error: cartError } = await supabase
      .from('registration_carts')
      .select(`
        *,
        cart_items(*)
      `)
      .eq('id', cart_id)
      .single();

    if (cartError || !cart) {
      console.error('Cart not found:', cartError);
      return new Response(
        JSON.stringify({ error: 'Cart not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create payment transaction
    const { data: transaction, error: txnError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: cart.user_id,
        cart_id: cart_id,
        amount: Math.round(capturedAmount * 100), // Store in cents
        currency: currency.toLowerCase(),
        status: 'paid',
        payment_method: 'paypal',
        paypal_order_id: order_id,
        paypal_capture_id: captureId,
        metadata: {
          payer_email: captureData.payer?.email_address,
          payer_name: `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim(),
          items_count: cart.cart_items?.length || 0
        }
      })
      .select()
      .single();

    if (txnError) {
      console.error('Transaction insert error:', txnError);
    }

    // Create tournament registrations for each cart item
    const registrations = [];
    const invitations = [];

    for (const item of cart.cart_items || []) {
      const registrationData = {
        tournament_id: cart.tournament_id,
        user_id: item.registrant_type === 'self' ? cart.user_id : null,
        participant_name: item.participant_name,
        participant_email: item.participant_email,
        partner_name: item.partner_name,
        school_organization: item.school_organization,
        event_id: item.event_id,
        payment_status: 'paid',
        amount_paid: Math.max(0, (item.base_price || 0) - (item.discount_amount || 0)),
        additional_info: {
          ...item.additional_info,
          cart_item_id: item.id,
          payment_transaction_id: transaction?.id,
          registered_by_user_id: cart.user_id,
          registrant_type: item.registrant_type
        }
      };

      const { data: reg, error: regError } = await supabase
        .from('tournament_registrations')
        .insert(registrationData)
        .select()
        .single();

      if (regError) {
        console.error('Registration insert error:', regError);
        continue;
      }

      registrations.push(reg);

      // If registering for someone else, create invitation
      if (item.registrant_type === 'other') {
        const claimToken = crypto.randomUUID();
        
        const { error: inviteError } = await supabase
          .from('pending_registrant_invitations')
          .insert({
            cart_item_id: item.id,
            email: item.participant_email,
            name: item.participant_name,
            claim_token: claimToken,
            tournament_id: cart.tournament_id,
            invited_by_user_id: cart.user_id,
            registration_id: reg.id
          });

        if (!inviteError) {
          invitations.push({
            email: item.participant_email,
            name: item.participant_name,
            claim_token: claimToken,
            registration_id: reg.id
          });
        }
      }

      // Update cart item with claim info if needed
      if (item.registrant_type === 'other') {
        await supabase
          .from('cart_items')
          .update({ claim_token: crypto.randomUUID() })
          .eq('id', item.id);
      }
    }

    // Mark cart as completed
    await supabase
      .from('registration_carts')
      .update({ status: 'completed' })
      .eq('id', cart_id);

    // Send invitation emails for 'other' registrations
    for (const invitation of invitations) {
      try {
        await supabase.functions.invoke('send-registrant-invitation', {
          body: {
            email: invitation.email,
            name: invitation.name,
            claim_token: invitation.claim_token,
            tournament_id: cart.tournament_id,
            inviter_user_id: cart.user_id
          }
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }
    }

    // Send confirmation emails for 'self' registrations
    for (const reg of registrations) {
      if (reg.user_id) {
        try {
          await supabase.functions.invoke('send-registration-email', {
            body: {
              registration_id: reg.id,
              email_type: 'registration_success'
            }
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      }
    }

    console.log(`Completed: ${registrations.length} registrations, ${invitations.length} invitations`);

    return new Response(
      JSON.stringify({
        success: true,
        capture_id: captureId,
        order_id: order_id,
        registrations_created: registrations.length,
        invitations_sent: invitations.length,
        amount: capturedAmount,
        currency
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in paypal-capture-order:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
