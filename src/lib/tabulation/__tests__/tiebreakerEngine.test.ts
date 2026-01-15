/**
 * Tests for the Tiebreaker Calculation Engine
 *
 * Comprehensive test suite covering all tiebreaker types, edge cases,
 * and complex tournament scenarios.
 */

import { describe, it, expect } from 'vitest';
import {
  compareTiebreaker,
  sortByTiebreakers,
  getDecidingTiebreaker,
  buildHeadToHeadMap,
  getHeadToHeadRecord,
  deterministicCoinFlip,
  compareTiebreakerOrder,
  groupIntoTiers,
  createTiebreakerComparator,
} from '../tiebreakerEngine';
import type { ComputedStanding, HeadToHead, TiebreakerType } from '@/types/tabulation';

/**
 * Factory function to create test standings with sensible defaults
 */
function createStanding(overrides: Partial<ComputedStanding> = {}): ComputedStanding {
  return {
    id: `standing-${Math.random().toString(36).slice(2, 9)}`,
    tournament_id: 'tournament-1',
    event_id: 'event-1',
    registration_id: `reg-${Math.random().toString(36).slice(2, 9)}`,
    wins: 0,
    losses: 0,
    byes: 0,
    forfeits_given: 0,
    forfeits_received: 0,
    total_speaks: 0,
    avg_speaks: 0,
    adjusted_speaks: 0,
    double_adjusted_speaks: 0,
    total_ranks: 0,
    avg_ranks: 0,
    adjusted_ranks: 0,
    double_adjusted_ranks: 0,
    opp_wins: 0,
    opp_win_pct: 0,
    aff_rounds: 0,
    neg_rounds: 0,
    prelim_rank: null,
    overall_rank: null,
    is_breaking: false,
    break_seed: null,
    rounds_completed: 0,
    last_computed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Factory function to create head-to-head records
 */
function createH2H(overrides: Partial<HeadToHead> = {}): HeadToHead {
  return {
    id: `h2h-${Math.random().toString(36).slice(2, 9)}`,
    tournament_id: 'tournament-1',
    event_id: 'event-1',
    registration_id: 'team-a',
    opponent_id: 'team-b',
    wins: 0,
    losses: 0,
    total_speaks_for: 0,
    total_speaks_against: 0,
    ...overrides,
  };
}

// ============================================================================
// Test 1: Basic wins comparison
// ============================================================================
describe('compareTiebreaker - wins', () => {
  it('should rank team with more wins higher', () => {
    const teamA = createStanding({ registration_id: 'team-a', wins: 4 });
    const teamB = createStanding({ registration_id: 'team-b', wins: 3 });

    const result = compareTiebreaker(teamA, teamB, 'wins');
    expect(result).toBe(-1); // A ranks higher (comes before)
  });

  it('should rank team with fewer wins lower', () => {
    const teamA = createStanding({ registration_id: 'team-a', wins: 2 });
    const teamB = createStanding({ registration_id: 'team-b', wins: 5 });

    const result = compareTiebreaker(teamA, teamB, 'wins');
    expect(result).toBe(1); // B ranks higher
  });

  it('should return 0 when wins are equal', () => {
    const teamA = createStanding({ registration_id: 'team-a', wins: 3 });
    const teamB = createStanding({ registration_id: 'team-b', wins: 3 });

    const result = compareTiebreaker(teamA, teamB, 'wins');
    expect(result).toBe(0);
  });
});

// ============================================================================
// Test 2: Basic speaks comparison
// ============================================================================
describe('compareTiebreaker - speaks', () => {
  it('should rank team with higher speaker points first', () => {
    const teamA = createStanding({ registration_id: 'team-a', total_speaks: 285.5 });
    const teamB = createStanding({ registration_id: 'team-b', total_speaks: 280.0 });

    const result = compareTiebreaker(teamA, teamB, 'speaks');
    expect(result).toBe(-1);
  });

  it('should return 0 when speaks are exactly equal', () => {
    const teamA = createStanding({ registration_id: 'team-a', total_speaks: 285.0 });
    const teamB = createStanding({ registration_id: 'team-b', total_speaks: 285.0 });

    const result = compareTiebreaker(teamA, teamB, 'speaks');
    expect(result).toBe(0);
  });

  it('should handle decimal differences correctly', () => {
    const teamA = createStanding({ registration_id: 'team-a', total_speaks: 285.25 });
    const teamB = createStanding({ registration_id: 'team-b', total_speaks: 285.24 });

    const result = compareTiebreaker(teamA, teamB, 'speaks');
    expect(result).toBe(-1);
  });
});

// ============================================================================
// Test 3: Ranks comparison (lower is better)
// ============================================================================
describe('compareTiebreaker - ranks', () => {
  it('should rank team with lower total ranks first (ranks are 1=best)', () => {
    const teamA = createStanding({ registration_id: 'team-a', total_ranks: 8 });
    const teamB = createStanding({ registration_id: 'team-b', total_ranks: 12 });

    const result = compareTiebreaker(teamA, teamB, 'ranks');
    expect(result).toBe(-1); // A has better (lower) ranks
  });

  it('should rank team with higher total ranks lower', () => {
    const teamA = createStanding({ registration_id: 'team-a', total_ranks: 15 });
    const teamB = createStanding({ registration_id: 'team-b', total_ranks: 10 });

    const result = compareTiebreaker(teamA, teamB, 'ranks');
    expect(result).toBe(1); // B has better ranks
  });

  it('should return 0 when ranks are equal', () => {
    const teamA = createStanding({ registration_id: 'team-a', total_ranks: 10 });
    const teamB = createStanding({ registration_id: 'team-b', total_ranks: 10 });

    const result = compareTiebreaker(teamA, teamB, 'ranks');
    expect(result).toBe(0);
  });
});

// ============================================================================
// Test 4: Head-to-head winner
// ============================================================================
describe('compareTiebreaker - head_to_head', () => {
  it('should rank team that beat the other team higher', () => {
    const teamA = createStanding({ registration_id: 'team-a' });
    const teamB = createStanding({ registration_id: 'team-b' });

    const h2hRecords: HeadToHead[] = [
      createH2H({ registration_id: 'team-a', opponent_id: 'team-b', wins: 1, losses: 0 }),
      createH2H({ registration_id: 'team-b', opponent_id: 'team-a', wins: 0, losses: 1 }),
    ];
    const h2hMap = buildHeadToHeadMap(h2hRecords);

    const result = compareTiebreaker(teamA, teamB, 'head_to_head', h2hMap);
    expect(result).toBe(-1); // A beat B
  });

  it('should rank team that lost to the other team lower', () => {
    const teamA = createStanding({ registration_id: 'team-a' });
    const teamB = createStanding({ registration_id: 'team-b' });

    const h2hRecords: HeadToHead[] = [
      createH2H({ registration_id: 'team-a', opponent_id: 'team-b', wins: 0, losses: 2 }),
      createH2H({ registration_id: 'team-b', opponent_id: 'team-a', wins: 2, losses: 0 }),
    ];
    const h2hMap = buildHeadToHeadMap(h2hRecords);

    const result = compareTiebreaker(teamA, teamB, 'head_to_head', h2hMap);
    expect(result).toBe(1); // B beat A twice
  });
});

// ============================================================================
// Test 5: Head-to-head tie (never met)
// ============================================================================
describe('compareTiebreaker - head_to_head ties', () => {
  it('should return 0 when teams never faced each other', () => {
    const teamA = createStanding({ registration_id: 'team-a' });
    const teamB = createStanding({ registration_id: 'team-b' });

    // No H2H records between these teams
    const h2hRecords: HeadToHead[] = [];
    const h2hMap = buildHeadToHeadMap(h2hRecords);

    const result = compareTiebreaker(teamA, teamB, 'head_to_head', h2hMap);
    expect(result).toBe(0);
  });

  it('should return 0 when H2H record is split (1-1)', () => {
    const teamA = createStanding({ registration_id: 'team-a' });
    const teamB = createStanding({ registration_id: 'team-b' });

    const h2hRecords: HeadToHead[] = [
      createH2H({ registration_id: 'team-a', opponent_id: 'team-b', wins: 1, losses: 1 }),
      createH2H({ registration_id: 'team-b', opponent_id: 'team-a', wins: 1, losses: 1 }),
    ];
    const h2hMap = buildHeadToHeadMap(h2hRecords);

    const result = compareTiebreaker(teamA, teamB, 'head_to_head', h2hMap);
    expect(result).toBe(0);
  });

  it('should return 0 when no H2H map is provided', () => {
    const teamA = createStanding({ registration_id: 'team-a' });
    const teamB = createStanding({ registration_id: 'team-b' });

    const result = compareTiebreaker(teamA, teamB, 'head_to_head');
    expect(result).toBe(0);
  });
});

// ============================================================================
// Test 6: Multiple tiebreakers in sequence
// ============================================================================
describe('getDecidingTiebreaker - multiple tiebreakers', () => {
  it('should return the first tiebreaker that decides the comparison', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      wins: 3,
      total_speaks: 285,
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      wins: 3,
      total_speaks: 280,
    });

    const tiebreakerOrder: TiebreakerType[] = ['wins', 'speaks', 'ranks'];
    const result = getDecidingTiebreaker(teamA, teamB, tiebreakerOrder);

    expect(result).toBe('speaks'); // wins are tied, speaks decides
  });

  it('should return null when all tiebreakers result in a tie', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      wins: 3,
      total_speaks: 280,
      total_ranks: 10,
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      wins: 3,
      total_speaks: 280,
      total_ranks: 10,
    });

    // Note: No coin_flip in order, so should remain tied
    const tiebreakerOrder: TiebreakerType[] = ['wins', 'speaks', 'ranks'];
    const result = getDecidingTiebreaker(teamA, teamB, tiebreakerOrder);

    expect(result).toBeNull();
  });

  it('should use coin_flip as final tiebreaker when included', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      wins: 3,
      total_speaks: 280,
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      wins: 3,
      total_speaks: 280,
    });

    const tiebreakerOrder: TiebreakerType[] = ['wins', 'speaks', 'coin_flip'];
    const result = getDecidingTiebreaker(teamA, teamB, tiebreakerOrder);

    expect(result).toBe('coin_flip');
  });
});

// ============================================================================
// Test 7: Full sort of 5+ teams
// ============================================================================
describe('sortByTiebreakers - full sort', () => {
  it('should correctly sort 5 teams by multiple tiebreakers', () => {
    const teams = [
      createStanding({ registration_id: 'team-e', wins: 2, total_speaks: 260 }),
      createStanding({ registration_id: 'team-c', wins: 3, total_speaks: 275 }),
      createStanding({ registration_id: 'team-a', wins: 4, total_speaks: 285 }),
      createStanding({ registration_id: 'team-d', wins: 3, total_speaks: 280 }),
      createStanding({ registration_id: 'team-b', wins: 4, total_speaks: 290 }),
    ];

    const tiebreakerOrder: TiebreakerType[] = ['wins', 'speaks'];
    const sorted = sortByTiebreakers(teams, tiebreakerOrder);

    // Expected order: B (4-290), A (4-285), D (3-280), C (3-275), E (2-260)
    expect(sorted.map(t => t.registration_id)).toEqual([
      'team-b',
      'team-a',
      'team-d',
      'team-c',
      'team-e',
    ]);
  });

  it('should handle 6 teams with complex tiebreaker cascade', () => {
    const teams = [
      createStanding({ registration_id: 'team-1', wins: 3, total_speaks: 280, total_ranks: 12 }),
      createStanding({ registration_id: 'team-2', wins: 3, total_speaks: 280, total_ranks: 10 }),
      createStanding({ registration_id: 'team-3', wins: 4, total_speaks: 270, total_ranks: 8 }),
      createStanding({ registration_id: 'team-4', wins: 3, total_speaks: 285, total_ranks: 11 }),
      createStanding({ registration_id: 'team-5', wins: 2, total_speaks: 290, total_ranks: 15 }),
      createStanding({ registration_id: 'team-6', wins: 4, total_speaks: 275, total_ranks: 9 }),
    ];

    const tiebreakerOrder: TiebreakerType[] = ['wins', 'speaks', 'ranks'];
    const sorted = sortByTiebreakers(teams, tiebreakerOrder);

    // 4 wins: team-6 (275) > team-3 (270)
    // 3 wins: team-4 (285) > team-1/2 (280) -> team-2 (rank 10) > team-1 (rank 12)
    // 2 wins: team-5
    expect(sorted.map(t => t.registration_id)).toEqual([
      'team-6',
      'team-3',
      'team-4',
      'team-2',
      'team-1',
      'team-5',
    ]);
  });
});

// ============================================================================
// Test 8: Empty standings array
// ============================================================================
describe('sortByTiebreakers - edge cases', () => {
  it('should return empty array for empty input', () => {
    const sorted = sortByTiebreakers([], ['wins', 'speaks']);
    expect(sorted).toEqual([]);
  });

  it('should not mutate the original array', () => {
    const original = [
      createStanding({ registration_id: 'team-b', wins: 2 }),
      createStanding({ registration_id: 'team-a', wins: 3 }),
    ];
    const originalOrder = [...original.map(t => t.registration_id)];

    sortByTiebreakers(original, ['wins']);

    expect(original.map(t => t.registration_id)).toEqual(originalOrder);
  });
});

// ============================================================================
// Test 9: Single team (no comparison needed)
// ============================================================================
describe('sortByTiebreakers - single team', () => {
  it('should return single team unchanged', () => {
    const team = createStanding({ registration_id: 'solo-team', wins: 3 });
    const sorted = sortByTiebreakers([team], ['wins', 'speaks']);

    expect(sorted).toHaveLength(1);
    expect(sorted[0].registration_id).toBe('solo-team');
  });
});

// ============================================================================
// Test 10: All teams tied through all tiebreakers
// ============================================================================
describe('sortByTiebreakers - complete ties', () => {
  it('should maintain stable order when all teams are completely tied', () => {
    const teams = [
      createStanding({ registration_id: 'team-1', wins: 3, total_speaks: 280 }),
      createStanding({ registration_id: 'team-2', wins: 3, total_speaks: 280 }),
      createStanding({ registration_id: 'team-3', wins: 3, total_speaks: 280 }),
    ];

    // Without coin_flip, teams should remain tied in original order
    const tiebreakerOrder: TiebreakerType[] = ['wins', 'speaks'];
    const sorted = sortByTiebreakers(teams, tiebreakerOrder);

    // All tied - stable sort maintains original relative order
    expect(sorted).toHaveLength(3);
  });

  it('should use empty tiebreaker order gracefully', () => {
    const teams = [
      createStanding({ registration_id: 'team-a', wins: 3 }),
      createStanding({ registration_id: 'team-b', wins: 4 }),
    ];

    const sorted = sortByTiebreakers(teams, []);

    // No tiebreakers means no sorting - maintains original order
    expect(sorted.map(t => t.registration_id)).toEqual(['team-a', 'team-b']);
  });
});

// ============================================================================
// Test 11: Coin flip determinism
// ============================================================================
describe('deterministicCoinFlip', () => {
  it('should return same result for same ID pair regardless of order', () => {
    const result1 = deterministicCoinFlip('team-abc', 'team-xyz');
    const result2 = deterministicCoinFlip('team-xyz', 'team-abc');

    // Results should be opposite since we're flipping the comparison direction
    expect(result1).toBe(result2 === -1 ? 1 : -1);
  });

  it('should always return -1 or 1, never 0', () => {
    const pairs = [
      ['a', 'b'],
      ['team-1', 'team-2'],
      ['abc123', 'xyz789'],
      ['same-prefix-1', 'same-prefix-2'],
    ];

    for (const [a, b] of pairs) {
      const result = deterministicCoinFlip(a, b);
      expect(result === -1 || result === 1).toBe(true);
    }
  });

  it('should produce consistent results across multiple calls', () => {
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(deterministicCoinFlip('consistent-a', 'consistent-b'));
    }

    // All results should be the same
    expect(new Set(results).size).toBe(1);
  });
});

// ============================================================================
// Test 12: Null value handling
// ============================================================================
describe('compareTiebreaker - null handling', () => {
  it('should treat null wins as 0', () => {
    const teamA = createStanding({ registration_id: 'team-a', wins: 3 });
    const teamB = createStanding({ registration_id: 'team-b' });
    // Override to null using type assertion
    (teamB as { wins: number | null }).wins = null as unknown as number;

    const result = compareTiebreaker(teamA, teamB, 'wins');
    expect(result).toBe(-1); // 3 > 0
  });

  it('should treat null speaks as 0', () => {
    const teamA = createStanding({ registration_id: 'team-a' });
    const teamB = createStanding({ registration_id: 'team-b', total_speaks: 280 });
    (teamA as { total_speaks: number | null }).total_speaks = null as unknown as number;

    const result = compareTiebreaker(teamA, teamB, 'speaks');
    expect(result).toBe(1); // 0 < 280
  });

  it('should handle both teams having null values', () => {
    const teamA = createStanding({ registration_id: 'team-a' });
    const teamB = createStanding({ registration_id: 'team-b' });
    (teamA as { total_speaks: number | null }).total_speaks = null as unknown as number;
    (teamB as { total_speaks: number | null }).total_speaks = null as unknown as number;

    const result = compareTiebreaker(teamA, teamB, 'speaks');
    expect(result).toBe(0); // Both treated as 0
  });
});

// ============================================================================
// Test 13: Adjusted speaks (drop high/low scenario)
// ============================================================================
describe('compareTiebreaker - adjusted metrics', () => {
  it('should compare adjusted_speaks correctly', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      total_speaks: 290,
      adjusted_speaks: 275, // After dropping high/low
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      total_speaks: 280,
      adjusted_speaks: 278, // Better after adjustment
    });

    // Total speaks: A > B
    expect(compareTiebreaker(teamA, teamB, 'speaks')).toBe(-1);

    // Adjusted speaks: B > A
    expect(compareTiebreaker(teamA, teamB, 'adjusted_speaks')).toBe(1);
  });

  it('should compare double_adjusted_speaks correctly', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      double_adjusted_speaks: 265,
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      double_adjusted_speaks: 260,
    });

    const result = compareTiebreaker(teamA, teamB, 'double_adjusted_speaks');
    expect(result).toBe(-1);
  });

  it('should compare adjusted_ranks correctly (lower is better)', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      adjusted_ranks: 8,
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      adjusted_ranks: 10,
    });

    const result = compareTiebreaker(teamA, teamB, 'adjusted_ranks');
    expect(result).toBe(-1); // A has better (lower) adjusted ranks
  });

  it('should compare double_adjusted_ranks correctly (lower is better)', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      double_adjusted_ranks: 6,
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      double_adjusted_ranks: 5,
    });

    const result = compareTiebreaker(teamA, teamB, 'double_adjusted_ranks');
    expect(result).toBe(1); // B has better (lower) double adjusted ranks
  });
});

// ============================================================================
// Test 14: Opponent strength calculation
// ============================================================================
describe('compareTiebreaker - opponent strength', () => {
  it('should rank team with higher opp_wins first', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      wins: 3,
      opp_wins: 15, // Faced tougher opponents
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      wins: 3,
      opp_wins: 12,
    });

    const result = compareTiebreaker(teamA, teamB, 'opp_wins');
    expect(result).toBe(-1);
  });

  it('should rank team with higher opp_win_pct first', () => {
    const teamA = createStanding({
      registration_id: 'team-a',
      opp_win_pct: 0.65,
    });
    const teamB = createStanding({
      registration_id: 'team-b',
      opp_win_pct: 0.72,
    });

    const result = compareTiebreaker(teamA, teamB, 'opp_win_pct');
    expect(result).toBe(1); // B has higher opp_win_pct
  });

  it('should correctly sort by opponent strength in full sort', () => {
    const teams = [
      createStanding({ registration_id: 'team-1', wins: 3, opp_wins: 12 }),
      createStanding({ registration_id: 'team-2', wins: 3, opp_wins: 15 }),
      createStanding({ registration_id: 'team-3', wins: 3, opp_wins: 10 }),
    ];

    const tiebreakerOrder: TiebreakerType[] = ['wins', 'opp_wins'];
    const sorted = sortByTiebreakers(teams, tiebreakerOrder);

    expect(sorted.map(t => t.registration_id)).toEqual([
      'team-2', // 15 opp wins
      'team-1', // 12 opp wins
      'team-3', // 10 opp wins
    ]);
  });
});

// ============================================================================
// Test 15: Complex 10-team scenario with mixed records
// ============================================================================
describe('sortByTiebreakers - complex 10-team tournament', () => {
  it('should correctly rank a full tournament field', () => {
    const teams = [
      createStanding({
        registration_id: 'team-01',
        wins: 5, losses: 1,
        total_speaks: 295, total_ranks: 7,
        opp_wins: 18,
      }),
      createStanding({
        registration_id: 'team-02',
        wins: 5, losses: 1,
        total_speaks: 292, total_ranks: 8,
        opp_wins: 20,
      }),
      createStanding({
        registration_id: 'team-03',
        wins: 4, losses: 2,
        total_speaks: 288, total_ranks: 10,
        opp_wins: 19,
      }),
      createStanding({
        registration_id: 'team-04',
        wins: 4, losses: 2,
        total_speaks: 288, total_ranks: 11,
        opp_wins: 17,
      }),
      createStanding({
        registration_id: 'team-05',
        wins: 4, losses: 2,
        total_speaks: 285, total_ranks: 12,
        opp_wins: 16,
      }),
      createStanding({
        registration_id: 'team-06',
        wins: 3, losses: 3,
        total_speaks: 280, total_ranks: 14,
        opp_wins: 15,
      }),
      createStanding({
        registration_id: 'team-07',
        wins: 3, losses: 3,
        total_speaks: 278, total_ranks: 15,
        opp_wins: 18,
      }),
      createStanding({
        registration_id: 'team-08',
        wins: 2, losses: 4,
        total_speaks: 275, total_ranks: 18,
        opp_wins: 20,
      }),
      createStanding({
        registration_id: 'team-09',
        wins: 1, losses: 5,
        total_speaks: 265, total_ranks: 22,
        opp_wins: 19,
      }),
      createStanding({
        registration_id: 'team-10',
        wins: 0, losses: 6,
        total_speaks: 255, total_ranks: 25,
        opp_wins: 21,
      }),
    ];

    // H2H records for teams with same record
    const h2hRecords: HeadToHead[] = [
      // Team-01 beat Team-02 in their matchup
      createH2H({ registration_id: 'team-01', opponent_id: 'team-02', wins: 1, losses: 0 }),
      createH2H({ registration_id: 'team-02', opponent_id: 'team-01', wins: 0, losses: 1 }),
      // Team-03 beat Team-04
      createH2H({ registration_id: 'team-03', opponent_id: 'team-04', wins: 1, losses: 0 }),
      createH2H({ registration_id: 'team-04', opponent_id: 'team-03', wins: 0, losses: 1 }),
    ];

    const tiebreakerOrder: TiebreakerType[] = [
      'wins',
      'head_to_head',
      'speaks',
      'ranks',
      'opp_wins',
      'coin_flip',
    ];

    const sorted = sortByTiebreakers(teams, tiebreakerOrder, h2hRecords);

    // Expected order:
    // 5 wins: team-01 beat team-02 H2H, so team-01 first
    // 4 wins: team-03 beat team-04 H2H, then team-05 (lower speaks)
    // 3 wins: team-06 (280 speaks) > team-07 (278 speaks)
    // 2 wins: team-08
    // 1 win: team-09
    // 0 wins: team-10

    const expectedOrder = [
      'team-01', 'team-02', // 5 wins, H2H decides
      'team-03', 'team-04', 'team-05', // 4 wins
      'team-06', 'team-07', // 3 wins
      'team-08', // 2 wins
      'team-09', // 1 win
      'team-10', // 0 wins
    ];

    expect(sorted.map(t => t.registration_id)).toEqual(expectedOrder);
  });
});

// ============================================================================
// Additional tests for comprehensive coverage
// ============================================================================
describe('compareTiebreaker - losses tiebreaker', () => {
  it('should rank team with fewer losses first', () => {
    const teamA = createStanding({ registration_id: 'team-a', losses: 1 });
    const teamB = createStanding({ registration_id: 'team-b', losses: 2 });

    const result = compareTiebreaker(teamA, teamB, 'losses');
    expect(result).toBe(-1);
  });

  it('should rank team with more losses lower', () => {
    const teamA = createStanding({ registration_id: 'team-a', losses: 3 });
    const teamB = createStanding({ registration_id: 'team-b', losses: 1 });

    const result = compareTiebreaker(teamA, teamB, 'losses');
    expect(result).toBe(1);
  });
});

describe('buildHeadToHeadMap', () => {
  it('should correctly build map from records', () => {
    const records: HeadToHead[] = [
      createH2H({ registration_id: 'team-a', opponent_id: 'team-b', wins: 1 }),
      createH2H({ registration_id: 'team-a', opponent_id: 'team-c', wins: 2 }),
      createH2H({ registration_id: 'team-b', opponent_id: 'team-a', wins: 0 }),
    ];

    const map = buildHeadToHeadMap(records);

    expect(map.get('team-a')).toHaveLength(2);
    expect(map.get('team-b')).toHaveLength(1);
    expect(map.has('team-c')).toBe(false);
  });

  it('should return empty map for empty records', () => {
    const map = buildHeadToHeadMap([]);
    expect(map.size).toBe(0);
  });
});

describe('getHeadToHeadRecord', () => {
  it('should find specific H2H record', () => {
    const records: HeadToHead[] = [
      createH2H({ registration_id: 'team-a', opponent_id: 'team-b', wins: 2 }),
      createH2H({ registration_id: 'team-a', opponent_id: 'team-c', wins: 1 }),
    ];
    const map = buildHeadToHeadMap(records);

    const record = getHeadToHeadRecord('team-a', 'team-b', map);
    expect(record?.wins).toBe(2);
  });

  it('should return undefined for non-existent record', () => {
    const map = buildHeadToHeadMap([]);
    const record = getHeadToHeadRecord('team-x', 'team-y', map);
    expect(record).toBeUndefined();
  });
});

describe('compareTiebreakerOrder', () => {
  it('should return full decision object', () => {
    const teamA = createStanding({ registration_id: 'team-a', wins: 4 });
    const teamB = createStanding({ registration_id: 'team-b', wins: 3 });

    const decision = compareTiebreakerOrder(teamA, teamB, ['wins', 'speaks']);

    expect(decision.decidedBy).toBe('wins');
    expect(decision.result).toBe(-1);
  });

  it('should return null decidedBy when tied through all tiebreakers', () => {
    const teamA = createStanding({ registration_id: 'team-a', wins: 3, total_speaks: 280 });
    const teamB = createStanding({ registration_id: 'team-b', wins: 3, total_speaks: 280 });

    const decision = compareTiebreakerOrder(teamA, teamB, ['wins', 'speaks']);

    expect(decision.decidedBy).toBeNull();
    expect(decision.result).toBe(0);
  });
});

describe('groupIntoTiers', () => {
  it('should group tied teams into same tier', () => {
    const standings = [
      createStanding({ registration_id: 'team-1', wins: 4 }),
      createStanding({ registration_id: 'team-2', wins: 4 }),
      createStanding({ registration_id: 'team-3', wins: 3 }),
      createStanding({ registration_id: 'team-4', wins: 3 }),
      createStanding({ registration_id: 'team-5', wins: 2 }),
    ];

    const sorted = sortByTiebreakers(standings, ['wins']);
    const tiers = groupIntoTiers(sorted, ['wins']);

    expect(tiers).toHaveLength(3);
    expect(tiers[0].map(t => t.registration_id).sort()).toEqual(['team-1', 'team-2']);
    expect(tiers[1].map(t => t.registration_id).sort()).toEqual(['team-3', 'team-4']);
    expect(tiers[2].map(t => t.registration_id)).toEqual(['team-5']);
  });

  it('should return empty array for empty standings', () => {
    const tiers = groupIntoTiers([], ['wins']);
    expect(tiers).toEqual([]);
  });

  it('should return single tier for single team', () => {
    const standings = [createStanding({ registration_id: 'solo' })];
    const tiers = groupIntoTiers(standings, ['wins']);
    expect(tiers).toHaveLength(1);
    expect(tiers[0]).toHaveLength(1);
  });
});

describe('createTiebreakerComparator', () => {
  it('should create a working comparator function', () => {
    const comparator = createTiebreakerComparator(['wins', 'speaks']);

    const teamA = createStanding({ registration_id: 'team-a', wins: 4, total_speaks: 280 });
    const teamB = createStanding({ registration_id: 'team-b', wins: 3, total_speaks: 290 });

    expect(comparator(teamA, teamB)).toBe(-1);
    expect(comparator(teamB, teamA)).toBe(1);
  });

  it('should work with Array.sort()', () => {
    const teams = [
      createStanding({ registration_id: 'team-c', wins: 2 }),
      createStanding({ registration_id: 'team-a', wins: 4 }),
      createStanding({ registration_id: 'team-b', wins: 3 }),
    ];

    const comparator = createTiebreakerComparator(['wins']);
    teams.sort(comparator);

    expect(teams.map(t => t.registration_id)).toEqual(['team-a', 'team-b', 'team-c']);
  });
});

describe('Unknown tiebreaker type', () => {
  it('should return 0 for unknown tiebreaker type', () => {
    const teamA = createStanding({ registration_id: 'team-a' });
    const teamB = createStanding({ registration_id: 'team-b' });

    // Force an unknown type for testing
    const result = compareTiebreaker(teamA, teamB, 'unknown_type' as TiebreakerType);
    expect(result).toBe(0);
  });
});
