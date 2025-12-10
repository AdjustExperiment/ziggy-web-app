import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const testPrefix = 'QA_TEST_';
    const now = new Date().toISOString();

    console.log('[seed-test-data] Starting test data creation...');

    // 1. Create test tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: `${testPrefix}Multi-Format Open`,
        description: 'Test tournament for QA simulation',
        status: 'Ongoing',
        format: 'Team Policy',
        location: 'Virtual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        max_participants: 100,
        current_participants: 0,
        registration_open: true,
        opt_outs_enabled: true,
      })
      .select()
      .single();

    if (tournamentError) {
      console.error('[seed-test-data] Error creating tournament:', tournamentError);
      throw tournamentError;
    }
    console.log('[seed-test-data] Created tournament:', tournament.id);

    // 2. Create test debate formats if they don't exist
    const formats = ['TP', 'LD', 'PF'];
    for (const formatKey of formats) {
      const { error: formatError } = await supabase
        .from('debate_formats')
        .upsert({
          key: formatKey,
          name: formatKey === 'TP' ? 'Team Policy' : formatKey === 'LD' ? 'Lincoln-Douglas' : 'Public Forum',
          description: `${formatKey} debate format`,
          uses_resolution: true,
          rules: { prep_time: formatKey === 'PF' ? 2 : 5 }
        }, { onConflict: 'key' });

      if (formatError) {
        console.error('[seed-test-data] Error creating format:', formatError);
      }
    }

    // 3. Create tournament events for each format
    const eventIds: Record<string, string> = {};
    for (const formatKey of formats) {
      const { data: formatData } = await supabase
        .from('debate_formats')
        .select('id')
        .eq('key', formatKey)
        .single();

      if (formatData) {
        const { data: event, error: eventError } = await supabase
          .from('tournament_events')
          .insert({
            tournament_id: tournament.id,
            name: formatKey,
            short_code: formatKey,
            format_id: formatData.id,
            is_active: true,
          })
          .select()
          .single();

        if (event) {
          eventIds[formatKey] = event.id;
          console.log(`[seed-test-data] Created event for ${formatKey}:`, event.id);
        }
      }
    }

    // 4. Create test rounds (2 rounds per event)
    for (const [formatKey, eventId] of Object.entries(eventIds)) {
      for (let i = 1; i <= 2; i++) {
        const { error: roundError } = await supabase
          .from('rounds')
          .insert({
            tournament_id: tournament.id,
            event_id: eventId,
            name: `${formatKey} Round ${i}`,
            round_number: i,
            status: i === 1 ? 'completed' : 'upcoming',
            scheduled_date: new Date().toISOString().split('T')[0],
          });

        if (roundError) {
          console.error('[seed-test-data] Error creating round:', roundError);
        }
      }
    }
    console.log('[seed-test-data] Created rounds');

    // 5. Create test judge profiles
    const judgeNames = [
      { name: `${testPrefix}Judge Alpha`, specializations: ['TP', 'LD'], alumni: true },
      { name: `${testPrefix}Judge Beta`, specializations: ['TP', 'PF'], alumni: false },
      { name: `${testPrefix}Judge Gamma`, specializations: ['LD', 'PF'], alumni: true },
      { name: `${testPrefix}Judge Delta`, specializations: ['TP', 'LD', 'PF'], alumni: false },
    ];

    const judgeProfiles: string[] = [];
    for (const judge of judgeNames) {
      const { data: profile, error: judgeError } = await supabase
        .from('judge_profiles')
        .insert({
          name: judge.name,
          email: `${judge.name.replace(/\s+/g, '.').toLowerCase()}@test.qa`,
          experience_level: 'advanced',
          experience_years: 5,
          specializations: judge.specializations,
          alumni: judge.alumni,
          status: 'approved',
        })
        .select()
        .single();

      if (profile) {
        judgeProfiles.push(profile.id);
        console.log('[seed-test-data] Created judge:', profile.name);
      }
    }

    // 6. Create test sponsor profile
    const { data: sponsorProfile, error: sponsorError } = await supabase
      .from('sponsor_profiles')
      .insert({
        name: `${testPrefix}Test Sponsor Corp`,
        description: 'Test sponsor for QA simulation',
        website: 'https://test-sponsor.example.com',
        is_approved: true,
        approved_tier: 'gold',
        blog_posts_limit: 5,
        blog_posts_used: 0,
      })
      .select()
      .single();

    if (sponsorProfile) {
      console.log('[seed-test-data] Created sponsor profile:', sponsorProfile.id);

      // Link sponsor to tournament
      await supabase
        .from('tournament_sponsor_links')
        .insert({
          tournament_id: tournament.id,
          sponsor_profile_id: sponsorProfile.id,
          tier: 'gold',
          is_primary: true,
        });
    }

    // 7. Create tabulation settings
    const { error: tabError } = await supabase
      .from('tournament_tabulation_settings')
      .insert({
        tournament_id: tournament.id,
        draw_method: 'power_paired',
        side_method: 'balance',
        avoid_rematches: true,
        club_protect: true,
        judges_per_room: 1,
        auto_judge_assignment: true,
      });

    if (tabError) {
      console.error('[seed-test-data] Error creating tab settings:', tabError);
    }

    // Summary
    const summary = {
      tournament: { id: tournament.id, name: tournament.name },
      events: Object.keys(eventIds).length,
      rounds: Object.keys(eventIds).length * 2,
      judges: judgeProfiles.length,
      sponsor: sponsorProfile ? sponsorProfile.name : null,
    };

    console.log('[seed-test-data] Complete. Summary:', summary);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test data created successfully',
        data: summary
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[seed-test-data] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
