
import { Registration, JudgeProfile } from '@/types/database';

export interface TeamRecord {
  registration: Registration;
  wins: number;
  losses: number;
  speaks: number;
  oppStrength: number;
}

export interface PairingConstraints {
  teamConflicts: Map<string, Set<string>>;
  judgeTeamConflicts: Map<string, Set<string>>;
  judgeSchoolConflicts: Map<string, Set<string>>;
  avoidRematches: boolean;
  clubProtect: boolean;
}

export interface GeneratedPairing {
  affRegistrationId: string;
  negRegistrationId: string;
  judgeId?: string;
  room?: string;
  quality: number;
}

export interface PairingOptions {
  method: 'high_high' | 'high_low' | 'random' | 'bracket';
  clubProtect: boolean;
  avoidRematches: boolean;
}

// Power-matching algorithm implementation
export function generatePowerMatchPairings(
  teams: TeamRecord[],
  judges: JudgeProfile[],
  constraints: PairingConstraints,
  options: PairingOptions,
  previousPairings: Array<{ aff: string; neg: string }> = []
): GeneratedPairing[] {
  console.log('Generating power-match pairings with options:', options);
  
  // Sort teams by record (wins descending, then speaks descending)
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.speaks !== b.speaks) return b.speaks - a.speaks;
    return b.oppStrength - a.oppStrength;
  });

  const pairings: GeneratedPairing[] = [];
  const usedTeams = new Set<string>();
  const usedJudges = new Set<string>();

  // Create pools based on record brackets
  const pools = createRecordPools(sortedTeams);
  
  for (const pool of pools) {
    const poolPairings = generatePoolPairings(
      pool,
      judges.filter(j => !usedJudges.has(j.id)),
      constraints,
      options,
      previousPairings,
      usedTeams
    );
    
    pairings.push(...poolPairings);
    poolPairings.forEach(p => {
      usedTeams.add(p.affRegistrationId);
      usedTeams.add(p.negRegistrationId);
      if (p.judgeId) usedJudges.add(p.judgeId);
    });
  }

  return pairings;
}

function createRecordPools(teams: TeamRecord[]): TeamRecord[][] {
  const pools: TeamRecord[][] = [];
  let currentPool: TeamRecord[] = [];
  let currentRecord = -1;

  for (const team of teams) {
    if (team.wins !== currentRecord) {
      if (currentPool.length > 0) {
        pools.push(currentPool);
      }
      currentPool = [team];
      currentRecord = team.wins;
    } else {
      currentPool.push(team);
    }
  }

  if (currentPool.length > 0) {
    pools.push(currentPool);
  }

  return pools;
}

function generatePoolPairings(
  pool: TeamRecord[],
  availableJudges: JudgeProfile[],
  constraints: PairingConstraints,
  options: PairingOptions,
  previousPairings: Array<{ aff: string; neg: string }>,
  usedTeams: Set<string>
): GeneratedPairing[] {
  const pairings: GeneratedPairing[] = [];
  const poolTeams = pool.filter(t => !usedTeams.has(t.registration.id));
  
  if (poolTeams.length < 2) return pairings;

  // For high-high, pair top half vs top half
  // For high-low, pair top half vs bottom half
  let affTeams: TeamRecord[], negTeams: TeamRecord[];
  
  const midpoint = Math.floor(poolTeams.length / 2);
  
  if (options.method === 'high_low') {
    affTeams = poolTeams.slice(0, midpoint);
    negTeams = poolTeams.slice(midpoint).reverse();
  } else if (options.method === 'random') {
    const shuffled = [...poolTeams].sort(() => Math.random() - 0.5);
    affTeams = shuffled.slice(0, midpoint);
    negTeams = shuffled.slice(midpoint);
  } else { // high_high
    affTeams = poolTeams.slice(0, midpoint);
    negTeams = poolTeams.slice(0, midpoint);
  }

  // Generate pairings with constraint checking
  for (let i = 0; i < Math.min(affTeams.length, negTeams.length); i++) {
    const aff = affTeams[i];
    let bestNeg: TeamRecord | null = null;
    let bestQuality = -1;

    // Find best valid neg team
    for (let j = 0; j < negTeams.length; j++) {
      const neg = negTeams[j];
      
      if (aff.registration.id === neg.registration.id) continue;
      if (usedTeams.has(neg.registration.id)) continue;
      
      const quality = evaluatePairingQuality(aff, neg, constraints, options, previousPairings);
      
      if (quality > bestQuality) {
        bestQuality = quality;
        bestNeg = neg;
      }
    }

    if (bestNeg && bestQuality >= 0) {
      const judge = assignJudge(aff, bestNeg, availableJudges, constraints);
      
      pairings.push({
        affRegistrationId: aff.registration.id,
        negRegistrationId: bestNeg.registration.id,
        judgeId: judge?.id,
        quality: bestQuality
      });

      usedTeams.add(bestNeg.registration.id);
      if (judge) {
        availableJudges = availableJudges.filter(j => j.id !== judge.id);
      }
    }
  }

  return pairings;
}

function evaluatePairingQuality(
  aff: TeamRecord,
  neg: TeamRecord,
  constraints: PairingConstraints,
  options: PairingOptions,
  previousPairings: Array<{ aff: string; neg: string }>
): number {
  let quality = 100;

  // Check hard constraints
  if (constraints.teamConflicts.get(aff.registration.id)?.has(neg.registration.id)) {
    return -1; // Invalid pairing
  }

  // Club protect: teams from same school shouldn't face each other
  if (options.clubProtect && 
      aff.registration.school_organization && 
      neg.registration.school_organization &&
      aff.registration.school_organization === neg.registration.school_organization) {
    quality -= 50;
  }

  // Avoid rematches
  if (options.avoidRematches) {
    const hasRematched = previousPairings.some(p => 
      (p.aff === aff.registration.id && p.neg === neg.registration.id) ||
      (p.aff === neg.registration.id && p.neg === aff.registration.id)
    );
    if (hasRematched) {
      quality -= 30;
    }
  }

  // Record differential penalty (prefer similar records)
  const recordDiff = Math.abs(aff.wins - neg.wins);
  quality -= recordDiff * 10;

  // Speaks differential penalty
  const speaksDiff = Math.abs(aff.speaks - neg.speaks);
  quality -= speaksDiff * 0.1;

  return quality;
}

function assignJudge(
  aff: TeamRecord,
  neg: TeamRecord,
  availableJudges: JudgeProfile[],
  constraints: PairingConstraints
): JudgeProfile | null {
  for (const judge of availableJudges) {
    // Check judge-team conflicts
    if (constraints.judgeTeamConflicts.get(judge.id)?.has(aff.registration.id) ||
        constraints.judgeTeamConflicts.get(judge.id)?.has(neg.registration.id)) {
      continue;
    }

    // Check judge-school conflicts
    const affSchool = aff.registration.school_organization;
    const negSchool = neg.registration.school_organization;
    const judgeSchoolConflicts = constraints.judgeSchoolConflicts.get(judge.id);
    
    if (judgeSchoolConflicts && 
        ((affSchool && judgeSchoolConflicts.has(affSchool)) ||
         (negSchool && judgeSchoolConflicts.has(negSchool)))) {
      continue;
    }

    return judge;
  }

  return null; // No valid judge found
}

// Elimination bracket generation
export function generateEliminationPairings(
  seeds: Array<{ registrationId: string; seed: number }>,
  judges: JudgeProfile[],
  constraints: PairingConstraints
): GeneratedPairing[] {
  console.log('Generating elimination pairings for', seeds.length, 'teams');
  
  // Standard tournament bracket pairing: 1v8, 2v7, 3v6, 4v5, etc.
  const pairings: GeneratedPairing[] = [];
  const sortedSeeds = [...seeds].sort((a, b) => a.seed - b.seed);
  
  for (let i = 0; i < sortedSeeds.length / 2; i++) {
    const topSeed = sortedSeeds[i];
    const bottomSeed = sortedSeeds[sortedSeeds.length - 1 - i];
    
    if (topSeed && bottomSeed) {
      const judge = judges[i % judges.length]; // Simple round-robin judge assignment
      
      pairings.push({
        affRegistrationId: topSeed.registrationId,
        negRegistrationId: bottomSeed.registrationId,
        judgeId: judge?.id,
        quality: 100 // Perfect quality for seeded brackets
      });
    }
  }

  return pairings;
}

// Calculate team standings from pairing results
export function calculateStandings(
  teams: Registration[],
  pairings: Array<{
    aff_registration_id: string;
    neg_registration_id: string;
    result: any;
  }>
): TeamRecord[] {
  const standings = new Map<string, TeamRecord>();

  // Initialize all teams
  teams.forEach(team => {
    standings.set(team.id, {
      registration: team,
      wins: 0,
      losses: 0,
      speaks: 0,
      oppStrength: 0
    });
  });

  // Process results from pairings
  pairings.forEach(pairing => {
    if (!pairing.result?.winner) return;

    const affRecord = standings.get(pairing.aff_registration_id);
    const negRecord = standings.get(pairing.neg_registration_id);

    if (!affRecord || !negRecord) return;

    if (pairing.result.winner === 'aff') {
      affRecord.wins++;
      negRecord.losses++;
    } else if (pairing.result.winner === 'neg') {
      negRecord.wins++;
      affRecord.losses++;
    }

    // Add speaker points if available
    if (pairing.result.aff_speaks) {
      affRecord.speaks += parseFloat(pairing.result.aff_speaks);
    }
    if (pairing.result.neg_speaks) {
      negRecord.speaks += parseFloat(pairing.result.neg_speaks);
    }
  });

  return Array.from(standings.values());
}
