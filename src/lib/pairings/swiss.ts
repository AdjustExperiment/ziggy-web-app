import { Registration, JudgeProfile } from '@/types/database';

export interface TeamRecord {
  registration: Registration;
  wins: number;
  losses: number;
  speaks: number;
  oppStrength: number;
}

export interface SwissOptions {
  method?: 'high_high' | 'high_low' | 'random';
}

export interface PairingProposal {
  affRegistrationId: string;
  negRegistrationId: string;
  judgeId?: string;
  room?: string;
}

export function generateSwissPairings(
  teams: TeamRecord[],
  judges: JudgeProfile[],
  options: SwissOptions = {}
): PairingProposal[] {
  const method = options.method || 'high_high';

  const sorted = [...teams].sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.speaks !== b.speaks) return b.speaks - a.speaks;
    return b.oppStrength - a.oppStrength;
  });

  const midpoint = Math.floor(sorted.length / 2);
  let affTeams: TeamRecord[] = [];
  let negTeams: TeamRecord[] = [];

  if (method === 'high_low') {
    affTeams = sorted.slice(0, midpoint);
    negTeams = sorted.slice(midpoint).reverse();
  } else if (method === 'random') {
    const shuffled = [...sorted].sort(() => Math.random() - 0.5);
    affTeams = shuffled.slice(0, midpoint);
    negTeams = shuffled.slice(midpoint);
  } else {
    affTeams = sorted.filter((_, idx) => idx % 2 === 0);
    negTeams = sorted.filter((_, idx) => idx % 2 === 1);
  }

  const proposals: PairingProposal[] = [];
  const pairCount = Math.min(affTeams.length, negTeams.length);

  for (let i = 0; i < pairCount; i++) {
    proposals.push({
      affRegistrationId: affTeams[i].registration.id,
      negRegistrationId: negTeams[i].registration.id,
      judgeId: judges[i]?.id
    });
  }

  return proposals;
}
