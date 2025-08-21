
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  registration_id: string;
  email_type: 'registration_success' | 'payment_pending';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { registration_id, email_type }: EmailRequest = await req.json();

    console.log(`Processing ${email_type} email for registration ${registration_id}`);

    // Get registration details with tournament info
    const { data: registration, error: regError } = await supabase
      .from('tournament_registrations')
      .select(`
        *,
        tournament:tournaments(*)
      `)
      .eq('id', registration_id)
      .single();

    if (regError || !registration) {
      console.error('Registration not found:', regError);
      throw new Error('Registration not found');
    }

    // Get email template (tournament-specific first, then global)
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', email_type)
      .eq('enabled', true)
      .or(`tournament_id.eq.${registration.tournament_id},tournament_id.is.null`)
      .order('tournament_id', { ascending: false, nullsLast: true })
      .limit(1)
      .single();

    if (templateError || !template) {
      console.error('No email template found:', templateError);
      throw new Error(`No email template found for ${email_type}`);
    }

    // Get tournament email settings
    const { data: emailSettings } = await supabase
      .from('tournament_email_settings')
      .select('*')
      .eq('tournament_id', registration.tournament_id)
      .single();

    // Prepare template variables
    const tournament = registration.tournament;
    const templateVars = {
      participant_name: registration.participant_name,
      tournament_name: tournament.name,
      dates: `${tournament.start_date} to ${tournament.end_date}`,
      location: tournament.location,
      venue_details: tournament.venue_details || '',
      tournament_info: tournament.tournament_info || '',
      registration_fee: tournament.registration_fee,
      payment_status: registration.payment_status
    };

    // Replace template variables in subject and content
    let subject = template.subject;
    let htmlContent = template.html;
    let textContent = template.text || '';

    Object.entries(templateVars).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value || ''));
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value || ''));
      textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });

    // Send email
    const emailResponse = await resend.emails.send({
      from: template.from_email || emailSettings?.from_email || 'Tournament Registration <noreply@resend.dev>',
      to: [registration.participant_email],
      reply_to: template.reply_to || emailSettings?.reply_to,
      subject: subject,
      html: htmlContent,
      text: textContent || undefined,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabase.from('email_logs').insert({
      registration_id: registration_id,
      email_type: email_type,
      status: 'sent',
      attempt: 1
    });

    // Update registration tracking fields
    const updateData: any = {};
    if (email_type === 'registration_success') {
      updateData.success_email_sent_at = new Date().toISOString();
    } else if (email_type === 'payment_pending') {
      updateData.last_reminder_sent_at = new Date().toISOString();
      updateData.reminder_count = (registration.reminder_count || 0) + 1;
    }

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('tournament_registrations')
        .update(updateData)
        .eq('id', registration_id);
    }

    return new Response(JSON.stringify({ success: true, email_id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-registration-email function:", error);

    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { registration_id, email_type } = await req.json();
      await supabase.from('email_logs').insert({
        registration_id: registration_id,
        email_type: email_type,
        status: 'failed',
        error: error.message,
        attempt: 1
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

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
