/**
 * Comprehensive E2E Test Data Fixtures
 * Extended test data for qa-comprehensive-test edge function integration
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface QATestConfig {
  testPrefix: string;
  numTeams: number;
  numJudges: number;
  numPrelimRounds: number;
  breakSize: number;
  testSponsorFlow: boolean;
  testRegisterForOthers: boolean;
  testDropRegistration: boolean;
  testAccountEditing: boolean;
  cleanupAfter: boolean;
}

export interface QATestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'debater' | 'judge' | 'sponsor' | 'registrar';
}

export interface QATestPhase {
  phase: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  message: string;
  duration_ms: number;
  assertions: Array<{
    name: string;
    passed: boolean;
    expected?: unknown;
    actual?: unknown;
  }>;
  data?: Record<string, unknown>;
}

export interface QATestResult {
  success: boolean;
  message: string;
  total_duration_ms: number;
  phases: QATestPhase[];
  statistics: {
    users_created: number;
    teams_registered: number;
    prelim_rounds: number;
    prelim_ballots: number;
    elim_ballots: number;
    total_ballots: number;
    breaking_teams: number;
  };
  test_data: {
    tournament_id: string;
    event_id: string;
    admin_email: string;
    test_prefix: string;
  };
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_QA_CONFIG: QATestConfig = {
  testPrefix: 'QA_COMP_',
  numTeams: 16,
  numJudges: 12,
  numPrelimRounds: 6,
  breakSize: 8,
  testSponsorFlow: true,
  testRegisterForOthers: true,
  testDropRegistration: true,
  testAccountEditing: true,
  cleanupAfter: false,
};

export const QUICK_TEST_CONFIG: QATestConfig = {
  testPrefix: 'QA_QUICK_',
  numTeams: 4,
  numJudges: 3,
  numPrelimRounds: 2,
  breakSize: 2,
  testSponsorFlow: false,
  testRegisterForOthers: false,
  testDropRegistration: false,
  testAccountEditing: false,
  cleanupAfter: true,
};

export const STRESS_TEST_CONFIG: QATestConfig = {
  testPrefix: 'QA_STRESS_',
  numTeams: 32,
  numJudges: 20,
  numPrelimRounds: 6,
  breakSize: 16,
  testSponsorFlow: true,
  testRegisterForOthers: true,
  testDropRegistration: true,
  testAccountEditing: true,
  cleanupAfter: false,
};

// ============================================================================
// TEST USER TEMPLATES
// ============================================================================

export function getTestAdmin(prefix: string = 'QA_COMP_'): QATestUser {
  return {
    email: `${prefix.toLowerCase()}admin@ziggy-test.qa`,
    password: 'TestPass123!',
    firstName: 'QA',
    lastName: 'Admin',
    role: 'admin',
  };
}

export function getTestDebater(prefix: string, num: number): QATestUser {
  const firstNames = [
    'Marcus', 'Elena', 'James', 'Sofia', 'William', 'Isabella', 'Benjamin', 'Mia',
    'Lucas', 'Charlotte', 'Henry', 'Amelia', 'Alexander', 'Harper', 'Daniel', 'Evelyn',
    'Matthew', 'Abigail', 'Joseph', 'Emily', 'David', 'Elizabeth', 'Andrew', 'Avery',
    'Michael', 'Ella', 'Christopher', 'Grace', 'Joshua', 'Victoria', 'Ethan', 'Chloe',
  ];
  const lastNames = [
    'Johnson', 'Rodriguez', 'Williams', 'Chen', 'Brown', 'Garcia', 'Miller', 'Davis',
    'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee',
    'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young',
    'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  ];

  return {
    email: `${prefix.toLowerCase()}debater_${num}@ziggy-test.qa`,
    password: 'TestPass123!',
    firstName: firstNames[(num - 1) % firstNames.length],
    lastName: lastNames[(num - 1) % lastNames.length],
    role: 'debater',
  };
}

export function getTestJudge(prefix: string, num: number): QATestUser {
  return {
    email: `${prefix.toLowerCase()}judge_${num}@ziggy-test.qa`,
    password: 'TestPass123!',
    firstName: `Judge${num}`,
    lastName: 'Tester',
    role: 'judge',
  };
}

export function getTestSponsor(prefix: string = 'QA_COMP_'): QATestUser {
  return {
    email: `${prefix.toLowerCase()}sponsor@ziggy-test.qa`,
    password: 'TestPass123!',
    firstName: 'QA',
    lastName: 'Sponsor',
    role: 'sponsor',
  };
}

export function getTestRegistrar(prefix: string = 'QA_COMP_'): QATestUser {
  return {
    email: `${prefix.toLowerCase()}registrar@ziggy-test.qa`,
    password: 'TestPass123!',
    firstName: 'QA',
    lastName: 'Registrar',
    role: 'registrar',
  };
}

// ============================================================================
// EXPECTED ASSERTIONS
// ============================================================================

export const EXPECTED_PHASES = [
  'user_creation',
  'tournament_creation',
  'judge_setup',
  'team_registration',
  'sponsor_onboarding',
  'preliminary_rounds',
  'break_generation',
  'elimination_rounds',
  'results_publication',
  'account_editing',
  'register_for_others',
  'drop_registration',
];

export const MINIMUM_SUCCESS_CRITERIA = {
  users_created: 47, // 1 admin + 32 debaters + 12 judges + 1 sponsor + 1 registrar
  teams_registered: 16,
  prelim_rounds: 6,
  prelim_ballots: 48, // 6 rounds * 8 pairings
  elim_ballots: 7, // QF(4) + SF(2) + Finals(1)
  total_ballots: 55,
  breaking_teams: 8,
};

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export function assertPhaseSuccess(result: QATestResult, phaseName: string): void {
  const phase = result.phases.find(p => p.phase === phaseName);
  if (!phase) {
    throw new Error(`Phase "${phaseName}" not found in results`);
  }
  if (phase.status !== 'pass') {
    const failedAssertions = phase.assertions.filter(a => !a.passed);
    throw new Error(
      `Phase "${phaseName}" failed: ${phase.message}. ` +
      `Failed assertions: ${JSON.stringify(failedAssertions)}`
    );
  }
}

export function assertMinimumStatistics(result: QATestResult): void {
  const stats = result.statistics;
  const errors: string[] = [];

  if (stats.users_created < MINIMUM_SUCCESS_CRITERIA.users_created) {
    errors.push(`Expected at least ${MINIMUM_SUCCESS_CRITERIA.users_created} users, got ${stats.users_created}`);
  }
  if (stats.teams_registered < MINIMUM_SUCCESS_CRITERIA.teams_registered) {
    errors.push(`Expected at least ${MINIMUM_SUCCESS_CRITERIA.teams_registered} teams, got ${stats.teams_registered}`);
  }
  if (stats.total_ballots < MINIMUM_SUCCESS_CRITERIA.total_ballots) {
    errors.push(`Expected at least ${MINIMUM_SUCCESS_CRITERIA.total_ballots} ballots, got ${stats.total_ballots}`);
  }
  if (stats.breaking_teams < MINIMUM_SUCCESS_CRITERIA.breaking_teams) {
    errors.push(`Expected at least ${MINIMUM_SUCCESS_CRITERIA.breaking_teams} breaking teams, got ${stats.breaking_teams}`);
  }

  if (errors.length > 0) {
    throw new Error(`Statistics validation failed:\n${errors.join('\n')}`);
  }
}

// ============================================================================
// SUPABASE HELPERS
// ============================================================================

export function getSupabaseUrl(): string {
  return process.env.VITE_SUPABASE_URL || 'https://kiummwyxeleejbwapssa.supabase.co';
}

export function getSupabaseAnonKey(): string {
  return process.env.VITE_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdW1td3l4ZWxlZWpid2Fwc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzYxMDgsImV4cCI6MjA3MTMxMjEwOH0.C0t-4ZtFEZpDcpsGpLr2vIyT8tK7fCfhfIqFyB0db10';
}

export async function invokeQATest(config: Partial<QATestConfig> = {}): Promise<QATestResult> {
  const url = `${getSupabaseUrl()}/functions/v1/qa-comprehensive-test`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSupabaseAnonKey()}`,
    },
    body: JSON.stringify({ ...DEFAULT_QA_CONFIG, ...config }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QA test invocation failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function cleanupQATestData(prefix: string = 'QA_COMP_'): Promise<void> {
  const url = `${getSupabaseUrl()}/functions/v1/qa-comprehensive-test`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSupabaseAnonKey()}`,
    },
    body: JSON.stringify({ cleanupOnly: true, testPrefix: prefix }),
  });

  if (!response.ok) {
    console.warn(`Cleanup warning: ${response.status}`);
  }
}
