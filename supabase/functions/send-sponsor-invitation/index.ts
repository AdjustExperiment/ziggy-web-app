import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendInvitationRequest {
  invitation_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitation_id }: SendInvitationRequest = await req.json();

    if (!invitation_id) {
      return new Response(
        JSON.stringify({ error: "invitation_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from("pending_sponsor_invitations")
      .select(`
        *,
        tournaments:tournament_id (
          id,
          name,
          start_date,
          end_date,
          location
        )
      `)
      .eq("id", invitation_id)
      .single();

    if (invitationError || !invitation) {
      console.error("Failed to fetch invitation:", invitationError);
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for SendGrid API key
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    
    if (!sendgridApiKey) {
      console.warn("SENDGRID_API_KEY not configured - invitation created but email not sent");
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "Email not sent - SENDGRID_API_KEY not configured",
          invite_link: `${supabaseUrl.replace('.supabase.co', '')}/sponsor/invite/${invitation.invite_token}`
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build the invitation URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://ziggydebate.com";
    const inviteUrl = `${siteUrl}/sponsor/invite/${invitation.invite_token}`;

    // Build tier benefits
    const tierBenefits: Record<string, string[]> = {
      bronze: ["Logo on tournament page", "Social media recognition", "Certificate of appreciation"],
      silver: ["All Bronze benefits", "Prominent logo placement", "1 blog post opportunity", "Event announcements"],
      gold: ["All Silver benefits", "Premium logo placement", "3 blog posts", "Speaking opportunity at events"],
      platinum: ["All Gold benefits", "Title sponsorship recognition", "Unlimited blog posts", "VIP event access"]
    };

    const benefits = tierBenefits[invitation.suggested_tier] || tierBenefits.bronze;
    const benefitsHtml = benefits.map(b => `<li style="margin: 8px 0;">✓ ${b}</li>`).join("");

    // Build tournament section if applicable
    let tournamentHtml = "";
    if (invitation.tournaments) {
      const t = invitation.tournaments;
      tournamentHtml = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #f5f5f5; margin: 0 0 12px 0;">🏆 Tournament: ${t.name}</h3>
          <p style="color: #a0a0a0; margin: 4px 0;">📍 ${t.location || "Location TBD"}</p>
          <p style="color: #a0a0a0; margin: 4px 0;">📅 ${t.start_date ? new Date(t.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Dates TBD"}</p>
        </div>
      `;
    }

    // Build personal message section
    let personalMessageHtml = "";
    if (invitation.personal_message) {
      personalMessageHtml = `
        <div style="background: rgba(220, 38, 38, 0.1); border-left: 4px solid #dc2626; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #f5f5f5; margin: 0; font-style: italic;">"${invitation.personal_message}"</p>
          <p style="color: #a0a0a0; margin: 8px 0 0 0; font-size: 14px;">— Ziggy Debate Team</p>
        </div>
      `;
    }

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">You're Invited to Partner with Ziggy</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Exclusive Sponsorship Opportunity</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="color: #f5f5f5; margin: 0 0 16px 0;">Hello ${invitation.organization_name}!</h2>
      
      <p style="color: #d0d0d0; line-height: 1.6; margin: 0 0 16px 0;">
        We're excited to invite you to become a sponsor partner with Ziggy Debate — the premier platform for hosting and managing debate tournaments worldwide.
      </p>
      
      ${personalMessageHtml}
      
      ${tournamentHtml}
      
      <!-- Tier Benefits -->
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #f5f5f5; margin: 0 0 16px 0; text-transform: capitalize;">
          ⭐ ${invitation.suggested_tier.charAt(0).toUpperCase() + invitation.suggested_tier.slice(1)} Tier Benefits
        </h3>
        <ul style="color: #d0d0d0; margin: 0; padding-left: 0; list-style: none;">
          ${benefitsHtml}
        </ul>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
          Accept Your Invitation
        </a>
      </div>
      
      <p style="color: #808080; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
        This invitation expires on ${new Date(invitation.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: rgba(0,0,0,0.3); padding: 24px 32px; text-align: center;">
      <p style="color: #606060; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Ziggy Debate. All rights reserved.<br>
        <a href="${siteUrl}" style="color: #dc2626; text-decoration: none;">ziggydebate.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via SendGrid
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: invitation.email }],
            subject: `You're Invited: Partner with Ziggy Debate as a ${invitation.suggested_tier.charAt(0).toUpperCase() + invitation.suggested_tier.slice(1)} Sponsor`,
          },
        ],
        from: {
          email: "sponsors@ziggydebate.com",
          name: "Ziggy Debate",
        },
        content: [
          {
            type: "text/html",
            value: emailHtml,
          },
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error("SendGrid error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sponsor invitation email sent to ${invitation.email} for ${invitation.organization_name}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation email sent successfully",
        invite_link: inviteUrl
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-sponsor-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
