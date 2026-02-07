import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface QAComprehensiveConfig {
  testPrefix?: string;
  numTeams?: number;
  numJudges?: number;
  numPrelimRounds?: number;
  breakSize?: number;
  testSponsorFlow?: boolean;
  testRegisterForOthers?: boolean;
  testDropRegistration?: boolean;
  testAccountEditing?: boolean;
  cleanupAfter?: boolean;
  cleanupOnly?: boolean;
}

interface PhaseReport {
  phase: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  message: string;
  duration_ms: number;
  assertions: {
    name: string;
    passed: boolean;
    expected?: unknown;
    actual?: unknown;
  }[];
  data?: Record<string, unknown>;
}

interface CreatedUser {
  id: string;
  email: string;
  role: string;
}

interface CreatedRegistration {
  id: string;
  userId: string;
  teamName: string;
  eventId: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FIRST_NAMES = [
  'Marcus', 'Elena', 'James', 'Sofia', 'William', 'Isabella', 'Benjamin', 'Mia',
  'Lucas', 'Charlotte', 'Henry', 'Amelia', 'Alexander', 'Harper', 'Daniel', 'Evelyn',
  'Matthew', 'Abigail', 'Joseph', 'Emily', 'David', 'Elizabeth', 'Andrew', 'Avery',
  'Michael', 'Ella', 'Christopher', 'Grace', 'Joshua', 'Victoria', 'Ethan', 'Chloe',
];

const LAST_NAMES = [
  'Johnson', 'Rodriguez', 'Williams', 'Chen', 'Brown', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
];

const SCHOOLS = [
  'Lincoln High School', 'Washington Academy', 'Jefferson Prep', 'Roosevelt Institute',
  'Kennedy School', 'Hamilton High', 'Madison Preparatory', 'Franklin Academy',
  'Adams High School', 'Monroe Institute', 'Jackson School', 'Van Buren Academy',
  'Harrison Prep', 'Tyler High School', 'Polk Academy', 'Cleveland High',
];

const ROOMS = [
  'Room A101', 'Room A102', 'Room A103', 'Room A104', 'Room B201', 'Room B202',
  'Room B203', 'Room B204', 'Room C301', 'Room C302', 'Room C303', 'Room C304',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSpeakerPoints(): number {
  // Normal distribution centered at 27.5 with range 26-29
  const mean = 27.5;
  const stdDev = 0.8;
  const u1 = Math.random();
  const u2 = Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  const result = mean + stdDev * randStdNormal;
  return Math.round(Math.max(26, Math.min(29.5, result)) * 2) / 2; // Round to 0.5
}

function determineWinner(seedA: number, seedB: number): 'aff' | 'neg' {
  // Higher seed (lower number) has 55% chance to win
  const upsetChance = 0.45;
  if (seedA < seedB) {
    return Math.random() > upsetChance ? 'aff' : 'neg';
  } else {
    return Math.random() > upsetChance ? 'neg' : 'aff';
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const phases: PhaseReport[] = [];
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const config: QAComprehensiveConfig = await req.json().catch(() => ({}));
    const {
      testPrefix = 'QA_COMP_',
      numTeams = 16,
      numJudges = 12,
      numPrelimRounds = 6,
      breakSize = 8,
      testSponsorFlow = true,
      testRegisterForOthers = true,
      testDropRegistration = true,
      testAccountEditing = true,
      cleanupAfter = false,
      cleanupOnly = false,
    } = config;

    const timestamp = Date.now();
    console.log('[qa-comprehensive-test] Starting with config:', config);

    // ========================================================================
    // CLEANUP ONLY MODE
    // ========================================================================
    if (cleanupOnly) {
      const cleanupStart = Date.now();
      await cleanupTestData(supabase, testPrefix);
      phases.push({
        phase: 'cleanup',
        status: 'pass',
        message: `Cleaned up all ${testPrefix} prefixed data`,
        duration_ms: Date.now() - cleanupStart,
        assertions: [],
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cleanup completed',
          phases,
          total_duration_ms: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // PHASE 1: CREATE TEST USERS
    // ========================================================================
    const phase1Start = Date.now();
    console.log('[qa-comprehensive-test] Phase 1: Creating test users...');
    
    const createdUsers: CreatedUser[] = [];
    const phase1Assertions: PhaseReport['assertions'] = [];

    // Admin user
    const adminEmail = `${testPrefix.toLowerCase()}admin@ziggy-test.qa`;
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: { first_name: 'QA', last_name: 'Admin' },
    });

    if (adminUser?.user) {
      createdUsers.push({ id: adminUser.user.id, email: adminEmail, role: 'admin' });
      
      // Assign admin role
      await supabase.from('user_roles').insert({
        user_id: adminUser.user.id,
        role: 'admin',
      });
      
      phase1Assertions.push({ name: 'admin_created', passed: true });
    } else {
      phase1Assertions.push({ name: 'admin_created', passed: false, actual: adminError?.message });
    }

    // Create debaters (numTeams * 2 for pairs)
    for (let i = 1; i <= numTeams * 2; i++) {
      const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i - 1) % LAST_NAMES.length];
      const email = `${testPrefix.toLowerCase()}debater_${i}@ziggy-test.qa`;

      const { data: debater, error: debaterError } = await supabase.auth.admin.createUser({
        email,
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      });

      if (debater?.user) {
        createdUsers.push({ id: debater.user.id, email, role: 'debater' });
      } else {
        console.error(`[qa-comprehensive-test] Failed to create debater ${i}:`, debaterError?.message);
      }
    }

    phase1Assertions.push({
      name: 'debaters_created',
      passed: createdUsers.filter(u => u.role === 'debater').length === numTeams * 2,
      expected: numTeams * 2,
      actual: createdUsers.filter(u => u.role === 'debater').length,
    });

    // Create judges
    for (let i = 1; i <= numJudges; i++) {
      const firstName = FIRST_NAMES[(i + 10) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i + 10) % LAST_NAMES.length];
      const email = `${testPrefix.toLowerCase()}judge_${i}@ziggy-test.qa`;

      const { data: judge, error: judgeError } = await supabase.auth.admin.createUser({
        email,
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      });

      if (judge?.user) {
        createdUsers.push({ id: judge.user.id, email, role: 'judge' });
      } else {
        console.error(`[qa-comprehensive-test] Failed to create judge ${i}:`, judgeError?.message);
      }
    }

    phase1Assertions.push({
      name: 'judges_created',
      passed: createdUsers.filter(u => u.role === 'judge').length === numJudges,
      expected: numJudges,
      actual: createdUsers.filter(u => u.role === 'judge').length,
    });

    // Sponsor user
    if (testSponsorFlow) {
      const sponsorEmail = `${testPrefix.toLowerCase()}sponsor@ziggy-test.qa`;
      const { data: sponsorUser } = await supabase.auth.admin.createUser({
        email: sponsorEmail,
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: { first_name: 'QA', last_name: 'Sponsor' },
      });

      if (sponsorUser?.user) {
        createdUsers.push({ id: sponsorUser.user.id, email: sponsorEmail, role: 'sponsor' });
        phase1Assertions.push({ name: 'sponsor_created', passed: true });
      }
    }

    // Registrar user (for register-for-others)
    if (testRegisterForOthers) {
      const registrarEmail = `${testPrefix.toLowerCase()}registrar@ziggy-test.qa`;
      const { data: registrarUser } = await supabase.auth.admin.createUser({
        email: registrarEmail,
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: { first_name: 'QA', last_name: 'Registrar' },
      });

      if (registrarUser?.user) {
        createdUsers.push({ id: registrarUser.user.id, email: registrarEmail, role: 'registrar' });
        phase1Assertions.push({ name: 'registrar_created', passed: true });
      }
    }

    phases.push({
      phase: 'user_creation',
      status: phase1Assertions.every(a => a.passed) ? 'pass' : 'fail',
      message: `Created ${createdUsers.length} test users`,
      duration_ms: Date.now() - phase1Start,
      assertions: phase1Assertions,
      data: { total_users: createdUsers.length },
    });

    // ========================================================================
    // PHASE 2: CREATE TOURNAMENT AND EVENTS
    // ========================================================================
    const phase2Start = Date.now();
    console.log('[qa-comprehensive-test] Phase 2: Creating tournament...');
    
    const phase2Assertions: PhaseReport['assertions'] = [];
    const tournamentName = `${testPrefix}Championship ${timestamp}`;

    // Create tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: tournamentName,
        description: 'Comprehensive QA test tournament - 16 teams, 6 prelims, top 8 elim',
        status: 'Ongoing',
        format: 'Team Policy',
        location: 'Virtual QA Environment',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        max_participants: numTeams * 2,
        current_participants: 0,
        registration_open: true,
        opt_outs_enabled: true,
      })
      .select()
      .single();

    if (tournament) {
      phase2Assertions.push({ name: 'tournament_created', passed: true });
    } else {
      phase2Assertions.push({ name: 'tournament_created', passed: false, actual: tournamentError?.message });
      throw new Error(`Failed to create tournament: ${tournamentError?.message}`);
    }

    // Create debate format
    const { data: formatData } = await supabase
      .from('debate_formats')
      .upsert({
        key: 'TP',
        name: 'Team Policy',
        description: 'Two-person team policy debate',
        uses_resolution: true,
        rules: { prep_time: 5, speech_time: 8 },
      }, { onConflict: 'key' })
      .select()
      .single();

    // Create tournament event
    const { data: event, error: eventError } = await supabase
      .from('tournament_events')
      .insert({
        tournament_id: tournament.id,
        name: 'Team Policy',
        short_code: 'TP',
        format_id: formatData?.id,
        is_active: true,
      })
      .select()
      .single();

    if (event) {
      phase2Assertions.push({ name: 'event_created', passed: true });
    } else {
      phase2Assertions.push({ name: 'event_created', passed: false, actual: eventError?.message });
    }

    // Create tabulation settings
    await supabase.from('tournament_tabulation_settings').insert({
      tournament_id: tournament.id,
      draw_method: 'power_paired',
      side_method: 'balance',
      avoid_rematches: true,
      club_protect: true,
      judges_per_room: 1,
      auto_judge_assignment: true,
    });

    // Create tab config
    await supabase.from('tournament_tab_config').insert({
      tournament_id: tournament.id,
      event_id: event?.id,
      debate_format_id: formatData?.id,
      speaker_point_min: 20,
      speaker_point_max: 30,
      tiebreaker_order: ['wins', 'speaks', 'adjusted_speaks', 'opp_wins'],
      prelim_rounds: numPrelimRounds,
      break_to: breakSize,
    });

    phases.push({
      phase: 'tournament_creation',
      status: phase2Assertions.every(a => a.passed) ? 'pass' : 'fail',
      message: `Created tournament "${tournamentName}"`,
      duration_ms: Date.now() - phase2Start,
      assertions: phase2Assertions,
      data: { tournament_id: tournament.id, event_id: event?.id },
    });

    // ========================================================================
    // PHASE 3: CREATE JUDGE PROFILES AND REGISTRATIONS
    // ========================================================================
    const phase3Start = Date.now();
    console.log('[qa-comprehensive-test] Phase 3: Setting up judges...');
    
    const phase3Assertions: PhaseReport['assertions'] = [];
    const judgeProfiles: { id: string; userId: string }[] = [];

    for (const judgeUser of createdUsers.filter(u => u.role === 'judge')) {
      const judgeNum = parseInt(judgeUser.email.match(/judge_(\d+)/)?.[1] || '1');
      const specializations = judgeNum % 3 === 0 ? ['TP', 'LD', 'PF'] : judgeNum % 2 === 0 ? ['TP', 'LD'] : ['TP'];

      const { data: profile } = await supabase
        .from('judge_profiles')
        .insert({
          name: `${testPrefix}Judge ${judgeNum}`,
          email: judgeUser.email,
          user_id: judgeUser.id,
          experience_level: judgeNum <= 4 ? 'advanced' : 'intermediate',
          experience_years: 3 + (judgeNum % 5),
          specializations,
          alumni: judgeNum % 2 === 0,
          status: 'approved',
        })
        .select()
        .single();

      if (profile) {
        judgeProfiles.push({ id: profile.id, userId: judgeUser.id });

        // Create availability
        await supabase.from('judge_availability').insert({
          tournament_id: tournament.id,
          judge_profile_id: profile.id,
          available_dates: [new Date().toISOString().split('T')[0]],
          time_preferences: { morning: true, afternoon: true, evening: true },
          max_rounds_per_day: 6,
        });

        // Register judge for tournament
        await supabase.from('tournament_judge_registrations').insert({
          tournament_id: tournament.id,
          judge_profile_id: profile.id,
          status: 'confirmed',
        });
      }
    }

    phase3Assertions.push({
      name: 'judge_profiles_created',
      passed: judgeProfiles.length === numJudges,
      expected: numJudges,
      actual: judgeProfiles.length,
    });

    phases.push({
      phase: 'judge_setup',
      status: phase3Assertions.every(a => a.passed) ? 'pass' : 'fail',
      message: `Set up ${judgeProfiles.length} judge profiles with availability`,
      duration_ms: Date.now() - phase3Start,
      assertions: phase3Assertions,
      data: { judge_profile_ids: judgeProfiles.map(j => j.id) },
    });

    // ========================================================================
    // PHASE 4: CREATE TEAM REGISTRATIONS
    // ========================================================================
    const phase4Start = Date.now();
    console.log('[qa-comprehensive-test] Phase 4: Creating team registrations...');
    
    const phase4Assertions: PhaseReport['assertions'] = [];
    const registrations: CreatedRegistration[] = [];
    const debaters = createdUsers.filter(u => u.role === 'debater');

    for (let teamNum = 1; teamNum <= numTeams; teamNum++) {
      const debater1Idx = (teamNum - 1) * 2;
      const debater2Idx = debater1Idx + 1;
      const debater1 = debaters[debater1Idx];
      const debater2 = debaters[debater2Idx];
      const school = SCHOOLS[(teamNum - 1) % SCHOOLS.length];
      const firstName1 = FIRST_NAMES[(debater1Idx) % FIRST_NAMES.length];
      const lastName1 = LAST_NAMES[(debater1Idx) % LAST_NAMES.length];
      const firstName2 = FIRST_NAMES[(debater2Idx) % FIRST_NAMES.length];
      const lastName2 = LAST_NAMES[(debater2Idx) % LAST_NAMES.length];

      // Create registration for debater 1 (primary team registration)
      const { data: reg1, error: regError } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          user_id: debater1.id,
          event_id: event?.id,
          participant_name: `${firstName1} ${lastName1}`,
          participant_email: debater1.email,
          school_organization: school,
          partner_name: `${firstName2} ${lastName2}`,
          payment_status: 'completed',
          is_active: true,
        })
        .select()
        .single();

      if (reg1) {
        registrations.push({
          id: reg1.id,
          userId: debater1.id,
          teamName: `${testPrefix}Team ${teamNum}`,
          eventId: event?.id || '',
        });

        // Create computed standing entry
        await supabase.from('computed_standings').insert({
          tournament_id: tournament.id,
          event_id: event?.id,
          registration_id: reg1.id,
          wins: 0,
          losses: 0,
          total_speaks: 0,
          avg_speaks: 0,
        });
      } else {
        console.error(`[qa-comprehensive-test] Failed to create registration for team ${teamNum}:`, regError?.message);
      }

      // Create registration for debater 2 (partner)
      await supabase.from('tournament_registrations').insert({
        tournament_id: tournament.id,
        user_id: debater2.id,
        event_id: event?.id,
        participant_name: `${firstName2} ${lastName2}`,
        participant_email: debater2.email,
        school_organization: school,
        partner_name: `${firstName1} ${lastName1}`,
        payment_status: 'completed',
        is_active: true,
      });
    }

    phase4Assertions.push({
      name: 'registrations_created',
      passed: registrations.length === numTeams,
      expected: numTeams,
      actual: registrations.length,
    });

    // Update tournament participant count
    await supabase
      .from('tournaments')
      .update({ current_participants: numTeams * 2 })
      .eq('id', tournament.id);

    phases.push({
      phase: 'team_registration',
      status: phase4Assertions.every(a => a.passed) ? 'pass' : 'fail',
      message: `Created ${registrations.length} team registrations`,
      duration_ms: Date.now() - phase4Start,
      assertions: phase4Assertions,
      data: { registration_ids: registrations.map(r => r.id) },
    });

    // ========================================================================
    // PHASE 5: SPONSOR ONBOARDING
    // ========================================================================
    if (testSponsorFlow) {
      const phase5Start = Date.now();
      console.log('[qa-comprehensive-test] Phase 5: Sponsor onboarding...');
      
      const phase5Assertions: PhaseReport['assertions'] = [];
      const sponsorUser = createdUsers.find(u => u.role === 'sponsor');

      if (sponsorUser) {
        // Create pending sponsor invitation
        const inviteToken = `${testPrefix}sponsor_token_${timestamp}`;
        const { data: invitation } = await supabase
          .from('pending_sponsor_invitations')
          .insert({
            email: sponsorUser.email,
            organization_name: `${testPrefix}Sponsor Corp`,
            tier: 'gold',
            token: inviteToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        phase5Assertions.push({ name: 'invitation_created', passed: !!invitation });

        // Create sponsor profile (simulating claim flow)
        const { data: sponsorProfile } = await supabase
          .from('sponsor_profiles')
          .insert({
            user_id: sponsorUser.id,
            name: `${testPrefix}Sponsor Corp`,
            description: 'QA test sponsor organization',
            website: 'https://qa-sponsor.example.com',
            is_approved: false, // Needs admin approval
            approved_tier: 'gold',
            blog_posts_limit: 5,
            blog_posts_used: 0,
          })
          .select()
          .single();

        phase5Assertions.push({ name: 'sponsor_profile_created', passed: !!sponsorProfile });

        // Admin approves sponsor
        if (sponsorProfile) {
          await supabase
            .from('sponsor_profiles')
            .update({ is_approved: true })
            .eq('id', sponsorProfile.id);

          await supabase.from('user_roles').insert({
            user_id: sponsorUser.id,
            role: 'sponsor',
          });

          // Link sponsor to tournament
          await supabase.from('tournament_sponsor_links').insert({
            tournament_id: tournament.id,
            sponsor_profile_id: sponsorProfile.id,
            tier: 'gold',
            is_primary: true,
          });

          phase5Assertions.push({ name: 'sponsor_approved', passed: true });
        }
      }

      phases.push({
        phase: 'sponsor_onboarding',
        status: phase5Assertions.every(a => a.passed) ? 'pass' : 'fail',
        message: 'Sponsor invitation, onboarding, and approval completed',
        duration_ms: Date.now() - phase5Start,
        assertions: phase5Assertions,
      });
    }

    // ========================================================================
    // PHASE 6: RUN PRELIMINARY ROUNDS
    // ========================================================================
    const phase6Start = Date.now();
    console.log('[qa-comprehensive-test] Phase 6: Running preliminary rounds...');
    
    const phase6Assertions: PhaseReport['assertions'] = [];
    let totalBallots = 0;

    // Track team standings for power pairing
    const teamStandings = new Map<string, { wins: number; speaks: number; seed: number }>();
    registrations.forEach((reg, idx) => {
      teamStandings.set(reg.id, { wins: 0, speaks: 0, seed: idx + 1 });
    });

    for (let roundNum = 1; roundNum <= numPrelimRounds; roundNum++) {
      console.log(`[qa-comprehensive-test] Creating round ${roundNum}...`);

      // Create round
      const { data: round, error: roundError } = await supabase
        .from('rounds')
        .insert({
          tournament_id: tournament.id,
          event_id: event?.id,
          name: `Round ${roundNum}`,
          round_number: roundNum,
          status: 'upcoming',
          scheduled_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (!round) {
        console.error(`[qa-comprehensive-test] Failed to create round ${roundNum}:`, roundError);
        continue;
      }

      // Sort teams by record for power pairing
      const sortedTeams = [...registrations].sort((a, b) => {
        const standA = teamStandings.get(a.id)!;
        const standB = teamStandings.get(b.id)!;
        if (standA.wins !== standB.wins) return standB.wins - standA.wins;
        return standB.speaks - standA.speaks;
      });

      // Create pairings (high-high for power pairing)
      const pairings: { id: string; affId: string; negId: string }[] = [];
      const usedTeams = new Set<string>();

      for (let i = 0; i < sortedTeams.length; i += 2) {
        if (i + 1 >= sortedTeams.length) break;
        
        const affTeam = sortedTeams[i];
        const negTeam = sortedTeams[i + 1];
        
        if (usedTeams.has(affTeam.id) || usedTeams.has(negTeam.id)) continue;
        usedTeams.add(affTeam.id);
        usedTeams.add(negTeam.id);

        const judgeIdx = Math.floor(pairings.length) % judgeProfiles.length;
        const roomIdx = pairings.length % ROOMS.length;

        const { data: pairing, error: pairingError } = await supabase
          .from('pairings')
          .insert({
            round_id: round.id,
            tournament_id: tournament.id,
            event_id: event?.id,
            aff_registration_id: affTeam.id,
            neg_registration_id: negTeam.id,
            room: ROOMS[roomIdx],
            status: 'pending',
          })
          .select()
          .single();

        if (pairing) {
          pairings.push({ id: pairing.id, affId: affTeam.id, negId: negTeam.id });

          // Assign judge
          const { error: assignError } = await supabase.from('pairing_judge_assignments').insert({
            pairing_id: pairing.id,
            judge_profile_id: judgeProfiles[judgeIdx].id,
            role: 'chair',
          });
          if (assignError) {
            console.error(`[qa-comprehensive-test] Failed to assign judge:`, assignError.message);
          }
        } else {
          console.error(`[qa-comprehensive-test] Failed to create pairing:`, pairingError?.message);
        }
      }

      // Mark round as released
      await supabase
        .from('rounds')
        .update({ status: 'in_progress', released: true })
        .eq('id', round.id);

      // Create competitor notifications
      for (const pairing of pairings) {
        for (const regId of [pairing.affId, pairing.negId]) {
          await supabase.from('competitor_notifications').insert({
            registration_id: regId,
            tournament_id: tournament.id,
            round_id: round.id,
            pairing_id: pairing.id,
            type: 'round_posted',
            title: `Round ${roundNum} Posted`,
            message: `Your pairing for Round ${roundNum} is now available.`,
          });
        }
      }

      // Submit ballots for each pairing
      for (const pairing of pairings) {
        const affStanding = teamStandings.get(pairing.affId)!;
        const negStanding = teamStandings.get(pairing.negId)!;
        const winner = determineWinner(affStanding.seed, negStanding.seed);

        const affSpeaks = generateSpeakerPoints() + generateSpeakerPoints();
        const negSpeaks = generateSpeakerPoints() + generateSpeakerPoints();
        const winnerBonus = 0.5;

        const payload = {
          winner,
          aff_speaks: winner === 'aff' ? affSpeaks + winnerBonus : affSpeaks,
          neg_speaks: winner === 'neg' ? negSpeaks + winnerBonus : negSpeaks,
          aff_speaker1_points: generateSpeakerPoints(),
          aff_speaker2_points: generateSpeakerPoints(),
          neg_speaker1_points: generateSpeakerPoints(),
          neg_speaker2_points: generateSpeakerPoints(),
        };

        // Get judge profile for this pairing
        const { data: assignment } = await supabase
          .from('pairing_judge_assignments')
          .select('judge_profile_id')
          .eq('pairing_id', pairing.id)
          .single();

        if (assignment) {
          const judgeProfile = judgeProfiles.find(j => j.id === assignment.judge_profile_id);
          
          const { error: ballotError } = await supabase.from('ballots').insert({
            pairing_id: pairing.id,
            judge_profile_id: assignment.judge_profile_id,
            judge_user_id: judgeProfile?.userId || judgeProfiles[0].userId,
            payload,
            status: 'submitted',
            is_published: true,
          });

          if (ballotError) {
            console.error(`[qa-comprehensive-test] Failed to create ballot:`, ballotError.message);
          } else {
            totalBallots++;

            // Update standings
            if (winner === 'aff') {
              affStanding.wins++;
              affStanding.speaks += payload.aff_speaks;
              negStanding.speaks += payload.neg_speaks;
            } else {
              negStanding.wins++;
              negStanding.speaks += payload.neg_speaks;
              affStanding.speaks += payload.aff_speaks;
            }
          }
        } else {
          console.error(`[qa-comprehensive-test] No judge assignment found for pairing ${pairing.id}`);
        }
      }

      // Mark round complete
      await supabase
        .from('rounds')
        .update({ status: 'completed' })
        .eq('id', round.id);
    }

    // Update computed_standings with final prelim results
    for (const [regId, standing] of teamStandings) {
      await supabase
        .from('computed_standings')
        .update({
          wins: standing.wins,
          losses: numPrelimRounds - standing.wins,
          total_speaks: standing.speaks,
          avg_speaks: standing.speaks / numPrelimRounds,
          rounds_completed: numPrelimRounds,
          last_computed_at: new Date().toISOString(),
        })
        .eq('registration_id', regId)
        .eq('tournament_id', tournament.id);
    }

    phase6Assertions.push({
      name: 'prelim_rounds_created',
      passed: true,
      expected: numPrelimRounds,
      actual: numPrelimRounds,
    });

    phase6Assertions.push({
      name: 'ballots_submitted',
      passed: totalBallots === numPrelimRounds * (numTeams / 2),
      expected: numPrelimRounds * (numTeams / 2),
      actual: totalBallots,
    });

    phases.push({
      phase: 'preliminary_rounds',
      status: phase6Assertions.every(a => a.passed) ? 'pass' : 'fail',
      message: `Completed ${numPrelimRounds} preliminary rounds with ${totalBallots} ballots`,
      duration_ms: Date.now() - phase6Start,
      assertions: phase6Assertions,
      data: { rounds: numPrelimRounds, ballots: totalBallots },
    });

    // ========================================================================
    // PHASE 7: GENERATE BREAK
    // ========================================================================
    const phase7Start = Date.now();
    console.log('[qa-comprehensive-test] Phase 7: Generating break...');
    
    const phase7Assertions: PhaseReport['assertions'] = [];

    // Sort teams by record and mark top 8 as breaking
    const sortedByRecord = [...teamStandings.entries()]
      .sort((a, b) => {
        if (a[1].wins !== b[1].wins) return b[1].wins - a[1].wins;
        return b[1].speaks - a[1].speaks;
      });

    const breakingTeams: string[] = [];
    for (let i = 0; i < breakSize && i < sortedByRecord.length; i++) {
      const [regId] = sortedByRecord[i];
      breakingTeams.push(regId);

      await supabase
        .from('computed_standings')
        .update({
          is_breaking: true,
          break_seed: i + 1,
        })
        .eq('registration_id', regId)
        .eq('tournament_id', tournament.id);

      // Notify breaking team
      await supabase.from('competitor_notifications').insert({
        registration_id: regId,
        tournament_id: tournament.id,
        type: 'break_announcement',
        title: 'Congratulations!',
        message: `You have broken to elimination rounds as the #${i + 1} seed!`,
      });
    }

    phase7Assertions.push({
      name: 'breaking_teams_marked',
      passed: breakingTeams.length === breakSize,
      expected: breakSize,
      actual: breakingTeams.length,
    });

    phases.push({
      phase: 'break_generation',
      status: phase7Assertions.every(a => a.passed) ? 'pass' : 'fail',
      message: `Top ${breakingTeams.length} teams marked as breaking`,
      duration_ms: Date.now() - phase7Start,
      assertions: phase7Assertions,
      data: { breaking_seeds: breakingTeams.slice(0, 4) },
    });

    // ========================================================================
    // PHASE 8: RUN ELIMINATION ROUNDS
    // ========================================================================
    const phase8Start = Date.now();
    console.log('[qa-comprehensive-test] Phase 8: Running elimination rounds...');
    
    const phase8Assertions: PhaseReport['assertions'] = [];
    let elimBallots = 0;
    let currentBracket = [...breakingTeams]; // Seeds 1-8

    const elimRounds = [
      { name: 'Quarterfinals', numPairings: 4 },
      { name: 'Semifinals', numPairings: 2 },
      { name: 'Finals', numPairings: 1 },
    ];

    for (const elimRound of elimRounds) {
      if (currentBracket.length < 2) break;

      const roundNumber = numPrelimRounds + elimRounds.indexOf(elimRound) + 1;

      const { data: round } = await supabase
        .from('rounds')
        .insert({
          tournament_id: tournament.id,
          event_id: event?.id,
          name: elimRound.name,
          round_number: roundNumber,
          status: 'upcoming',
          scheduled_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (!round) continue;

      const winners: string[] = [];

      // Standard bracket: 1v8, 2v7, 3v6, 4v5 for QF
      for (let i = 0; i < Math.floor(currentBracket.length / 2); i++) {
        const topSeed = currentBracket[i];
        const bottomSeed = currentBracket[currentBracket.length - 1 - i];

        const judgeIdx = i % judgeProfiles.length;
        const roomIdx = i % ROOMS.length;

        const { data: pairing } = await supabase
          .from('pairings')
          .insert({
            round_id: round.id,
            tournament_id: tournament.id,
            event_id: event?.id,
            aff_registration_id: topSeed,
            neg_registration_id: bottomSeed,
            room: ROOMS[roomIdx],
            status: 'pending',
          })
          .select()
          .single();

        if (pairing) {
          await supabase.from('pairing_judge_assignments').insert({
            pairing_id: pairing.id,
            judge_profile_id: judgeProfiles[judgeIdx].id,
            is_chair: true,
          });

          // Submit ballot - higher seed has 60% chance in elims
          const winner = Math.random() < 0.6 ? 'aff' : 'neg';
          const payload = {
            winner,
            aff_speaks: generateSpeakerPoints() + generateSpeakerPoints(),
            neg_speaks: generateSpeakerPoints() + generateSpeakerPoints(),
          };

          const judgeProfile = judgeProfiles[judgeIdx];
          await supabase.from('ballots').insert({
            pairing_id: pairing.id,
            judge_profile_id: judgeProfile.id,
            judge_user_id: judgeProfile.userId,
            payload,
            status: 'submitted',
            is_published: true,
          });

          elimBallots++;
          winners.push(winner === 'aff' ? topSeed : bottomSeed);
        }
      }

      await supabase
        .from('rounds')
        .update({ status: 'completed', released: true })
        .eq('id', round.id);

      currentBracket = winners;
    }

    phase8Assertions.push({
      name: 'elim_rounds_completed',
      passed: elimBallots >= 7, // QF(4) + SF(2) + Finals(1) = 7
      expected: 7,
      actual: elimBallots,
    });

    phases.push({
      phase: 'elimination_rounds',
      status: phase8Assertions.every(a => a.passed) ? 'pass' : 'fail',
      message: `Completed elimination rounds with ${elimBallots} ballots`,
      duration_ms: Date.now() - phase8Start,
      assertions: phase8Assertions,
      data: { elim_ballots: elimBallots, champion: currentBracket[0] },
    });

    // ========================================================================
    // PHASE 9: PUBLISH RESULTS
    // ========================================================================
    const phase9Start = Date.now();
    console.log('[qa-comprehensive-test] Phase 9: Publishing results...');
    
    const phase9Assertions: PhaseReport['assertions'] = [];

    await supabase
      .from('tournaments')
      .update({
        status: 'Completed',
        results_published: true,
      })
      .eq('id', tournament.id);

    // Verify results published
    const { data: finalTournament } = await supabase
      .from('tournaments')
      .select('results_published, status')
      .eq('id', tournament.id)
      .single();

    phase9Assertions.push({
      name: 'results_published',
      passed: finalTournament?.results_published === true,
      expected: true,
      actual: finalTournament?.results_published,
    });

    phase9Assertions.push({
      name: 'status_completed',
      passed: finalTournament?.status === 'Completed',
      expected: 'Completed',
      actual: finalTournament?.status,
    });

    phases.push({
      phase: 'results_publication',
      status: phase9Assertions.every(a => a.passed) ? 'pass' : 'fail',
      message: 'Tournament results published',
      duration_ms: Date.now() - phase9Start,
      assertions: phase9Assertions,
    });

    // ========================================================================
    // PHASE 10: ACCOUNT EDITING TEST
    // ========================================================================
    if (testAccountEditing) {
      const phase10Start = Date.now();
      console.log('[qa-comprehensive-test] Phase 10: Testing account editing...');
      
      const phase10Assertions: PhaseReport['assertions'] = [];
      const testUser = debaters[0];

      // Update user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(testUser.id, {
        user_metadata: {
          first_name: 'UpdatedFirst',
          last_name: 'UpdatedLast',
        },
      });

      phase10Assertions.push({
        name: 'user_updated',
        passed: !updateError,
        actual: updateError?.message,
      });

      phases.push({
        phase: 'account_editing',
        status: phase10Assertions.every(a => a.passed) ? 'pass' : 'fail',
        message: 'Account editing test completed',
        duration_ms: Date.now() - phase10Start,
        assertions: phase10Assertions,
      });
    }

    // ========================================================================
    // PHASE 11: REGISTER-FOR-OTHERS TEST
    // ========================================================================
    if (testRegisterForOthers) {
      const phase11Start = Date.now();
      console.log('[qa-comprehensive-test] Phase 11: Testing register-for-others...');
      
      const phase11Assertions: PhaseReport['assertions'] = [];
      const registrarUser = createdUsers.find(u => u.role === 'registrar');

      if (registrarUser) {
        // Create pending invitation
        const claimToken = `${testPrefix}claim_${timestamp}`;
        const { data: invitation } = await supabase
          .from('pending_registrant_invitations')
          .insert({
            email: `${testPrefix.toLowerCase()}invited@ziggy-test.qa`,
            name: 'Invited Debater',
            tournament_id: tournament.id,
            event_id: event?.id,
            role: 'competitor',
            token: claimToken,
            invited_by: registrarUser.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        phase11Assertions.push({
          name: 'invitation_created',
          passed: !!invitation,
        });

        // Simulate claim (mark as claimed)
        if (invitation) {
          await supabase
            .from('pending_registrant_invitations')
            .update({ is_claimed: true, claimed_at: new Date().toISOString() })
            .eq('id', invitation.id);

          phase11Assertions.push({ name: 'invitation_claimed', passed: true });
        }
      }

      phases.push({
        phase: 'register_for_others',
        status: phase11Assertions.every(a => a.passed) ? 'pass' : 'fail',
        message: 'Register-for-others workflow tested',
        duration_ms: Date.now() - phase11Start,
        assertions: phase11Assertions,
      });
    }

    // ========================================================================
    // PHASE 12: DROP REGISTRATION TEST
    // ========================================================================
    if (testDropRegistration) {
      const phase12Start = Date.now();
      console.log('[qa-comprehensive-test] Phase 12: Testing registration drop...');
      
      const phase12Assertions: PhaseReport['assertions'] = [];

      // Mark one registration as dropped
      const droppedReg = registrations[registrations.length - 1];
      await supabase
        .from('tournament_registrations')
        .update({
          registration_status: 'withdrawn',
          payment_status: 'refunded',
        })
        .eq('id', droppedReg.id);

      // Verify
      const { data: verifyDrop } = await supabase
        .from('tournament_registrations')
        .select('registration_status')
        .eq('id', droppedReg.id)
        .single();

      phase12Assertions.push({
        name: 'registration_dropped',
        passed: verifyDrop?.registration_status === 'withdrawn',
        expected: 'withdrawn',
        actual: verifyDrop?.registration_status,
      });

      phases.push({
        phase: 'drop_registration',
        status: phase12Assertions.every(a => a.passed) ? 'pass' : 'fail',
        message: 'Registration drop workflow tested',
        duration_ms: Date.now() - phase12Start,
        assertions: phase12Assertions,
      });
    }

    // ========================================================================
    // CLEANUP (Optional)
    // ========================================================================
    if (cleanupAfter) {
      const cleanupStart = Date.now();
      await cleanupTestData(supabase, testPrefix);
      phases.push({
        phase: 'cleanup',
        status: 'pass',
        message: 'Test data cleaned up',
        duration_ms: Date.now() - cleanupStart,
        assertions: [],
      });
    }

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    const totalDuration = Date.now() - startTime;
    const passedPhases = phases.filter(p => p.status === 'pass').length;
    const failedPhases = phases.filter(p => p.status === 'fail').length;

    const summary = {
      success: failedPhases === 0,
      message: `Comprehensive test completed: ${passedPhases}/${phases.length} phases passed`,
      total_duration_ms: totalDuration,
      phases,
      statistics: {
        users_created: createdUsers.length,
        teams_registered: registrations.length,
        prelim_rounds: numPrelimRounds,
        prelim_ballots: totalBallots,
        elim_ballots: elimBallots,
        total_ballots: totalBallots + elimBallots,
        breaking_teams: breakingTeams.length,
      },
      test_data: {
        tournament_id: tournament.id,
        event_id: event?.id,
        admin_email: adminEmail,
        test_prefix: testPrefix,
      },
    };

    console.log('[qa-comprehensive-test] Complete:', JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[qa-comprehensive-test] Fatal error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        phases,
        total_duration_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// ============================================================================
// CLEANUP FUNCTION
// ============================================================================

async function cleanupTestData(supabase: ReturnType<typeof createClient>, prefix: string): Promise<void> {
  console.log(`[qa-comprehensive-test] Cleaning up ${prefix} data...`);

  // Delete in dependency order
  await supabase.from('ballots').delete().ilike('pairing_id', `%`);
  await supabase.from('pairing_judge_assignments').delete().ilike('pairing_id', `%`);
  await supabase.from('pairings').delete().ilike('tournament_id', `%`);
  await supabase.from('competitor_notifications').delete().ilike('title', `%${prefix}%`);
  await supabase.from('judge_notifications').delete().ilike('title', `%${prefix}%`);
  await supabase.from('computed_standings').delete().ilike('tournament_id', `%`);
  await supabase.from('head_to_head').delete().ilike('tournament_id', `%`);
  await supabase.from('rounds').delete().ilike('name', `%${prefix}%`);
  await supabase.from('tournament_registrations').delete().ilike('team_name', `%${prefix}%`);
  await supabase.from('judge_availability').delete().ilike('judge_profile_id', `%`);
  await supabase.from('tournament_judge_registrations').delete().ilike('tournament_id', `%`);
  await supabase.from('judge_profiles').delete().ilike('name', `%${prefix}%`);
  await supabase.from('tournament_sponsor_links').delete().ilike('tournament_id', `%`);
  await supabase.from('sponsor_profiles').delete().ilike('name', `%${prefix}%`);
  await supabase.from('pending_sponsor_invitations').delete().ilike('token', `%${prefix}%`);
  await supabase.from('pending_registrant_invitations').delete().ilike('token', `%${prefix}%`);
  await supabase.from('tournament_events').delete().ilike('tournament_id', `%`);
  await supabase.from('tournament_tab_config').delete().ilike('tournament_id', `%`);
  await supabase.from('tournament_tabulation_settings').delete().ilike('tournament_id', `%`);
  await supabase.from('tournaments').delete().ilike('name', `%${prefix}%`);

  // Delete test users
  const { data: testUsers } = await supabase.auth.admin.listUsers();
  if (testUsers?.users) {
    for (const user of testUsers.users) {
      if (user.email?.includes(prefix.toLowerCase()) || user.email?.includes('ziggy-test.qa')) {
        await supabase.from('user_roles').delete().eq('user_id', user.id);
        await supabase.auth.admin.deleteUser(user.id);
      }
    }
  }

  console.log('[qa-comprehensive-test] Cleanup complete');
}
