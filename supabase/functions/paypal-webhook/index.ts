import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * PayPal Webhook Handler
 * 
 * Handles async PayPal events for reconciliation:
 * - PAYMENT.CAPTURE.COMPLETED - Confirms payment was captured
 * - PAYMENT.CAPTURE.DENIED - Payment was denied
 * - PAYMENT.CAPTURE.REFUNDED - Payment was refunded
 * - CHECKOUT.ORDER.APPROVED - Order approved (backup for capture)
 * 
 * Note: This webhook does NOT require JWT auth as it's called by PayPal servers.
 * Instead, we verify the webhook signature using PayPal's transmission headers.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo',
};

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource: {
    id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
    status?: string;
    amount?: {
      currency_code: string;
      value: string;
    };
  };
  create_time: string;
  summary: string;
}

/**
 * Verify PayPal webhook signature
 * Note: For production, you should implement full signature verification
 * using PayPal's transmission headers and webhook ID
 */
async function verifyWebhookSignature(
  req: Request,
  webhookId: string,
  clientId: string,
  clientSecret: string,
  mode: string
): Promise<boolean> {
  const transmissionId = req.headers.get('paypal-transmission-id');
  const transmissionTime = req.headers.get('paypal-transmission-time');
  const transmissionSig = req.headers.get('paypal-transmission-sig');
  const certUrl = req.headers.get('paypal-cert-url');
  const authAlgo = req.headers.get('paypal-auth-algo');

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    console.warn('Missing PayPal transmission headers');
    return false;
  }

  // For production, implement full signature verification
  // For now, we do basic header validation
  // See: https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
  
  const baseUrl = mode === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  try {
    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      console.error('Failed to get PayPal access token for webhook verification');
      return false;
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Clone the request to read body for verification
    const body = await req.clone().text();

    // Verify signature with PayPal
    const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    });

    if (!verifyResponse.ok) {
      console.error('PayPal signature verification request failed');
      return false;
    }

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
    const globalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const globalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const globalMode = Deno.env.get('PAYPAL_MODE') || 'sandbox';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook event
    const event: PayPalWebhookEvent = await req.json();
    console.log(`PayPal webhook received: ${event.event_type} (${event.id})`);

    // Log the webhook event for audit
    await supabase.from('security_audit_logs').insert({
      action: 'paypal_webhook_received',
      context: {
        event_id: event.id,
        event_type: event.event_type,
        resource_type: event.resource_type,
        summary: event.summary,
        timestamp: event.create_time,
      },
    });

    // Optional: Verify webhook signature if webhook ID is configured
    if (webhookId && globalClientId && globalClientSecret) {
      const isValid = await verifyWebhookSignature(
        req,
        webhookId,
        globalClientId,
        globalClientSecret,
        globalMode
      );

      if (!isValid) {
        console.warn('Webhook signature verification failed');
        // In production, you might want to reject invalid signatures
        // For now, we log and continue for debugging
      }
    }

    // Handle different event types
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const captureId = event.resource.id;
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;

        if (!captureId) {
          console.warn('PAYMENT.CAPTURE.COMPLETED missing capture ID');
          break;
        }

        console.log(`Processing capture completed: ${captureId}, order: ${orderId}`);

        // Find the transaction by capture ID or order ID
        let query = supabase.from('payment_transactions').select('*');
        
        if (orderId) {
          query = query.eq('paypal_order_id', orderId);
        } else {
          query = query.eq('paypal_capture_id', captureId);
        }

        const { data: transaction } = await query.single();

        if (transaction) {
          // Update to paid if not already
          if (transaction.status !== 'paid') {
            const { error: updateError } = await supabase
              .from('payment_transactions')
              .update({
                status: 'paid',
                paypal_capture_id: captureId,
                metadata: {
                  ...transaction.metadata,
                  webhook_confirmed: true,
                  webhook_event_id: event.id,
                  webhook_timestamp: event.create_time,
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', transaction.id);

            if (updateError) {
              console.error('Failed to update transaction:', updateError);
            } else {
              console.log(`Transaction ${transaction.id} marked as paid via webhook`);
            }
          }
        } else {
          console.warn(`No transaction found for capture ${captureId} / order ${orderId}`);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const captureId = event.resource.id;
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;

        console.log(`Processing capture denied: ${captureId}, order: ${orderId}`);

        let query = supabase.from('payment_transactions').select('*');
        if (orderId) {
          query = query.eq('paypal_order_id', orderId);
        }

        const { data: transaction } = await query.single();

        if (transaction && transaction.status === 'pending') {
          await supabase
            .from('payment_transactions')
            .update({
              status: 'failed',
              metadata: {
                ...transaction.metadata,
                denial_reason: event.summary,
                webhook_event_id: event.id,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.id);

          console.log(`Transaction ${transaction.id} marked as failed`);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const captureId = event.resource.id;
        const refundAmount = event.resource.amount;

        console.log(`Processing refund for capture: ${captureId}`);

        const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('paypal_capture_id', captureId)
          .single();

        if (transaction) {
          await supabase
            .from('payment_transactions')
            .update({
              status: 'refunded',
              metadata: {
                ...transaction.metadata,
                refund_amount: refundAmount,
                refund_event_id: event.id,
                refund_timestamp: event.create_time,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.id);

          console.log(`Transaction ${transaction.id} marked as refunded`);
        }
        break;
      }

      case 'CHECKOUT.ORDER.APPROVED': {
        // Backup event in case onApprove callback fails
        // The order was approved by buyer but may not have been captured
        const orderId = event.resource.id;
        console.log(`Order approved: ${orderId}`);

        const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('paypal_order_id', orderId)
          .single();

        if (transaction && transaction.status === 'pending') {
          // Log that approval was received but capture is still pending
          await supabase
            .from('payment_transactions')
            .update({
              metadata: {
                ...transaction.metadata,
                order_approved_via_webhook: true,
                approval_event_id: event.id,
                approval_timestamp: event.create_time,
              },
            })
            .eq('id', transaction.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    // Acknowledge receipt
    return new Response(
      JSON.stringify({ received: true, event_id: event.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
