import { JudgeProfile } from '@/types/database';

export interface SeedEntry {
  registrationId: string;
  seed: number;
}

export interface PairingProposal {
  affRegistrationId: string;
  negRegistrationId: string;
  judgeId?: string;
  room?: string;
}

export function generateEliminationPairings(
  seeds: SeedEntry[],
  judges: JudgeProfile[]
): PairingProposal[] {
  const sorted = [...seeds].sort((a, b) => a.seed - b.seed);
  const proposals: PairingProposal[] = [];
  const half = Math.floor(sorted.length / 2);

  for (let i = 0; i < half; i++) {
    const top = sorted[i];
    const bottom = sorted[sorted.length - 1 - i];
    proposals.push({
      affRegistrationId: top.registrationId,
      negRegistrationId: bottom.registrationId,
      judgeId: judges[i]?.id
    });
  }

  return proposals;
}
