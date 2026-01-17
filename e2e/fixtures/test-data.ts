/**
 * Ziggy E2E Test Data Fixtures
 * Comprehensive test data for user flows, admin workflows, and tournament simulation
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'debater' | 'judge' | 'admin' | 'sponsor';
  school?: string;
}

export interface TestTeam {
  debater1: TestUser;
  debater2: TestUser;
  teamName: string;
  school: string;
}

export interface TestJudge {
  user: TestUser;
  experience: 'novice' | 'varsity' | 'experienced';
  paradigm?: string;
  availability: boolean;
}

export interface TestTournament {
  name: string;
  format: 'TP' | 'LD' | 'PF' | 'Parli';
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  venue: string;
  entryFee: number;
  maxTeams: number;
  rounds: number;
  breakToElims: number;
}

export interface TestRound {
  roundNumber: number;
  type: 'preliminary' | 'elimination';
  motion?: string;
  pairings: TestPairing[];
}

export interface TestPairing {
  room: string;
  affTeam: string;
  negTeam: string;
  judge: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface TestBallot {
  pairingId: string;
  winner: 'aff' | 'neg';
  affSpeaker1Points: number;
  affSpeaker2Points: number;
  negSpeaker1Points: number;
  negSpeaker2Points: number;
  feedback?: string;
}

// ============================================================================
// RANDOM DATA GENERATORS
// ============================================================================

const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Jacob', 'Sofia', 'Logan', 'Avery', 'Jackson',
  'Ella', 'Sebastian', 'Scarlett', 'Mateo', 'Grace', 'Owen', 'Chloe', 'Aiden',
  'Victoria', 'Samuel'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const schools = [
  'Lincoln High School', 'Washington Academy', 'Jefferson Prep',
  'Roosevelt Institute', 'Kennedy School of Debate', 'Hamilton High',
  'Madison Preparatory', 'Franklin Academy', 'Adams High School',
  'Monroe Debate Institute', 'Jackson School', 'Van Buren Academy',
  'Harrison Prep', 'Tyler High School', 'Polk Academy',
  'Fillmore School', 'Pierce Institute', 'Buchanan Prep',
  'Cleveland High', 'McKinley Academy'
];

const motions = [
  'This House would ban social media for minors.',
  'This House believes artificial intelligence will do more harm than good.',
  'This House would implement universal basic income.',
  'This House would abolish the electoral college.',
  'This House believes climate change should be the top global priority.',
  'This House would ban private schools.',
  'This House would legalize all drugs.',
  'This House believes democracy is failing.',
  'This House would implement mandatory voting.',
  'This House would ban factory farming.'
];

const rooms = [
  'Room A101', 'Room A102', 'Room A103', 'Room A104', 'Room A105',
  'Room B201', 'Room B202', 'Room B203', 'Room B204', 'Room B205',
  'Room C301', 'Room C302', 'Room C303', 'Room C304', 'Room C305'
];

let userCounter = 0;

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSpeakerPoints(): number {
  // Speaker points typically range from 25-30 with decimal precision
  const base = getRandomNumber(26, 29);
  const decimal = getRandomNumber(0, 9) / 10;
  return base + decimal;
}

// ============================================================================
// USER FACTORIES
// ============================================================================

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  userCounter++;
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const uniqueId = generateUniqueId();

  return {
    email: `test.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@ziggytest.com`,
    password: 'TestPassword123!',
    firstName,
    lastName,
    role: 'debater',
    school: getRandomElement(schools),
    ...overrides
  };
}

export function createTestAdmin(): TestUser {
  return createTestUser({
    email: `admin.${generateUniqueId()}@ziggytest.com`,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  });
}

export function createTestJudge(overrides: Partial<TestJudge> = {}): TestJudge {
  const user = createTestUser({ role: 'judge' });
  return {
    user,
    experience: getRandomElement(['novice', 'varsity', 'experienced'] as const),
    paradigm: 'I value clear argumentation and proper clash. Speed is fine but clarity is paramount.',
    availability: true,
    ...overrides
  };
}

export function createTestSponsor(): TestUser {
  return createTestUser({
    email: `sponsor.${generateUniqueId()}@ziggytest.com`,
    role: 'sponsor',
    firstName: 'Sponsor',
    lastName: 'Representative'
  });
}

// ============================================================================
// TEAM FACTORIES
// ============================================================================

export function createTestTeam(teamNumber: number, school?: string): TestTeam {
  const teamSchool = school || getRandomElement(schools);
  const debater1 = createTestUser({ school: teamSchool });
  const debater2 = createTestUser({ school: teamSchool });

  return {
    debater1,
    debater2,
    teamName: `${teamSchool} ${teamNumber}`,
    school: teamSchool
  };
}

export function createMultipleTeams(count: number): TestTeam[] {
  const teams: TestTeam[] = [];
  const usedSchools = new Set<string>();

  for (let i = 1; i <= count; i++) {
    // Distribute teams across schools (some schools have multiple teams)
    let school: string;
    if (i <= schools.length && !usedSchools.has(schools[i - 1])) {
      school = schools[i - 1];
      usedSchools.add(school);
    } else {
      school = getRandomElement(schools);
    }

    // Calculate team number for this school
    const schoolTeams = teams.filter(t => t.school === school);
    const teamNum = schoolTeams.length + 1;

    teams.push(createTestTeam(teamNum, school));
  }

  return teams;
}

// ============================================================================
// TOURNAMENT FACTORIES
// ============================================================================

export function createTestTournament(overrides: Partial<TestTournament> = {}): TestTournament {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 14); // 2 weeks from now

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 2); // 2-day tournament

  const registrationDeadline = new Date(startDate);
  registrationDeadline.setDate(registrationDeadline.getDate() - 3);

  return {
    name: `Test Championship ${generateUniqueId().slice(0, 8)}`,
    format: 'TP',
    startDate,
    endDate,
    registrationDeadline,
    venue: 'Test University Campus Center',
    entryFee: 50,
    maxTeams: 32,
    rounds: 5,
    breakToElims: 8,
    ...overrides
  };
}

export function create20TeamTPTournament(): {
  tournament: TestTournament;
  teams: TestTeam[];
  judges: TestJudge[];
  admin: TestUser;
} {
  const tournament = createTestTournament({
    name: `TP Championship ${new Date().toISOString().slice(0, 10)}`,
    format: 'TP',
    maxTeams: 24,
    rounds: 5,
    breakToElims: 8
  });

  const teams = createMultipleTeams(20);

  // Create enough judges (roughly 1 judge per 2 teams for prelims)
  const judges: TestJudge[] = [];
  for (let i = 0; i < 12; i++) {
    judges.push(createTestJudge());
  }

  const admin = createTestAdmin();

  return { tournament, teams, judges, admin };
}

// ============================================================================
// ROUND AND PAIRING FACTORIES
// ============================================================================

export function createPreliminaryRound(
  roundNumber: number,
  teams: TestTeam[],
  judges: TestJudge[]
): TestRound {
  const motion = getRandomElement(motions);
  const pairings: TestPairing[] = [];

  // Simple snake pairing for prelims
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      const judgeIndex = Math.floor(i / 2) % judges.length;
      pairings.push({
        room: rooms[pairings.length % rooms.length],
        affTeam: shuffledTeams[i].teamName,
        negTeam: shuffledTeams[i + 1].teamName,
        judge: `${judges[judgeIndex].user.firstName} ${judges[judgeIndex].user.lastName}`,
        status: 'pending'
      });
    }
  }

  return {
    roundNumber,
    type: 'preliminary',
    motion,
    pairings
  };
}

export function createEliminationRound(
  roundName: string,
  roundNumber: number,
  teams: string[],
  judges: TestJudge[]
): TestRound {
  const motion = getRandomElement(motions);
  const pairings: TestPairing[] = [];

  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      const judgeIndex = Math.floor(i / 2) % judges.length;
      pairings.push({
        room: rooms[pairings.length % rooms.length],
        affTeam: teams[i],
        negTeam: teams[i + 1],
        judge: `${judges[judgeIndex].user.firstName} ${judges[judgeIndex].user.lastName}`,
        status: 'pending'
      });
    }
  }

  return {
    roundNumber,
    type: 'elimination',
    motion,
    pairings
  };
}

// ============================================================================
// BALLOT FACTORIES
// ============================================================================

export function createTestBallot(pairingId: string, winner?: 'aff' | 'neg'): TestBallot {
  const selectedWinner = winner || (Math.random() > 0.5 ? 'aff' : 'neg');

  // Winner typically gets higher speaker points
  const winnerBonus = 0.5;
  const basePoints1 = generateSpeakerPoints();
  const basePoints2 = generateSpeakerPoints();

  return {
    pairingId,
    winner: selectedWinner,
    affSpeaker1Points: selectedWinner === 'aff' ? basePoints1 + winnerBonus : basePoints1,
    affSpeaker2Points: selectedWinner === 'aff' ? basePoints2 + winnerBonus : basePoints2,
    negSpeaker1Points: selectedWinner === 'neg' ? basePoints1 + winnerBonus : basePoints1,
    negSpeaker2Points: selectedWinner === 'neg' ? basePoints2 + winnerBonus : basePoints2,
    feedback: getRandomElement([
      'Great argumentation from both sides. Clear structure and good clash.',
      'Strong case construction. Work on rebuttals and cross-examination.',
      'Excellent speaking skills. Some arguments could use more evidence.',
      'Good debate overall. Consider spending more time on impacts.',
      'Well-prepared teams. Clash on the key issues was particularly strong.'
    ])
  };
}

// ============================================================================
// EDGE CASE SCENARIOS
// ============================================================================

export const EDGE_CASES = {
  // User with special characters in name
  specialCharacterUser: createTestUser({
    firstName: "O'Brien",
    lastName: "Von Müller-Smith",
    email: `special.chars.${generateUniqueId()}@ziggytest.com`
  }),

  // Very long school name
  longSchoolName: createTestTeam(1, 'The International Academy of Advanced Debate Studies and Forensics Research Institute'),

  // Minimum speaker points
  minSpeakerPointsBallot: {
    pairingId: 'edge-case-min',
    winner: 'aff' as const,
    affSpeaker1Points: 20.0,
    affSpeaker2Points: 20.0,
    negSpeaker1Points: 20.0,
    negSpeaker2Points: 20.0
  },

  // Maximum speaker points
  maxSpeakerPointsBallot: {
    pairingId: 'edge-case-max',
    winner: 'neg' as const,
    affSpeaker1Points: 30.0,
    affSpeaker2Points: 30.0,
    negSpeaker1Points: 30.0,
    negSpeaker2Points: 30.0
  },

  // Tied speaker points
  tiedSpeakerPoints: {
    pairingId: 'edge-case-tie',
    winner: 'aff' as const,
    affSpeaker1Points: 27.5,
    affSpeaker2Points: 27.5,
    negSpeaker1Points: 27.5,
    negSpeaker2Points: 27.5
  },

  // Empty feedback
  emptyFeedbackBallot: {
    pairingId: 'edge-case-no-feedback',
    winner: 'aff' as const,
    affSpeaker1Points: 28.0,
    affSpeaker2Points: 27.5,
    negSpeaker1Points: 27.0,
    negSpeaker2Points: 27.5,
    feedback: ''
  },

  // Very long feedback
  longFeedbackBallot: {
    pairingId: 'edge-case-long-feedback',
    winner: 'neg' as const,
    affSpeaker1Points: 27.0,
    affSpeaker2Points: 26.5,
    negSpeaker1Points: 28.0,
    negSpeaker2Points: 28.5,
    feedback: 'A'.repeat(5000) // 5000 character feedback
  }
};

// ============================================================================
// NOTIFICATION TEST DATA
// ============================================================================

export const NOTIFICATION_SCENARIOS = {
  roundPosted: {
    type: 'round_posted',
    title: 'Round 1 Posted',
    message: 'Pairings for Round 1 have been posted. Please check your room assignment.'
  },

  ballotSubmitted: {
    type: 'ballot_submitted',
    title: 'Ballot Received',
    message: 'Your judge has submitted the ballot for your round.'
  },

  breakAnnouncement: {
    type: 'break_announcement',
    title: 'Elimination Round Break',
    message: 'Congratulations! You have broken to elimination rounds.'
  },

  scheduleChange: {
    type: 'schedule_change',
    title: 'Schedule Update',
    message: 'Round 3 has been delayed by 30 minutes.'
  },

  judgeAssignment: {
    type: 'judge_assignment',
    title: 'New Judging Assignment',
    message: 'You have been assigned to judge in Room A101 for Round 2.'
  }
};

// ============================================================================
// CHAT TEST DATA
// ============================================================================

export const CHAT_MESSAGES = {
  debaterMessages: [
    'Are we going to discuss the case before the round?',
    'What time should we meet at the room?',
    'Great round! Good luck in the next one.',
    'Did you get our speaker points yet?'
  ],

  judgeMessages: [
    'Please be in the room 5 minutes before the round starts.',
    'Both teams argued well. Decisions will be posted soon.',
    'I have a conflict with one of the teams, requesting replacement.'
  ],

  adminMessages: [
    'Attention all participants: Round 3 will start in 15 minutes.',
    'Please check your email for updated room assignments.',
    'Lunch will be served in the main hall at 12:30 PM.'
  ]
};

// ============================================================================
// SPONSOR TEST DATA
// ============================================================================

export const SPONSOR_DATA = {
  bronzeSponsor: {
    companyName: 'Local Debate Supply Co.',
    tier: 'bronze',
    amount: 500,
    logo: 'https://example.com/bronze-sponsor-logo.png',
    website: 'https://debatesupply.example.com'
  },

  silverSponsor: {
    companyName: 'Regional Forensics Foundation',
    tier: 'silver',
    amount: 1500,
    logo: 'https://example.com/silver-sponsor-logo.png',
    website: 'https://forensicsfoundation.example.com'
  },

  goldSponsor: {
    companyName: 'National Speech & Debate Education',
    tier: 'gold',
    amount: 5000,
    logo: 'https://example.com/gold-sponsor-logo.png',
    website: 'https://nsde.example.com'
  },

  platinumSponsor: {
    companyName: 'Global Debate Championship Series',
    tier: 'platinum',
    amount: 10000,
    logo: 'https://example.com/platinum-sponsor-logo.png',
    website: 'https://gdcs.example.com'
  }
};

// ============================================================================
// FULL TOURNAMENT SIMULATION DATA
// ============================================================================

export function generateFullTournamentSimulation() {
  const { tournament, teams, judges, admin } = create20TeamTPTournament();

  // Generate 5 preliminary rounds
  const preliminaryRounds: TestRound[] = [];
  for (let i = 1; i <= 5; i++) {
    preliminaryRounds.push(createPreliminaryRound(i, teams, judges));
  }

  // Generate ballots for each round
  const allBallots: Map<number, TestBallot[]> = new Map();
  preliminaryRounds.forEach((round, idx) => {
    const roundBallots = round.pairings.map((p, pIdx) =>
      createTestBallot(`round-${idx + 1}-pairing-${pIdx}`)
    );
    allBallots.set(idx + 1, roundBallots);
  });

  // Simulate break to quarters (top 8)
  const quarterfinalists = teams.slice(0, 8).map(t => t.teamName);
  const quarterfinals = createEliminationRound('Quarterfinals', 6, quarterfinalists, judges);

  // Simulate semifinals (top 4)
  const semifinalists = quarterfinalists.slice(0, 4);
  const semifinals = createEliminationRound('Semifinals', 7, semifinalists, judges);

  // Simulate finals (top 2)
  const finalists = semifinalists.slice(0, 2);
  const finals = createEliminationRound('Finals', 8, finalists, judges);

  return {
    tournament,
    teams,
    judges,
    admin,
    preliminaryRounds,
    eliminationRounds: [quarterfinals, semifinals, finals],
    allBallots,
    sponsors: [
      SPONSOR_DATA.bronzeSponsor,
      SPONSOR_DATA.silverSponsor,
      SPONSOR_DATA.goldSponsor
    ]
  };
}

// ============================================================================
// TEST CREDENTIALS (for seeded test accounts)
// ============================================================================

export const SEEDED_ACCOUNTS = {
  testDebater: {
    email: 'test.debater@ziggytest.com',
    password: 'TestDebater123!'
  },

  testJudge: {
    email: 'test.judge@ziggytest.com',
    password: 'TestJudge123!'
  },

  testAdmin: {
    email: 'test.admin@ziggytest.com',
    password: 'TestAdmin123!'
  },

  testSponsor: {
    email: 'test.sponsor@ziggytest.com',
    password: 'TestSponsor123!'
  }
};
