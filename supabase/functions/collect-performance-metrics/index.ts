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

    const metrics = await req.json();
    
    // Validate required fields
    if (!metrics.route) {
      return new Response(
        JSON.stringify({ error: 'Route is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert metrics into database
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        user_id: metrics.user_id || null,
        session_id: metrics.session_id || null,
        route: metrics.route,
        fcp: metrics.fcp || null,
        lcp: metrics.lcp || null,
        cls: metrics.cls || null,
        ttfb: metrics.ttfb || null,
        fid: metrics.fid || null,
        inp: metrics.inp || null,
        device_type: metrics.device_type || null,
        connection_type: metrics.connection_type || null,
        user_agent: metrics.user_agent || null,
      });

    if (error) {
      console.error('Error inserting metrics:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store metrics' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Performance metrics collected for route:', metrics.route);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in collect-performance-metrics:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
