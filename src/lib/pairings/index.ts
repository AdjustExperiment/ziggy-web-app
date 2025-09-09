import { Registration } from '@/types/database';

export interface BasicPairing {
  aff: string;
  neg: string;
}

export function generateSwissPairings(
  registrations: Registration[]
): BasicPairing[] {
  const shuffled = [...registrations].sort(() => Math.random() - 0.5);
  const pairings: BasicPairing[] = [];
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairings.push({
      aff: shuffled[i].id,
      neg: shuffled[i + 1].id,
    });
  }
  return pairings;
}

export function generateEliminationPairings(
  registrations: Array<Registration & { seed?: number }>
): BasicPairing[] {
  const sorted = [...registrations].sort((a, b) => {
    const seedA = a.seed ?? 0;
    const seedB = b.seed ?? 0;
    return seedA - seedB;
  });
  const pairings: BasicPairing[] = [];
  for (let i = 0; i < Math.floor(sorted.length / 2); i++) {
    const top = sorted[i];
    const bottom = sorted[sorted.length - 1 - i];
    if (top && bottom) {
      pairings.push({ aff: top.id, neg: bottom.id });
    }
  }
  return pairings;
}
