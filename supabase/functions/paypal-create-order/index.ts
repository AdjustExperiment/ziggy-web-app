import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  id: string;
  participant_name: string;
  base_price: number;
  discount_amount: number;
  role: string;
}

interface GroupDiscountRule {
  min_registrations: number;
  discount_type: string;
  discount_value: number;
}

/**
 * Decrypts a string using AES-GCM with the provided key
 */
async function decryptSecret(
  ciphertextBase64: string,
  ivBase64: string,
  masterKeyHex: string
): Promise<string> {
  // Convert hex key to bytes
  const keyBytes = new Uint8Array(
    masterKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  // Import the key for AES-GCM
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Convert base64 back to bytes
  const ciphertextBytes = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

  // Decrypt
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertextBytes
  );

  return new TextDecoder().decode(plaintextBuffer);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cart_id } = await req.json();

    if (!cart_id) {
      return new Response(
        JSON.stringify({ error: 'cart_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const masterKey = Deno.env.get('PAYPAL_CREDENTIALS_MASTER_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch cart with items
    const { data: cart, error: cartError } = await supabase
      .from('registration_carts')
      .select(`
        *,
        tournaments(name, currency, registration_fee),
        cart_items(*)
      `)
      .eq('id', cart_id)
      .eq('status', 'active')
      .single();

    if (cartError || !cart) {
      console.error('Cart fetch error:', cartError);
      return new Response(
        JSON.stringify({ error: 'Cart not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch tournament PayPal settings
    const { data: paypalSettings, error: settingsError } = await supabase
      .from('tournament_payment_settings')
      .select('paypal_enabled, paypal_mode, paypal_client_id, paypal_secret_ciphertext, paypal_secret_iv')
      .eq('tournament_id', cart.tournament_id)
      .single();

    if (settingsError || !paypalSettings) {
      console.log('PayPal not configured for tournament:', cart.tournament_id);
      return new Response(
        JSON.stringify({
          error: 'PayPal is not configured for this tournament. Please contact the tournament administrator.',
          not_configured: true
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!paypalSettings.paypal_enabled) {
      return new Response(
        JSON.stringify({
          error: 'PayPal payments are not enabled for this tournament.',
          not_configured: true
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!paypalSettings.paypal_client_id || !paypalSettings.paypal_secret_ciphertext || !paypalSettings.paypal_secret_iv) {
      console.log('PayPal credentials incomplete for tournament:', cart.tournament_id);
      return new Response(
        JSON.stringify({
          error: 'PayPal credentials are incomplete. Please contact the tournament administrator.',
          not_configured: true
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!masterKey || masterKey.length !== 64) {
      console.error('PAYPAL_CREDENTIALS_MASTER_KEY not configured or invalid');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error. Please contact the administrator.',
          not_configured: true
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the PayPal client secret
    let clientSecret: string;
    try {
      clientSecret = await decryptSecret(
        paypalSettings.paypal_secret_ciphertext,
        paypalSettings.paypal_secret_iv,
        masterKey
      );
    } catch (decryptError) {
      console.error('Failed to decrypt PayPal secret:', decryptError);
      return new Response(
        JSON.stringify({ error: 'Failed to decrypt payment credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = paypalSettings.paypal_client_id;
    const mode = paypalSettings.paypal_mode || 'sandbox';

    const items: CartItem[] = cart.cart_items || [];

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = (item.base_price || 0) - (item.discount_amount || 0);
      return sum + Math.max(0, itemTotal);
    }, 0);

    // Check for group discounts
    const { data: groupDiscounts } = await supabase
      .from('group_discount_rules')
      .select('*')
      .eq('tournament_id', cart.tournament_id)
      .eq('is_active', true)
      .order('min_registrations', { ascending: false });

    let groupDiscountAmount = 0;
    let appliedGroupDiscount: GroupDiscountRule | null = null;

    if (groupDiscounts && groupDiscounts.length > 0) {
      // Find the highest applicable group discount
      for (const rule of groupDiscounts) {
        if (items.length >= rule.min_registrations) {
          appliedGroupDiscount = rule;
          break;
        }
      }

      if (appliedGroupDiscount) {
        if (appliedGroupDiscount.discount_type === 'percent') {
          groupDiscountAmount = subtotal * (appliedGroupDiscount.discount_value / 100);
        } else if (appliedGroupDiscount.discount_type === 'fixed') {
          groupDiscountAmount = appliedGroupDiscount.discount_value;
        } else if (appliedGroupDiscount.discount_type === 'per_person') {
          groupDiscountAmount = appliedGroupDiscount.discount_value * items.length;
        }
      }
    }

    const total = Math.max(0, subtotal - groupDiscountAmount);
    const currency = cart.tournaments?.currency || 'USD';

    console.log(`Cart ${cart_id}: subtotal=${subtotal}, groupDiscount=${groupDiscountAmount}, total=${total}`);

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
      const authError = await authResponse.text();
      console.error('PayPal auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with PayPal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create PayPal order
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: cart_id,
        description: `Tournament Registration - ${cart.tournaments?.name || 'Tournament'}`,
        amount: {
          currency_code: currency,
          value: total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: subtotal.toFixed(2)
            },
            discount: {
              currency_code: currency,
              value: groupDiscountAmount.toFixed(2)
            }
          }
        },
        items: items.map(item => ({
          name: `${item.participant_name} - ${item.role}`,
          quantity: '1',
          unit_amount: {
            currency_code: currency,
            value: Math.max(0, (item.base_price || 0) - (item.discount_amount || 0)).toFixed(2)
          }
        }))
      }],
      application_context: {
        brand_name: 'Debate Tournament',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${req.headers.get('origin') || 'https://example.com'}/payment-success`,
        cancel_url: `${req.headers.get('origin') || 'https://example.com'}/payment-cancelled`
      }
    };

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const orderError = await orderResponse.text();
      console.error('PayPal order error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create PayPal order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData = await orderResponse.json();
    console.log(`PayPal order created: ${orderData.id}`);

    // Update cart status to checkout
    await supabase
      .from('registration_carts')
      .update({ status: 'checkout' })
      .eq('id', cart_id);

    return new Response(
      JSON.stringify({
        order_id: orderData.id,
        status: orderData.status,
        subtotal,
        group_discount: groupDiscountAmount,
        total,
        currency,
        items_count: items.length,
        paypal_mode: mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in paypal-create-order:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
