import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { templateId, recipientEmail } = await req.json();
    
    if (!templateId || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'templateId and recipientEmail are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get email provider settings
    const { data: providerSettings } = await supabase
      .from('email_provider_settings')
      .select('*')
      .eq('singleton', true)
      .single();

    // Replace test variables in template
    const testVariables = {
      participant_name: 'Test User',
      tournament_name: 'Test Tournament',
      tournament_date: new Date().toLocaleDateString(),
      registration_fee: '$50.00',
      payment_link: 'https://example.com/pay',
    };

    let htmlContent = template.html;
    let subject = template.subject;
    
    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    // Log the test email (actual sending would require Resend/SendGrid API key)
    console.log('Test email prepared:', {
      to: recipientEmail,
      subject: subject,
      from: template.from_email || providerSettings?.from_email || 'noreply@ziggy.debate',
      template_key: template.template_key,
    });

    // For now, we'll simulate success since no email provider is configured
    // In production, this would call Resend/SendGrid API
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email prepared for ${recipientEmail}`,
        preview: {
          subject,
          to: recipientEmail,
          from: template.from_email || 'noreply@ziggy.debate',
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-test-email:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
