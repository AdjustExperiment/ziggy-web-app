/**
 * Tiebreaker Calculation Engine
 *
 * A robust engine for comparing and sorting tournament standings using
 * configurable tiebreaker rules. Supports all standard debate tournament
 * tiebreaker types including head-to-head, speaker points, ranks, and
 * opponent strength metrics.
 *
 * @module tiebreakerEngine
 */

import type { ComputedStanding, HeadToHead, TiebreakerType } from '@/types/tabulation';

/**
 * Result of comparing two standings
 * -1 = first wins (comes before)
 *  0 = tie (no difference)
 *  1 = second wins (comes after)
 */
export type ComparisonResult = -1 | 0 | 1;

/**
 * Information about which tiebreaker decided a comparison
 */
export interface TiebreakerDecision {
  /** The tiebreaker that decided the comparison, or null if still tied */
  decidedBy: TiebreakerType | null;
  /** The comparison result */
  result: ComparisonResult;
}

/**
 * Builds a lookup map from head-to-head records for O(1) access.
 *
 * @param records - Array of head-to-head records
 * @returns Map where key is registration_id and value is array of their H2H records
 *
 * @example
 * const h2hMap = buildHeadToHeadMap(headToHeadRecords);
 * const teamARecords = h2hMap.get('team-a-id');
 */
export function buildHeadToHeadMap(
  records: HeadToHead[]
): Map<string, HeadToHead[]> {
  const map = new Map<string, HeadToHead[]>();

  for (const record of records) {
    const existing = map.get(record.registration_id) || [];
    existing.push(record);
    map.set(record.registration_id, existing);
  }

  return map;
}

/**
 * Looks up head-to-head record between two specific teams.
 *
 * @param registrationId - First team's registration ID
 * @param opponentId - Second team's registration ID
 * @param h2hMap - Pre-built head-to-head map
 * @returns The head-to-head record or undefined if teams never faced each other
 */
export function getHeadToHeadRecord(
  registrationId: string,
  opponentId: string,
  h2hMap: Map<string, HeadToHead[]>
): HeadToHead | undefined {
  const records = h2hMap.get(registrationId);
  if (!records) return undefined;
  return records.find((r) => r.opponent_id === opponentId);
}

/**
 * Generates a deterministic coin flip result based on two registration IDs.
 * Uses string comparison of sorted IDs to ensure consistent results.
 *
 * @param idA - First registration ID
 * @param idB - Second registration ID
 * @returns -1 if A wins, 1 if B wins (never 0 - coin flip always decides)
 *
 * @example
 * // Same result regardless of argument order
 * deterministicCoinFlip('abc', 'xyz') === deterministicCoinFlip('xyz', 'abc')
 */
export function deterministicCoinFlip(idA: string, idB: string): -1 | 1 {
  // Sort IDs to ensure consistent comparison regardless of argument order
  const sorted = [idA, idB].sort();
  // Use a hash-like comparison: combine strings and use character codes
  const combined = sorted[0] + sorted[1];
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  // The team with the lower sorted ID wins on even hash, loses on odd
  return hash % 2 === 0 ? (idA === sorted[0] ? -1 : 1) : (idA === sorted[0] ? 1 : -1);
}

/**
 * Safely retrieves a numeric value from a standing, treating null/undefined as 0.
 *
 * @param standing - The computed standing
 * @param field - The field to retrieve
 * @returns The numeric value or 0 if null/undefined
 */
function safeGetValue(standing: ComputedStanding, field: keyof ComputedStanding): number {
  const value = standing[field];
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : 0;
}

/**
 * Compares two standings using a single tiebreaker type.
 *
 * @param a - First standing to compare
 * @param b - Second standing to compare
 * @param tiebreaker - The tiebreaker type to use
 * @param headToHeadMap - Optional map of head-to-head records for H2H comparisons
 * @returns -1 if a should rank higher, 1 if b should rank higher, 0 if tied
 *
 * @description
 * Tiebreaker logic:
 * - wins: Higher wins first (descending)
 * - losses: Lower losses first (ascending)
 * - speaks: Higher total_speaks first
 * - ranks: Lower total_ranks first (ranks are 1=best)
 * - adjusted_speaks: Higher adjusted_speaks first
 * - adjusted_ranks: Lower adjusted_ranks first
 * - double_adjusted_speaks: Higher double_adjusted_speaks first
 * - double_adjusted_ranks: Lower double_adjusted_ranks first
 * - opp_wins: Higher opp_wins first
 * - opp_win_pct: Higher opp_win_pct first
 * - head_to_head: Check if A beat B more times than B beat A
 * - coin_flip: Deterministic random based on IDs
 *
 * @example
 * const result = compareTiebreaker(teamA, teamB, 'wins');
 * if (result === -1) console.log('Team A ranks higher');
 */
export function compareTiebreaker(
  a: ComputedStanding,
  b: ComputedStanding,
  tiebreaker: TiebreakerType,
  headToHeadMap?: Map<string, HeadToHead[]>
): ComparisonResult {
  switch (tiebreaker) {
    case 'wins': {
      // Higher wins first (descending)
      const aVal = safeGetValue(a, 'wins');
      const bVal = safeGetValue(b, 'wins');
      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;
      return 0;
    }

    case 'losses': {
      // Lower losses first (ascending)
      const aVal = safeGetValue(a, 'losses');
      const bVal = safeGetValue(b, 'losses');
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    }

    case 'speaks': {
      // Higher total_speaks first
      const aVal = safeGetValue(a, 'total_speaks');
      const bVal = safeGetValue(b, 'total_speaks');
      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;
      return 0;
    }

    case 'ranks': {
      // Lower total_ranks first (1 = best)
      const aVal = safeGetValue(a, 'total_ranks');
      const bVal = safeGetValue(b, 'total_ranks');
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    }

    case 'adjusted_speaks': {
      // Higher adjusted_speaks first
      const aVal = safeGetValue(a, 'adjusted_speaks');
      const bVal = safeGetValue(b, 'adjusted_speaks');
      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;
      return 0;
    }

    case 'adjusted_ranks': {
      // Lower adjusted_ranks first
      const aVal = safeGetValue(a, 'adjusted_ranks');
      const bVal = safeGetValue(b, 'adjusted_ranks');
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    }

    case 'double_adjusted_speaks': {
      // Higher double_adjusted_speaks first
      const aVal = safeGetValue(a, 'double_adjusted_speaks');
      const bVal = safeGetValue(b, 'double_adjusted_speaks');
      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;
      return 0;
    }

    case 'double_adjusted_ranks': {
      // Lower double_adjusted_ranks first
      const aVal = safeGetValue(a, 'double_adjusted_ranks');
      const bVal = safeGetValue(b, 'double_adjusted_ranks');
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    }

    case 'opp_wins': {
      // Higher opponent wins first
      const aVal = safeGetValue(a, 'opp_wins');
      const bVal = safeGetValue(b, 'opp_wins');
      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;
      return 0;
    }

    case 'opp_win_pct': {
      // Higher opponent win percentage first
      const aVal = safeGetValue(a, 'opp_win_pct');
      const bVal = safeGetValue(b, 'opp_win_pct');
      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;
      return 0;
    }

    case 'head_to_head': {
      // Check if A beat B more times than B beat A
      if (!headToHeadMap) return 0;

      const aVsB = getHeadToHeadRecord(a.registration_id, b.registration_id, headToHeadMap);
      const bVsA = getHeadToHeadRecord(b.registration_id, a.registration_id, headToHeadMap);

      // If teams never faced each other, it's a tie for this tiebreaker
      if (!aVsB && !bVsA) return 0;

      const aWinsVsB = aVsB?.wins ?? 0;
      const bWinsVsA = bVsA?.wins ?? 0;

      if (aWinsVsB > bWinsVsA) return -1;
      if (aWinsVsB < bWinsVsA) return 1;
      return 0;
    }

    case 'coin_flip': {
      // Deterministic coin flip based on IDs
      return deterministicCoinFlip(a.registration_id, b.registration_id);
    }

    default: {
      // Unknown tiebreaker type - treat as tie
      return 0;
    }
  }
}

/**
 * Determines which tiebreaker (if any) decided the comparison between two standings.
 *
 * @param a - First standing to compare
 * @param b - Second standing to compare
 * @param tiebreakerOrder - Array of tiebreaker types to check in order
 * @param headToHeadMap - Optional map of head-to-head records
 * @returns The tiebreaker type that decided the comparison, or null if still tied
 *
 * @example
 * const decider = getDecidingTiebreaker(teamA, teamB, ['wins', 'speaks', 'ranks']);
 * console.log(`Decided by: ${decider ?? 'Still tied'}`);
 */
export function getDecidingTiebreaker(
  a: ComputedStanding,
  b: ComputedStanding,
  tiebreakerOrder: TiebreakerType[],
  headToHeadMap?: Map<string, HeadToHead[]>
): TiebreakerType | null {
  for (const tiebreaker of tiebreakerOrder) {
    const result = compareTiebreaker(a, b, tiebreaker, headToHeadMap);
    if (result !== 0) {
      return tiebreaker;
    }
  }
  return null;
}

/**
 * Compares two standings using a complete tiebreaker order.
 * Returns both the result and which tiebreaker decided it.
 *
 * @param a - First standing to compare
 * @param b - Second standing to compare
 * @param tiebreakerOrder - Array of tiebreaker types to check in order
 * @param headToHeadMap - Optional map of head-to-head records
 * @returns Object with decidedBy tiebreaker and result
 *
 * @example
 * const { decidedBy, result } = compareTiebreakerOrder(teamA, teamB, tiebreakerOrder);
 */
export function compareTiebreakerOrder(
  a: ComputedStanding,
  b: ComputedStanding,
  tiebreakerOrder: TiebreakerType[],
  headToHeadMap?: Map<string, HeadToHead[]>
): TiebreakerDecision {
  for (const tiebreaker of tiebreakerOrder) {
    const result = compareTiebreaker(a, b, tiebreaker, headToHeadMap);
    if (result !== 0) {
      return { decidedBy: tiebreaker, result };
    }
  }
  return { decidedBy: null, result: 0 };
}

/**
 * Sorts standings by the given tiebreaker order.
 * Uses a stable sort algorithm with O(n log n) performance.
 *
 * @param standings - Array of computed standings to sort
 * @param tiebreakerOrder - Array of tiebreaker types to apply in order
 * @param headToHeadRecords - Optional array of head-to-head records
 * @returns New array of standings sorted by tiebreaker order (does not mutate input)
 *
 * @example
 * const sorted = sortByTiebreakers(standings, ['wins', 'speaks', 'ranks']);
 * // sorted[0] is the top-ranked team
 *
 * @example
 * // With head-to-head records for H2H tiebreaker support
 * const sorted = sortByTiebreakers(
 *   standings,
 *   ['wins', 'head_to_head', 'speaks'],
 *   headToHeadRecords
 * );
 */
export function sortByTiebreakers(
  standings: ComputedStanding[],
  tiebreakerOrder: TiebreakerType[],
  headToHeadRecords?: HeadToHead[]
): ComputedStanding[] {
  // Handle edge cases
  if (standings.length === 0) return [];
  if (standings.length === 1) return [...standings];
  if (tiebreakerOrder.length === 0) return [...standings];

  // Build head-to-head map for O(1) lookups during sort
  const h2hMap = headToHeadRecords
    ? buildHeadToHeadMap(headToHeadRecords)
    : undefined;

  // Create a copy to avoid mutating the input
  const sortedStandings = [...standings];

  // Sort using the tiebreaker order
  sortedStandings.sort((a, b) => {
    const { result } = compareTiebreakerOrder(a, b, tiebreakerOrder, h2hMap);
    return result;
  });

  return sortedStandings;
}

/**
 * Groups standings into tiers where all teams in a tier are tied
 * through all provided tiebreakers.
 *
 * @param standings - Array of computed standings (should already be sorted)
 * @param tiebreakerOrder - Array of tiebreaker types used for comparison
 * @param headToHeadRecords - Optional array of head-to-head records
 * @returns Array of tiers, where each tier is an array of tied standings
 *
 * @example
 * const tiers = groupIntoTiers(sortedStandings, tiebreakerOrder);
 * // tiers[0] = [1st place team(s)]
 * // tiers[1] = [2nd place team(s)]
 */
export function groupIntoTiers(
  standings: ComputedStanding[],
  tiebreakerOrder: TiebreakerType[],
  headToHeadRecords?: HeadToHead[]
): ComputedStanding[][] {
  if (standings.length === 0) return [];
  if (standings.length === 1) return [[standings[0]]];

  const h2hMap = headToHeadRecords
    ? buildHeadToHeadMap(headToHeadRecords)
    : undefined;

  const tiers: ComputedStanding[][] = [];
  let currentTier: ComputedStanding[] = [standings[0]];

  for (let i = 1; i < standings.length; i++) {
    const prev = standings[i - 1];
    const curr = standings[i];
    const { result } = compareTiebreakerOrder(prev, curr, tiebreakerOrder, h2hMap);

    if (result === 0) {
      // Teams are tied - add to current tier
      currentTier.push(curr);
    } else {
      // New tier
      tiers.push(currentTier);
      currentTier = [curr];
    }
  }

  // Don't forget the last tier
  tiers.push(currentTier);

  return tiers;
}

/**
 * Creates a comparison function for use with Array.sort().
 * Useful when you need to integrate with other sorting logic.
 *
 * @param tiebreakerOrder - Array of tiebreaker types to apply
 * @param headToHeadRecords - Optional array of head-to-head records
 * @returns A comparison function compatible with Array.sort()
 *
 * @example
 * const compareFn = createTiebreakerComparator(['wins', 'speaks']);
 * standings.sort(compareFn);
 */
export function createTiebreakerComparator(
  tiebreakerOrder: TiebreakerType[],
  headToHeadRecords?: HeadToHead[]
): (a: ComputedStanding, b: ComputedStanding) => number {
  const h2hMap = headToHeadRecords
    ? buildHeadToHeadMap(headToHeadRecords)
    : undefined;

  return (a: ComputedStanding, b: ComputedStanding) => {
    const { result } = compareTiebreakerOrder(a, b, tiebreakerOrder, h2hMap);
    return result;
  };
}
