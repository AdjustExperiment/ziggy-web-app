import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { data: templates, error } = await supabase
      .from('email_templates_enhanced')
      .select('*')
      .not('schedule_at', 'is', null)
      .lte('schedule_at', new Date().toISOString())
      .eq('enabled', true);

    if (error) throw error;

    for (const template of templates || []) {
      const recipients = Array.isArray(template.variables?.recipients)
        ? template.variables.recipients as string[]
        : [];

      for (const recipient of recipients) {
        const result = await resend.emails.send({
          from: template.from_email || 'noreply@resend.dev',
          to: [recipient],
          subject: template.subject,
          html: template.html_content,
        });

        if (!result.error) {
          await supabase.from('email_delivery_logs').insert({
            template_id: template.id,
            recipient_email: recipient,
            event_type: 'sent',
          });
        } else {
          console.error('Failed to send email', result.error);
        }
      }

      await supabase
        .from('email_templates_enhanced')
        .update({ schedule_at: null })
        .eq('id', template.id);
    }

    return new Response(
      JSON.stringify({ success: true, processed: templates?.length || 0 }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error('Error sending scheduled emails:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
