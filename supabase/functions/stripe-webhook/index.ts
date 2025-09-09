import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const registrationId = session.metadata?.registration_id;
        if (registrationId) {
          await supabase
            .from("tournament_registrations")
            .update({
              payment_status: "paid",
              payment_id: session.payment_intent as string,
              amount_paid: (session.amount_total ?? 0) / 100,
            })
            .eq("id", registrationId);
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const registrationId = (charge.metadata as Stripe.Metadata)['registration_id'] as string | undefined;
        if (registrationId) {
          await supabase
            .from("tournament_registrations")
            .update({ payment_status: "refunded" })
            .eq("id", registrationId);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Error handling webhook", err);
    return new Response("Webhook handler failed", { status: 500 });
  }
});

