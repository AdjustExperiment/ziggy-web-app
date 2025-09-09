import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature') || '';
  const body = await req.text();

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2022-11-15'
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return new Response(`Webhook Error: ${err.message}`, {
      status: 400,
      headers: corsHeaders
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object;
        await supabaseClient.from('payment_transactions').insert({
          registration_id: session.metadata?.registration_id || null,
          user_id: session.metadata?.user_id || null,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency ? session.currency.toUpperCase() : 'USD',
          status: 'succeeded',
          stripe_session_id: session.id
        });
        break;
      }
      case 'charge.refunded': {
        const charge: any = event.data.object;
        await supabaseClient
          .from('payment_transactions')
          .update({ status: 'refunded' })
          .eq('stripe_session_id', charge.payment_intent);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error handling Stripe webhook', error);
    return new Response('Server Error', { status: 500, headers: corsHeaders });
  }
});
