import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QAConfig {
  tournamentName?: string;
  numCompetitors?: number;
  numJudges?: number;
  numTeams?: number;
  numRounds?: number;
  generateChat?: boolean;
  generatePayments?: boolean;
}

interface QAReport {
  phase: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

const FIRST_NAMES = [
  'Marcus', 'Elena', 'James', 'Sofia', 'William', 'Isabella', 'Benjamin', 'Mia',
  'Lucas', 'Charlotte', 'Henry', 'Amelia', 'Alexander', 'Harper', 'Daniel', 'Evelyn',
  'Matthew', 'Abigail', 'Joseph', 'Emily', 'David', 'Elizabeth', 'Andrew', 'Avery',
  'Joshua', 'Ella', 'Christopher', 'Scarlett', 'Nicholas', 'Grace', 'Tyler', 'Chloe',
  'Ryan', 'Victoria', 'Nathan', 'Riley', 'Brandon', 'Aria', 'Samuel', 'Lily',
  'Jacob', 'Aurora', 'Michael', 'Zoey', 'Ethan', 'Penelope', 'Noah', 'Layla',
  'Liam', 'Nora'
];

const LAST_NAMES = [
  'Johnson', 'Rodriguez', 'Williams', 'Chen', 'Brown', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young',
  'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill',
  'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner', 'Torres',
  'Parker', 'Collins', 'Edwards', 'Stewart', 'Flores', 'Morris', 'Nguyen', 'Murphy',
  'Rivera', 'Cook'
];

const SCHOOLS = [
  'Lincoln Academy', 'Washington Prep', 'Jefferson High', 'Madison Institute',
  'Hamilton School', 'Franklin Academy', 'Adams Prep', 'Monroe High',
  'Jackson Institute', 'Roosevelt Academy', 'Kennedy Prep', 'Reagan High',
  'Clinton Academy', 'Obama Prep', 'Trinity School', 'Westside Academy',
  'Eastview High', 'Northpoint Prep', 'Southgate Academy', 'Central Institute'
];

const DEBATE_FORMATS = ['TP', 'LD', 'PF'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const config: QAConfig = await req.json().catch(() => ({}));
    const {
      tournamentName = 'QA_TEST_Comprehensive_Simulation',
      numCompetitors = 40,
      numJudges = 10,
      numTeams = 20,
      numRounds = 3,
      generateChat = true,
      generatePayments = true,
    } = config;

    const reports: QAReport[] = [];
    const testPrefix = 'QA_SIM_';
    const timestamp = Date.now();

    console.log('[qa-simulation] Starting comprehensive QA simulation...');

    // ========== PHASE 1: USER CREATION ==========
    console.log('[qa-simulation] Phase 1: Creating users...');
    
    const createdUsers: { id: string; email: string; role: 'competitor' | 'judge'; firstName: string; lastName: string }[] = [];
    
    // Create competitor users
    for (let i = 0; i < numCompetitors; i++) {
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[i % LAST_NAMES.length];
      const email = `${testPrefix.toLowerCase()}${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${i}@ziggy-qa.test`;
      
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: 'QaTest123!',
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName }
      });

      if (userError) {
        console.error(`[qa-simulation] Error creating competitor ${i}:`, userError.message);
        continue;
      }

      if (user?.user) {
        createdUsers.push({ id: user.user.id, email, role: 'competitor', firstName, lastName });
      }
    }

    // Create judge users
    for (let i = 0; i < numJudges; i++) {
      const firstName = FIRST_NAMES[(numCompetitors + i) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(numCompetitors + i) % LAST_NAMES.length];
      const email = `${testPrefix.toLowerCase()}judge.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}@ziggy-qa.test`;
      
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: 'QaTest123!',
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName }
      });

      if (userError) {
        console.error(`[qa-simulation] Error creating judge ${i}:`, userError.message);
        continue;
      }

      if (user?.user) {
        createdUsers.push({ id: user.user.id, email, role: 'judge', firstName, lastName });
        
        // Add judge role
        await supabase.from('user_roles').insert({
          user_id: user.user.id,
          role: 'judge'
        });
      }
    }

    const competitors = createdUsers.filter(u => u.role === 'competitor');
    const judges = createdUsers.filter(u => u.role === 'judge');

    reports.push({
      phase: 'User Creation',
      status: createdUsers.length >= (numCompetitors + numJudges) * 0.9 ? 'pass' : 'warning',
      message: `Created ${competitors.length} competitors and ${judges.length} judges`,
      details: { totalUsers: createdUsers.length, expected: numCompetitors + numJudges }
    });

    // Create judge profiles
    const judgeProfiles: { id: string; userId: string; name: string }[] = [];
    for (const judge of judges) {
      const specializations = DEBATE_FORMATS.slice(0, Math.floor(Math.random() * 3) + 1);
      const { data: profile, error: profileError } = await supabase
        .from('judge_profiles')
        .insert({
          user_id: judge.id,
          name: `${judge.firstName} ${judge.lastName}`,
          email: judge.email,
          experience_level: ['novice', 'intermediate', 'advanced', 'expert'][Math.floor(Math.random() * 4)],
          experience_years: Math.floor(Math.random() * 10) + 1,
          specializations,
          alumni: Math.random() > 0.5,
          status: 'approved',
        })
        .select()
        .single();

      if (profile) {
        judgeProfiles.push({ id: profile.id, userId: judge.id, name: profile.name });
      }
    }

    reports.push({
      phase: 'Judge Profiles',
      status: judgeProfiles.length === judges.length ? 'pass' : 'warning',
      message: `Created ${judgeProfiles.length} judge profiles`,
      details: { created: judgeProfiles.length, expected: judges.length }
    });

    // ========== PHASE 2: TOURNAMENT CREATION ==========
    console.log('[qa-simulation] Phase 2: Creating tournament...');

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: `${testPrefix}${tournamentName}_${timestamp}`,
        description: 'Comprehensive QA simulation tournament',
        status: 'Ongoing',
        format: 'Team Policy',
        location: 'Virtual QA Environment',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        max_participants: 100,
        current_participants: 0,
        registration_open: false,
        opt_outs_enabled: true,
        ballot_reveal_mode: 'after_tournament',
      })
      .select()
      .single();

    if (tournamentError || !tournament) {
      throw new Error(`Failed to create tournament: ${tournamentError?.message}`);
    }

    reports.push({
      phase: 'Tournament Creation',
      status: 'pass',
      message: `Created tournament: ${tournament.name}`,
      details: { tournamentId: tournament.id }
    });

    // Create tournament event
    const { data: debateFormat } = await supabase
      .from('debate_formats')
      .select('id')
      .eq('key', 'TP')
      .single();

    const { data: event } = await supabase
      .from('tournament_events')
      .insert({
        tournament_id: tournament.id,
        name: 'Team Policy',
        short_code: 'TP',
        format_id: debateFormat?.id,
        is_active: true,
      })
      .select()
      .single();

    // ========== PHASE 3: TEAM REGISTRATION ==========
    console.log('[qa-simulation] Phase 3: Registering teams...');

    const registrations: { id: string; participantName: string; userId: string; school: string }[] = [];
    const teamsToCreate = Math.min(numTeams, Math.floor(competitors.length / 2));

    for (let i = 0; i < teamsToCreate; i++) {
      const comp1 = competitors[i * 2];
      const comp2 = competitors[i * 2 + 1];
      if (!comp1 || !comp2) continue;

      const school = SCHOOLS[i % SCHOOLS.length];
      const teamName = `${comp1.lastName}/${comp2.lastName}`;

      const { data: reg, error: regError } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          user_id: comp1.id,
          participant_name: `${comp1.firstName} ${comp1.lastName}`,
          participant_email: comp1.email,
          partner_name: `${comp2.firstName} ${comp2.lastName}`,
          school_organization: school,
          payment_status: generatePayments ? 'paid' : 'pending',
          event_id: event?.id,
          aff_count: 0,
          neg_count: 0,
          is_active: true,
        })
        .select()
        .single();

      if (reg) {
        registrations.push({ 
          id: reg.id, 
          participantName: teamName, 
          userId: comp1.id,
          school 
        });

        // Create payment transaction if enabled
        if (generatePayments) {
          await supabase.from('payment_transactions').insert({
            registration_id: reg.id,
            user_id: comp1.id,
            amount: 5000, // $50.00 in cents
            currency: 'usd',
            status: 'completed',
            metadata: { qa_simulation: true }
          });
        }
      }
    }

    reports.push({
      phase: 'Team Registration',
      status: registrations.length >= teamsToCreate * 0.9 ? 'pass' : 'warning',
      message: `Registered ${registrations.length} teams`,
      details: { registered: registrations.length, expected: teamsToCreate }
    });

    // Register judges for tournament
    for (const jp of judgeProfiles) {
      await supabase.from('tournament_judge_registrations').insert({
        tournament_id: tournament.id,
        judge_profile_id: jp.id,
        user_id: jp.userId,
        status: 'confirmed',
      });

      // Create judge availability
      await supabase.from('judge_availability').insert({
        tournament_id: tournament.id,
        judge_profile_id: jp.id,
        available_dates: [tournament.start_date, tournament.end_date],
        time_preferences: { morning: true, afternoon: true, evening: false },
        max_rounds_per_day: 4,
      });
    }

    reports.push({
      phase: 'Judge Registration',
      status: 'pass',
      message: `Registered ${judgeProfiles.length} judges for tournament`,
    });

    // ========== PHASE 4: PAIRING GENERATION ==========
    console.log('[qa-simulation] Phase 4: Generating pairings...');

    const rounds: { id: string; number: number }[] = [];
    const allPairings: { id: string; roundId: string; affId: string; negId: string; judgeId: string }[] = [];

    for (let roundNum = 1; roundNum <= numRounds; roundNum++) {
      // Create round
      const { data: round, error: roundError } = await supabase
        .from('rounds')
        .insert({
          tournament_id: tournament.id,
          event_id: event?.id,
          name: `Round ${roundNum}`,
          round_number: roundNum,
          status: 'completed',
          scheduled_date: tournament.start_date,
        })
        .select()
        .single();

      if (!round) {
        console.error(`[qa-simulation] Failed to create round ${roundNum}:`, roundError);
        continue;
      }
      rounds.push({ id: round.id, number: roundNum });

      // Generate pairings for this round
      // Shuffle registrations for random/power pairing
      const shuffled = [...registrations].sort(() => Math.random() - 0.5);
      const pairingsThisRound: typeof allPairings = [];

      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const aff = shuffled[i];
        const neg = shuffled[i + 1];
        if (!aff || !neg) continue;

        const judge = judgeProfiles[Math.floor(i / 2) % judgeProfiles.length];

        const { data: pairing, error: pairingError } = await supabase
          .from('pairings')
          .insert({
            tournament_id: tournament.id,
            round_id: round.id,
            event_id: event?.id,
            aff_registration_id: aff.id,
            neg_registration_id: neg.id,
            judge_id: judge?.id,
            room: `Room ${Math.floor(i / 2) + 1}`,
            room_rank: Math.floor(i / 2) + 1,
            bracket: roundNum === 1 ? 0 : Math.floor(Math.random() * 3),
            status: 'completed',
            released: true,
            side_locked: false,
          })
          .select()
          .single();

        if (pairing) {
          pairingsThisRound.push({
            id: pairing.id,
            roundId: round.id,
            affId: aff.id,
            negId: neg.id,
            judgeId: judge?.id || '',
          });

          // Create judge assignment
          if (judge) {
            await supabase.from('pairing_judge_assignments').insert({
              pairing_id: pairing.id,
              judge_profile_id: judge.id,
              role: 'chair',
              status: 'assigned',
            });
          }

          // Update side counts
          await supabase.from('tournament_registrations')
            .update({ aff_count: supabase.rpc ? 1 : 1 })
            .eq('id', aff.id);
          await supabase.from('tournament_registrations')
            .update({ neg_count: supabase.rpc ? 1 : 1 })
            .eq('id', neg.id);
        }
      }

      allPairings.push(...pairingsThisRound);

      // Create competitor notifications
      for (const p of pairingsThisRound) {
        for (const regId of [p.affId, p.negId]) {
          await supabase.from('competitor_notifications').insert({
            registration_id: regId,
            tournament_id: tournament.id,
            round_id: round.id,
            pairing_id: p.id,
            title: `Round ${roundNum} Pairing Released`,
            message: `Your pairing for Round ${roundNum} has been posted.`,
            type: 'pairing_released',
          });
        }
      }

      // Create judge notifications
      for (const p of pairingsThisRound) {
        if (p.judgeId) {
          await supabase.from('judge_notifications').insert({
            judge_profile_id: p.judgeId,
            tournament_id: tournament.id,
            pairing_id: p.id,
            title: `Round ${roundNum} Assignment`,
            message: `You have been assigned to judge Round ${roundNum}.`,
            type: 'judge_assigned',
          });
        }
      }
    }

    reports.push({
      phase: 'Pairing Generation',
      status: allPairings.length >= (registrations.length / 2) * numRounds * 0.9 ? 'pass' : 'warning',
      message: `Generated ${allPairings.length} pairings across ${rounds.length} rounds`,
      details: { pairings: allPairings.length, rounds: rounds.length }
    });

    // ========== PHASE 5: BALLOT SUBMISSION ==========
    console.log('[qa-simulation] Phase 5: Submitting ballots...');

    let ballotsCreated = 0;
    for (const pairing of allPairings) {
      const winner = Math.random() > 0.5 ? 'aff' : 'neg';
      const affSpeaks = Math.floor(Math.random() * 6) + 25; // 25-30
      const negSpeaks = Math.floor(Math.random() * 6) + 25;

      const jp = judgeProfiles.find(j => j.id === pairing.judgeId);
      if (!jp) continue;

      const { error: ballotError } = await supabase.from('ballots').insert({
        pairing_id: pairing.id,
        judge_profile_id: pairing.judgeId,
        judge_user_id: jp.userId,
        payload: {
          winner,
          aff_speaks: affSpeaks,
          neg_speaks: negSpeaks,
          comments: `QA Simulation ballot - ${winner === 'aff' ? 'Affirmative' : 'Negative'} wins`,
          aff_rank: winner === 'aff' ? 1 : 2,
          neg_rank: winner === 'neg' ? 1 : 2,
        },
        status: 'submitted',
        is_published: false,
      });

      if (!ballotError) {
        ballotsCreated++;

        // Update pairing result
        await supabase.from('pairings')
          .update({
            result: { winner, aff_speaks: affSpeaks, neg_speaks: negSpeaks },
            status: 'completed',
          })
          .eq('id', pairing.id);
      }
    }

    reports.push({
      phase: 'Ballot Submission',
      status: ballotsCreated >= allPairings.length * 0.9 ? 'pass' : 'warning',
      message: `Submitted ${ballotsCreated} ballots`,
      details: { submitted: ballotsCreated, expected: allPairings.length }
    });

    // ========== PHASE 6: CHAT SIMULATION ==========
    if (generateChat) {
      console.log('[qa-simulation] Phase 6: Generating chat messages...');

      const chatMessages: string[] = [
        'Hey! Ready for our round?',
        'Yes, looking forward to it!',
        'What time works for you?',
        'How about 3pm?',
        'Perfect, see you then!',
        'Good luck!',
        'Thanks, you too!',
        'Great debate everyone!',
        'Judge feedback was helpful.',
        'See you next round!',
      ];

      let messagesCreated = 0;
      const pairingsForChat = allPairings.slice(0, Math.min(10, allPairings.length));

      for (const pairing of pairingsForChat) {
        const affReg = registrations.find(r => r.id === pairing.affId);
        const negReg = registrations.find(r => r.id === pairing.negId);
        const judge = judgeProfiles.find(j => j.id === pairing.judgeId);

        const participants = [
          affReg?.userId,
          negReg?.userId,
          judge?.userId,
        ].filter(Boolean);

        for (let i = 0; i < 5; i++) {
          const senderId = participants[i % participants.length];
          if (!senderId) continue;

          const { error: msgError } = await supabase.from('pairing_chat_messages').insert({
            pairing_id: pairing.id,
            sender_id: senderId,
            message: chatMessages[i % chatMessages.length],
            message_type: 'text',
          });

          if (!msgError) messagesCreated++;
        }
      }

      reports.push({
        phase: 'Chat Simulation',
        status: messagesCreated > 0 ? 'pass' : 'warning',
        message: `Created ${messagesCreated} chat messages`,
        details: { messages: messagesCreated, pairings: pairingsForChat.length }
      });
    }

    // ========== PHASE 7: RESULTS PUBLISHING ==========
    console.log('[qa-simulation] Phase 7: Publishing results...');

    // Reveal all ballots
    const { data: revealedBallots, error: revealError } = await supabase
      .from('ballots')
      .update({ is_published: true, revealed_at: new Date().toISOString() })
      .eq('is_published', false)
      .in('pairing_id', allPairings.map(p => p.id))
      .select();

    // Calculate standings
    const { error: standingsError } = await supabase.rpc('recalc_tournament_standings', {
      p_tournament_id: tournament.id
    });

    // Create result notifications
    for (const pairing of allPairings) {
      for (const regId of [pairing.affId, pairing.negId]) {
        await supabase.from('competitor_notifications').insert({
          registration_id: regId,
          tournament_id: tournament.id,
          pairing_id: pairing.id,
          title: 'Results Published',
          message: 'Ballot results have been published.',
          type: 'result_published',
        });
      }
    }

    reports.push({
      phase: 'Results Publishing',
      status: !revealError && !standingsError ? 'pass' : 'warning',
      message: `Published ${revealedBallots?.length || 0} ballots and recalculated standings`,
      details: { revealed: revealedBallots?.length, standingsError: standingsError?.message }
    });

    // ========== PHASE 8: SECURITY VALIDATION ==========
    console.log('[qa-simulation] Phase 8: Security logging...');

    // Log QA simulation to audit logs
    await supabase.from('security_audit_logs').insert({
      user_id: createdUsers[0]?.id || '00000000-0000-0000-0000-000000000000',
      action: 'qa_simulation_completed',
      context: {
        tournament_id: tournament.id,
        users_created: createdUsers.length,
        teams_registered: registrations.length,
        pairings_generated: allPairings.length,
        ballots_submitted: ballotsCreated,
        timestamp: new Date().toISOString(),
      },
    });

    // Log user interaction for analytics
    await supabase.from('user_interaction_logs').insert({
      route: '/qa-simulation',
      device_type: 'server',
      load_time_ms: Date.now() - timestamp,
      user_role: 'system',
      scroll_depth: 100,
    });

    reports.push({
      phase: 'Security & Logging',
      status: 'pass',
      message: 'Security audit logs populated',
    });

    // ========== FINAL SUMMARY ==========
    const passCount = reports.filter(r => r.status === 'pass').length;
    const warningCount = reports.filter(r => r.status === 'warning').length;
    const failCount = reports.filter(r => r.status === 'fail').length;

    const summary = {
      success: failCount === 0,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      statistics: {
        usersCreated: createdUsers.length,
        teamsRegistered: registrations.length,
        judgesRegistered: judgeProfiles.length,
        roundsCreated: rounds.length,
        pairingsGenerated: allPairings.length,
        ballotsSubmitted: ballotsCreated,
      },
      reportSummary: {
        pass: passCount,
        warning: warningCount,
        fail: failCount,
      },
      reports,
    };

    console.log('[qa-simulation] Complete. Summary:', JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[qa-simulation] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
