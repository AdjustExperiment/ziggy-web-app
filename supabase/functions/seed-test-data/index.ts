import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeedConfig {
  createUsers?: boolean;
  numUsers?: number;
  createTournament?: boolean;
  createJudges?: boolean;
  createSponsor?: boolean;
}

const FIRST_NAMES = [
  'Marcus', 'Elena', 'James', 'Sofia', 'William', 'Isabella', 'Benjamin', 'Mia',
  'Lucas', 'Charlotte', 'Henry', 'Amelia', 'Alexander', 'Harper', 'Daniel', 'Evelyn',
  'Matthew', 'Abigail', 'Joseph', 'Emily', 'David', 'Elizabeth', 'Andrew', 'Avery',
];

const LAST_NAMES = [
  'Johnson', 'Rodriguez', 'Williams', 'Chen', 'Brown', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const config: SeedConfig = await req.json().catch(() => ({}));
    const {
      createUsers = false,
      numUsers = 10,
      createTournament = true,
      createJudges = true,
      createSponsor = true,
    } = config;

    const testPrefix = 'QA_TEST_';
    const timestamp = Date.now();
    const results: Record<string, unknown> = {};

    console.log('[seed-test-data] Starting test data creation...', config);

    // ========== USER CREATION (Optional) ==========
    if (createUsers) {
      console.log(`[seed-test-data] Creating ${numUsers} test users...`);
      const createdUsers: { id: string; email: string }[] = [];

      for (let i = 0; i < numUsers; i++) {
        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = LAST_NAMES[i % LAST_NAMES.length];
        const email = `${testPrefix.toLowerCase()}${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${i}@test.qa`;

        const { data: user, error: userError } = await supabase.auth.admin.createUser({
          email,
          password: 'TestPass123!',
          email_confirm: true,
          user_metadata: { first_name: firstName, last_name: lastName }
        });

        if (user?.user) {
          createdUsers.push({ id: user.user.id, email });
        } else if (userError) {
          console.error(`[seed-test-data] User creation error:`, userError.message);
        }
      }

      results.users = { created: createdUsers.length, emails: createdUsers.map(u => u.email) };
      console.log(`[seed-test-data] Created ${createdUsers.length} users`);
    }

    // ========== TOURNAMENT CREATION ==========
    let tournament: { id: string; name: string } | null = null;
    if (createTournament) {
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name: `${testPrefix}Multi-Format Open ${timestamp}`,
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

      tournament = tournamentData;
      results.tournament = { id: tournament.id, name: tournament.name };
      console.log('[seed-test-data] Created tournament:', tournament.id);

      // Create debate formats if they don't exist
      const formats = ['TP', 'LD', 'PF'];
      for (const formatKey of formats) {
        await supabase
          .from('debate_formats')
          .upsert({
            key: formatKey,
            name: formatKey === 'TP' ? 'Team Policy' : formatKey === 'LD' ? 'Lincoln-Douglas' : 'Public Forum',
            description: `${formatKey} debate format`,
            uses_resolution: true,
            rules: { prep_time: formatKey === 'PF' ? 2 : 5 }
          }, { onConflict: 'key' });
      }

      // Create tournament events for each format
      const eventIds: Record<string, string> = {};
      for (const formatKey of formats) {
        const { data: formatData } = await supabase
          .from('debate_formats')
          .select('id')
          .eq('key', formatKey)
          .single();

        if (formatData) {
          const { data: event } = await supabase
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
          }
        }
      }
      results.events = eventIds;

      // Create rounds (2 rounds per event)
      const roundsCreated: string[] = [];
      for (const [formatKey, eventId] of Object.entries(eventIds)) {
        for (let i = 1; i <= 2; i++) {
          const { data: round } = await supabase
            .from('rounds')
            .insert({
              tournament_id: tournament.id,
              event_id: eventId,
              name: `${formatKey} Round ${i}`,
              round_number: i,
              status: i === 1 ? 'completed' : 'upcoming',
              scheduled_date: new Date().toISOString().split('T')[0],
            })
            .select()
            .single();

          if (round) roundsCreated.push(round.id);
        }
      }
      results.rounds = roundsCreated.length;

      // Create tabulation settings
      await supabase
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
    }

    // ========== JUDGE PROFILES ==========
    const judgeProfiles: string[] = [];
    if (createJudges) {
      const judgeNames = [
        { name: `${testPrefix}Judge Alpha`, specializations: ['TP', 'LD'], alumni: true },
        { name: `${testPrefix}Judge Beta`, specializations: ['TP', 'PF'], alumni: false },
        { name: `${testPrefix}Judge Gamma`, specializations: ['LD', 'PF'], alumni: true },
        { name: `${testPrefix}Judge Delta`, specializations: ['TP', 'LD', 'PF'], alumni: false },
      ];

      for (const judge of judgeNames) {
        const { data: profile } = await supabase
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

          // Create judge availability if tournament exists
          if (tournament) {
            await supabase.from('judge_availability').insert({
              tournament_id: tournament.id,
              judge_profile_id: profile.id,
              available_dates: [new Date().toISOString().split('T')[0]],
              time_preferences: { morning: true, afternoon: true },
              max_rounds_per_day: 4,
            });
          }
        }
      }
      results.judges = judgeProfiles.length;
    }

    // ========== SPONSOR PROFILE ==========
    if (createSponsor) {
      const { data: sponsorProfile } = await supabase
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

      if (sponsorProfile && tournament) {
        await supabase
          .from('tournament_sponsor_links')
          .insert({
            tournament_id: tournament.id,
            sponsor_profile_id: sponsorProfile.id,
            tier: 'gold',
            is_primary: true,
          });
        results.sponsor = sponsorProfile.id;
      }
    }

    // ========== SUMMARY ==========
    const summary = {
      success: true,
      message: 'Test data created successfully',
      data: results,
    };

    console.log('[seed-test-data] Complete. Summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[seed-test-data] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
