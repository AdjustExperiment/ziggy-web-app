
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JudgeNotificationRequest {
  judge_profile_id: string;
  tournament_name: string;
  participant_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { judge_profile_id, tournament_name, participant_name }: JudgeNotificationRequest = await req.json();

    // Get judge profile
    const { data: judgeProfile, error: judgeError } = await supabase
      .from('judge_profiles')
      .select('name, email')
      .eq('id', judge_profile_id)
      .single();

    if (judgeError || !judgeProfile) {
      throw new Error('Judge profile not found');
    }

    // This is a placeholder for email sending
    // In a real implementation, you would use Resend or another email service
    console.log(`Would send email to ${judgeProfile.email}:`);
    console.log(`Subject: You've been requested to judge ${tournament_name}`);
    console.log(`Body: ${participant_name} has requested you to judge ${tournament_name}. Please update your availability.`);

    // For now, we'll just log the notification
    // You can implement actual email sending using Resend when ready

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Judge notification logged (email integration pending)' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-judge-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
