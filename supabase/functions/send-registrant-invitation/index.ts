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
    const { email, name, claim_token, tournament_id, inviter_user_id } = await req.json();

    if (!email || !name || !claim_token || !tournament_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get tournament details
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('name, start_date, location')
      .eq('id', tournament_id)
      .single();

    // Get inviter details
    let inviterName = 'Someone';
    if (inviter_user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', inviter_user_id)
        .single();
      
      if (profile) {
        inviterName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Someone';
      }
    }

    const emailApiSecret = Deno.env.get('EMAIL_API_SECRET');
    if (!emailApiSecret) {
      console.log('Email API secret not configured, skipping email send');
      return new Response(
        JSON.stringify({ success: true, message: 'Email skipped - not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build claim URL - use the origin from request or fallback
    const origin = req.headers.get('origin') || 'https://lovable.dev';
    const claimUrl = `${origin}/claim/${claim_token}`;

    const tournamentName = tournament?.name || 'a tournament';
    const tournamentDate = tournament?.start_date 
      ? new Date(tournament.start_date).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      : 'TBD';

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tournament Registration Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #ef4444; font-size: 28px; margin: 0 0 8px 0;">You've Been Registered!</h1>
        <p style="color: #888; margin: 0; font-size: 16px;">Tournament Registration Invitation</p>
      </div>
      
      <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        Hi <strong style="color: #fff;">${name}</strong>,
      </p>
      
      <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        <strong style="color: #fff;">${inviterName}</strong> has registered you for <strong style="color: #ef4444;">${tournamentName}</strong>.
      </p>
      
      <div style="background: #111; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #ef4444;">
        <p style="color: #888; margin: 0 0 8px 0; font-size: 14px;">Tournament Date</p>
        <p style="color: #fff; margin: 0; font-size: 18px; font-weight: 600;">${tournamentDate}</p>
        ${tournament?.location ? `
        <p style="color: #888; margin: 16px 0 8px 0; font-size: 14px;">Location</p>
        <p style="color: #fff; margin: 0; font-size: 16px;">${tournament.location}</p>
        ` : ''}
      </div>
      
      <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        To access your tournament dashboard and manage your registration, please claim your account by clicking the button below:
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Claim Your Registration
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; text-align: center; margin-top: 32px;">
        This invitation expires in 30 days. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
    
    <div style="text-align: center; padding: 24px; color: #666; font-size: 12px;">
      <p style="margin: 0;">Powered by Debate Platform</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Debate Platform <noreply@resend.dev>',
        to: [email],
        subject: `${inviterName} registered you for ${tournamentName}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendData = await resendResponse.json();
    console.log('Invitation email sent:', resendData.id);

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-registrant-invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
