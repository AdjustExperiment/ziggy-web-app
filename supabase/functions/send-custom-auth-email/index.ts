import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("EMAIL_API_SECRET"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  type: "signup" | "recovery" | "invite" | "magiclink" | "email_change";
  email: string;
  token?: string;
  token_hash?: string;
  redirect_to?: string;
  user_metadata?: Record<string, any>;
}

const getEmailContent = (type: string, confirmLink: string, userName?: string): { subject: string; html: string } => {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
  `;
  
  const buttonStyles = `
    display: inline-block;
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    color: #ffffff;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 24px 0;
  `;

  const containerStyles = `
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  `;

  const headerStyles = `
    text-align: center;
    margin-bottom: 32px;
  `;

  const logoStyles = `
    font-size: 32px;
    font-weight: 800;
    color: #dc2626;
    margin-bottom: 8px;
  `;

  const footerStyles = `
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #333;
    text-align: center;
    font-size: 12px;
    color: #888;
  `;

  const greeting = userName ? `Hello ${userName},` : "Hello,";

  switch (type) {
    case "signup":
      return {
        subject: "Welcome to Ziggy Online Debate - Confirm Your Email",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="${baseStyles}">
            <div style="${containerStyles}">
              <div style="${headerStyles}">
                <div style="${logoStyles}">ZIGGY</div>
                <div style="color: #888; font-size: 14px;">Online Debate Platform</div>
              </div>
              
              <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Welcome to Ziggy!</h1>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                Thank you for signing up for Ziggy Online Debate. Please confirm your email address to complete your registration and start competing in tournaments.
              </p>
              
              <div style="text-align: center;">
                <a href="${confirmLink}" style="${buttonStyles}">Confirm Email Address</a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
                <br><a href="${confirmLink}" style="color: #dc2626; word-break: break-all;">${confirmLink}</a>
              </p>
              
              <p style="color: #888; font-size: 14px;">
                This link will expire in 24 hours.
              </p>
              
              <div style="${footerStyles}">
                <p>© 2011-2025 Ziggy Online Debate. All rights reserved.</p>
                <p>If you didn't create an account, please ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "recovery":
      return {
        subject: "Reset Your Ziggy Password",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="${baseStyles}">
            <div style="${containerStyles}">
              <div style="${headerStyles}">
                <div style="${logoStyles}">ZIGGY</div>
                <div style="color: #888; font-size: 14px;">Online Debate Platform</div>
              </div>
              
              <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Reset Your Password</h1>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to set a new password.
              </p>
              
              <div style="text-align: center;">
                <a href="${confirmLink}" style="${buttonStyles}">Reset Password</a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
                <br><a href="${confirmLink}" style="color: #dc2626; word-break: break-all;">${confirmLink}</a>
              </p>
              
              <p style="color: #888; font-size: 14px;">
                This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
              </p>
              
              <div style="${footerStyles}">
                <p>© 2011-2025 Ziggy Online Debate. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "magiclink":
      return {
        subject: "Your Ziggy Login Link",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="${baseStyles}">
            <div style="${containerStyles}">
              <div style="${headerStyles}">
                <div style="${logoStyles}">ZIGGY</div>
                <div style="color: #888; font-size: 14px;">Online Debate Platform</div>
              </div>
              
              <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Your Login Link</h1>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                Click the button below to log in to your Ziggy account.
              </p>
              
              <div style="text-align: center;">
                <a href="${confirmLink}" style="${buttonStyles}">Log In to Ziggy</a>
              </div>
              
              <p style="color: #888; font-size: 14px;">
                This link will expire in 1 hour.
              </p>
              
              <div style="${footerStyles}">
                <p>© 2011-2025 Ziggy Online Debate. All rights reserved.</p>
                <p>If you didn't request this link, please ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "email_change":
      return {
        subject: "Confirm Your New Email Address - Ziggy",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="${baseStyles}">
            <div style="${containerStyles}">
              <div style="${headerStyles}">
                <div style="${logoStyles}">ZIGGY</div>
                <div style="color: #888; font-size: 14px;">Online Debate Platform</div>
              </div>
              
              <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Confirm Email Change</h1>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                Please confirm your new email address by clicking the button below.
              </p>
              
              <div style="text-align: center;">
                <a href="${confirmLink}" style="${buttonStyles}">Confirm New Email</a>
              </div>
              
              <p style="color: #888; font-size: 14px;">
                If you didn't request this change, please contact support immediately.
              </p>
              
              <div style="${footerStyles}">
                <p>© 2011-2025 Ziggy Online Debate. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Ziggy Online Debate - Email Confirmation",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="${baseStyles}">
            <div style="${containerStyles}">
              <div style="${headerStyles}">
                <div style="${logoStyles}">ZIGGY</div>
                <div style="color: #888; font-size: 14px;">Online Debate Platform</div>
              </div>
              
              <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                Please click the button below to confirm your action.
              </p>
              
              <div style="text-align: center;">
                <a href="${confirmLink}" style="${buttonStyles}">Confirm</a>
              </div>
              
              <div style="${footerStyles}">
                <p>© 2011-2025 Ziggy Online Debate. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEmailRequest = await req.json();
    const { type, email, token_hash, redirect_to, user_metadata } = payload;

    console.log(`Processing ${type} email for ${email}`);

    // Build the confirmation link
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://kiummwyxeleejbwapssa.supabase.co";
    const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${redirect_to || 'https://kiummwyxeleejbwapssa.lovable.app/'}`;

    const userName = user_metadata?.first_name || user_metadata?.name;
    const { subject, html } = getEmailContent(type, confirmLink, userName);

    const { data, error } = await resend.emails.send({
      from: "Ziggy Online Debate <noreply@resend.dev>",
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-custom-auth-email function:", error);
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
