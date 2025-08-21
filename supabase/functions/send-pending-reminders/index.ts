
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting pending reminders job...');

    // Get all pending registrations that need reminders
    const { data: pendingRegistrations, error: pendingError } = await supabase
      .from('tournament_registrations')
      .select(`
        *,
        tournament:tournaments(*),
        email_settings:tournament_email_settings(*)
      `)
      .eq('payment_status', 'pending')
      .is('success_email_sent_at', null);

    if (pendingError) {
      console.error('Error fetching pending registrations:', pendingError);
      throw pendingError;
    }

    console.log(`Found ${pendingRegistrations?.length || 0} pending registrations`);

    if (!pendingRegistrations || pendingRegistrations.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending registrations to process' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const registration of pendingRegistrations) {
      try {
        // Get email settings (default if none exist)
        const settings = registration.email_settings || {
          send_pending_reminders: true,
          reminder_initial_delay_minutes: 60,
          reminder_repeat_minutes: 1440, // 24 hours
          reminder_max_count: 3
        };

        if (!settings.send_pending_reminders) {
          console.log(`Reminders disabled for tournament ${registration.tournament_id}`);
          continue;
        }

        const now = new Date();
        const createdAt = new Date(registration.created_at);
        const lastReminderAt = registration.last_reminder_sent_at 
          ? new Date(registration.last_reminder_sent_at) 
          : null;

        // Check if we should send initial reminder
        const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        const shouldSendInitial = !lastReminderAt && 
          minutesSinceCreation >= settings.reminder_initial_delay_minutes;

        // Check if we should send repeat reminder
        const shouldSendRepeat = lastReminderAt && 
          ((now.getTime() - lastReminderAt.getTime()) / (1000 * 60)) >= settings.reminder_repeat_minutes &&
          (registration.reminder_count || 0) < settings.reminder_max_count;

        if (shouldSendInitial || shouldSendRepeat) {
          console.log(`Sending reminder for registration ${registration.id}`);
          
          // Call the send-registration-email function
          const emailResponse = await supabase.functions.invoke('send-registration-email', {
            body: {
              registration_id: registration.id,
              email_type: 'payment_pending'
            }
          });

          if (emailResponse.error) {
            console.error(`Failed to send reminder for ${registration.id}:`, emailResponse.error);
            errors++;
          } else {
            console.log(`Reminder sent for registration ${registration.id}`);
            processed++;
          }
        }
      } catch (error) {
        console.error(`Error processing registration ${registration.id}:`, error);
        errors++;
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${processed} reminders, ${errors} errors` 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-pending-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
