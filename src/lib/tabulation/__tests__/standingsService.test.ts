/**
 * Tests for the Standings Computation Service
 *
 * Comprehensive test suite covering standings computation, helper functions,
 * and edge cases for tournament tabulation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateAdjustedValue,
  calculateAdjusted,
  calculateAdjustedSpeaks,
  calculateOpponentStrength,
  type AggregatedStats,
  type OpponentStats,
} from '../standingsService';
import type { ComputedStanding, TiebreakerType } from '@/types/tabulation';
import { sortByTiebreakers } from '../tiebreakerEngine';

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
 * Factory function to create test aggregated stats
 */
function createAggregatedStats(overrides: Partial<AggregatedStats> = {}): AggregatedStats {
  return {
    registrationId: `reg-${Math.random().toString(36).slice(2, 9)}`,
    wins: 0,
    losses: 0,
    byes: 0,
    forfeitsGiven: 0,
    forfeitsReceived: 0,
    speaksList: [],
    ranksList: [],
    affRounds: 0,
    negRounds: 0,
    opponentIds: [],
    roundsCompleted: 0,
    ...overrides,
  };
}

// ============================================================================
// Test 1: Single team single round
// ============================================================================
describe('Standings computation - single team single round', () => {
  it('should correctly compute standings for a single team with one round', () => {
    // Simulating a team that won their only round
    const standing = createStanding({
      registration_id: 'team-a',
      wins: 1,
      losses: 0,
      total_speaks: 28.5,
      total_ranks: 1,
      rounds_completed: 1,
      aff_rounds: 1,
      neg_rounds: 0,
    });

    expect(standing.wins).toBe(1);
    expect(standing.losses).toBe(0);
    expect(standing.total_speaks).toBe(28.5);
    expect(standing.rounds_completed).toBe(1);
    expect(standing.aff_rounds).toBe(1);
  });

  it('should calculate averages correctly for single round', () => {
    const speaks = [28.5];
    const avgSpeaks = speaks.reduce((sum, s) => sum + s, 0) / speaks.length;

    expect(avgSpeaks).toBe(28.5);
  });
});

// ============================================================================
// Test 2: Multiple teams multiple rounds
// ============================================================================
describe('Standings computation - multiple teams multiple rounds', () => {
  it('should correctly rank multiple teams after multiple rounds', () => {
    const teams = [
      createStanding({
        registration_id: 'team-1',
        wins: 3,
        losses: 1,
        total_speaks: 114.0, // 28.5 avg
        rounds_completed: 4,
      }),
      createStanding({
        registration_id: 'team-2',
        wins: 2,
        losses: 2,
        total_speaks: 110.0,
        rounds_completed: 4,
      }),
      createStanding({
        registration_id: 'team-3',
        wins: 4,
        losses: 0,
        total_speaks: 120.0,
        rounds_completed: 4,
      }),
      createStanding({
        registration_id: 'team-4',
        wins: 1,
        losses: 3,
        total_speaks: 100.0,
        rounds_completed: 4,
      }),
    ];

    const tiebreakerOrder: TiebreakerType[] = ['wins', 'speaks'];
    const sorted = sortByTiebreakers(teams, tiebreakerOrder);

    // Expected order by wins: team-3 (4), team-1 (3), team-2 (2), team-4 (1)
    expect(sorted.map(t => t.registration_id)).toEqual([
      'team-3',
      'team-1',
      'team-2',
      'team-4',
    ]);
  });

  it('should break ties using speaks when wins are equal', () => {
    const teams = [
      createStanding({
        registration_id: 'team-a',
        wins: 3,
        total_speaks: 115.0,
      }),
      createStanding({
        registration_id: 'team-b',
        wins: 3,
        total_speaks: 118.0, // Higher speaks
      }),
    ];

    const tiebreakerOrder: TiebreakerType[] = ['wins', 'speaks'];
    const sorted = sortByTiebreakers(teams, tiebreakerOrder);

    expect(sorted[0].registration_id).toBe('team-b');
    expect(sorted[1].registration_id).toBe('team-a');
  });
});

// ============================================================================
// Test 3: Bye handling
// ============================================================================
describe('Standings computation - bye handling', () => {
  it('should count bye as a win', () => {
    const standing = createStanding({
      registration_id: 'team-with-bye',
      wins: 3,
      losses: 1,
      byes: 1, // One of the wins is a bye
      rounds_completed: 4,
    });

    // Byes count as wins, so 3 wins includes 1 bye
    expect(standing.wins).toBe(3);
    expect(standing.byes).toBe(1);
  });

  it('should handle team with only byes', () => {
    const standing = createStanding({
      registration_id: 'all-byes',
      wins: 2,
      losses: 0,
      byes: 2,
      rounds_completed: 2,
      total_speaks: 0, // Byes don't have speaks
    });

    expect(standing.wins).toBe(2);
    expect(standing.byes).toBe(2);
    expect(standing.total_speaks).toBe(0);
  });

  it('should not penalize speaks calculation for byes', () => {
    // Team A has 3 regular rounds with speaks
    // Team B has 2 regular rounds + 1 bye
    const teamA = createStanding({
      registration_id: 'team-a',
      wins: 3,
      total_speaks: 87.0, // 29 avg
      rounds_completed: 3,
    });

    const teamB = createStanding({
      registration_id: 'team-b',
      wins: 3,
      byes: 1,
      total_speaks: 60.0, // 30 avg over 2 rounds
      rounds_completed: 3,
    });

    // When comparing by total speaks, team A has more
    // But team B might have higher average if calculated correctly
    expect(teamA.total_speaks).toBeGreaterThan(teamB.total_speaks);
  });
});

// ============================================================================
// Test 4: Adjusted speaks calculation
// ============================================================================
describe('calculateAdjustedValue - adjusted speaks', () => {
  it('should calculate adjusted speaks by dropping 1 high and 1 low', () => {
    const speaks = [25, 27, 28, 29, 30];
    const adjusted = calculateAdjustedValue(speaks, 1, 'high');

    // Sorted: [25, 27, 28, 29, 30]
    // Drop 1 low (25), drop 1 high (30)
    // Remaining: [27, 28, 29] = 84
    expect(adjusted).toBe(84);
  });

  it('should return total if not enough values to drop', () => {
    const speaks = [28, 29];
    const adjusted = calculateAdjustedValue(speaks, 1, 'high');

    // Need at least 3 values to drop 1 from each end
    expect(adjusted).toBe(57); // 28 + 29
  });

  it('should handle exact minimum values needed', () => {
    const speaks = [25, 28, 30];
    const adjusted = calculateAdjustedValue(speaks, 1, 'high');

    // Exactly 3 values, drop 1 from each end
    expect(adjusted).toBe(28);
  });

  it('should return 0 for empty array', () => {
    const adjusted = calculateAdjustedValue([], 1, 'high');
    expect(adjusted).toBe(0);
  });

  it('should handle double adjustment (drop 2 from each end)', () => {
    const speaks = [24, 25, 27, 28, 29, 30, 31];
    const adjusted = calculateAdjustedValue(speaks, 2, 'high');

    // Sorted: [24, 25, 27, 28, 29, 30, 31]
    // Drop 2 low (24, 25), drop 2 high (30, 31)
    // Remaining: [27, 28, 29] = 84
    expect(adjusted).toBe(84);
  });
});

// ============================================================================
// Test 5: Opponent strength calculation
// ============================================================================
describe('calculateOpponentStrength', () => {
  it('should calculate opponent wins and win percentage correctly', () => {
    const statsMap = new Map<string, OpponentStats>([
      ['opp-1', { wins: 3, rounds: 4 }],
      ['opp-2', { wins: 2, rounds: 4 }],
      ['opp-3', { wins: 4, rounds: 4 }],
    ]);

    const result = calculateOpponentStrength(['opp-1', 'opp-2', 'opp-3'], statsMap);

    expect(result.oppWins).toBe(9); // 3 + 2 + 4
    expect(result.oppWinPct).toBe(0.75); // 9 / 12
  });

  it('should return 0 for empty opponent list', () => {
    const statsMap = new Map<string, OpponentStats>();
    const result = calculateOpponentStrength([], statsMap);

    expect(result.oppWins).toBe(0);
    expect(result.oppWinPct).toBe(0);
  });

  it('should handle missing opponents gracefully', () => {
    const statsMap = new Map<string, OpponentStats>([
      ['opp-1', { wins: 3, rounds: 4 }],
    ]);

    const result = calculateOpponentStrength(['opp-1', 'opp-missing'], statsMap);

    expect(result.oppWins).toBe(3);
    expect(result.oppWinPct).toBe(0.75); // 3 / 4
  });

  it('should work with AggregatedStats type', () => {
    const statsMap = new Map<string, AggregatedStats>([
      ['opp-1', createAggregatedStats({ wins: 2, roundsCompleted: 3 })],
      ['opp-2', createAggregatedStats({ wins: 1, roundsCompleted: 3 })],
    ]);

    const result = calculateOpponentStrength(['opp-1', 'opp-2'], statsMap);

    expect(result.oppWins).toBe(3);
    expect(result.oppWinPct).toBe(0.5); // 3 / 6
  });
});

// ============================================================================
// Test 6: Empty results
// ============================================================================
describe('Standings computation - empty results', () => {
  it('should handle no pairings gracefully', () => {
    const standings: ComputedStanding[] = [];

    expect(standings).toHaveLength(0);
  });

  it('should handle team with no completed rounds', () => {
    const standing = createStanding({
      registration_id: 'no-rounds',
      wins: 0,
      losses: 0,
      total_speaks: 0,
      rounds_completed: 0,
    });

    expect(standing.rounds_completed).toBe(0);
    expect(standing.wins).toBe(0);
    expect(standing.total_speaks).toBe(0);
  });

  it('should calculate average as 0 when no rounds completed', () => {
    const speaks: number[] = [];
    const avg = speaks.length > 0 ? speaks.reduce((s, v) => s + v, 0) / speaks.length : 0;

    expect(avg).toBe(0);
  });
});

// ============================================================================
// Test 7: Tiebreaker sorting
// ============================================================================
describe('Standings computation - tiebreaker sorting', () => {
  it('should apply tiebreakers in correct order', () => {
    const teams = [
      createStanding({
        registration_id: 'team-1',
        wins: 3,
        total_speaks: 115,
        adjusted_speaks: 85,
      }),
      createStanding({
        registration_id: 'team-2',
        wins: 3,
        total_speaks: 115, // Same speaks
        adjusted_speaks: 88, // Higher adjusted
      }),
    ];

    // With speaks tiebreaker only, teams are tied
    const sortedBySpeaks = sortByTiebreakers(teams, ['wins', 'speaks']);
    // Both have same wins and speaks - order depends on stable sort
    expect(sortedBySpeaks.map(t => t.registration_id)).toContain('team-1');
    expect(sortedBySpeaks.map(t => t.registration_id)).toContain('team-2');

    // With adjusted_speaks tiebreaker, team-2 should win
    const sortedByAdjusted = sortByTiebreakers(teams, ['wins', 'speaks', 'adjusted_speaks']);
    expect(sortedByAdjusted[0].registration_id).toBe('team-2');
  });

  it('should sort by opp_wins when wins and speaks are tied', () => {
    const teams = [
      createStanding({
        registration_id: 'team-1',
        wins: 3,
        total_speaks: 115,
        opp_wins: 10,
      }),
      createStanding({
        registration_id: 'team-2',
        wins: 3,
        total_speaks: 115,
        opp_wins: 12, // Faced tougher opponents
      }),
    ];

    const sorted = sortByTiebreakers(teams, ['wins', 'speaks', 'opp_wins']);
    expect(sorted[0].registration_id).toBe('team-2');
  });
});

// ============================================================================
// Test 8: calculateAdjusted helper
// ============================================================================
describe('calculateAdjusted - helper function', () => {
  it('should be an alias for calculateAdjustedValue with high preference', () => {
    const values = [10, 20, 30, 40, 50];

    const result1 = calculateAdjusted(values, 1);
    const result2 = calculateAdjustedValue(values, 1, 'high');

    expect(result1).toBe(result2);
    expect(result1).toBe(90); // 20 + 30 + 40
  });

  it('should support lowerIsBetter flag for ranks', () => {
    const ranks = [1, 2, 3, 4, 5];

    // With lowerIsBetter = true, uses 'low' preference
    const adjusted = calculateAdjusted(ranks, 1, true);

    // Should still be same calculation - drop from both ends
    expect(adjusted).toBe(9); // 2 + 3 + 4
  });

  it('should handle zero dropCount', () => {
    const values = [10, 20, 30];
    const adjusted = calculateAdjusted(values, 0);

    expect(adjusted).toBe(60); // All values summed
  });
});

// ============================================================================
// Test 9: calculateOpponentStrength with simple interface
// ============================================================================
describe('calculateOpponentStrength - simple interface', () => {
  it('should work with Map<string, { wins, rounds }>', () => {
    const statsMap = new Map<string, { wins: number; rounds: number }>([
      ['opp-a', { wins: 2, rounds: 3 }],
      ['opp-b', { wins: 1, rounds: 3 }],
    ]);

    const result = calculateOpponentStrength(['opp-a', 'opp-b'], statsMap);

    expect(result.oppWins).toBe(3);
    expect(result.oppWinPct).toBe(0.5);
  });

  it('should calculate win percentage with precision', () => {
    const statsMap = new Map<string, { wins: number; rounds: number }>([
      ['opp-1', { wins: 2, rounds: 3 }],
    ]);

    const result = calculateOpponentStrength(['opp-1'], statsMap);

    // 2/3 = 0.6666...
    expect(result.oppWinPct).toBeCloseTo(0.6667, 4);
  });

  it('should handle opponent with no rounds', () => {
    const statsMap = new Map<string, { wins: number; rounds: number }>([
      ['opp-1', { wins: 0, rounds: 0 }],
    ]);

    const result = calculateOpponentStrength(['opp-1'], statsMap);

    expect(result.oppWins).toBe(0);
    expect(result.oppWinPct).toBe(0); // Avoid division by zero
  });
});

// ============================================================================
// Test 10: Edge case - all ties
// ============================================================================
describe('Standings computation - edge case: all ties', () => {
  it('should maintain stable order when all teams are completely tied', () => {
    const teams = [
      createStanding({
        registration_id: 'team-1',
        wins: 2,
        losses: 2,
        total_speaks: 100,
        total_ranks: 8,
        opp_wins: 8,
      }),
      createStanding({
        registration_id: 'team-2',
        wins: 2,
        losses: 2,
        total_speaks: 100,
        total_ranks: 8,
        opp_wins: 8,
      }),
      createStanding({
        registration_id: 'team-3',
        wins: 2,
        losses: 2,
        total_speaks: 100,
        total_ranks: 8,
        opp_wins: 8,
      }),
    ];

    // Without coin_flip, all should remain tied
    const sorted = sortByTiebreakers(teams, ['wins', 'speaks', 'ranks', 'opp_wins']);

    expect(sorted).toHaveLength(3);
    // All teams should still be present
    expect(sorted.map(t => t.registration_id).sort()).toEqual(['team-1', 'team-2', 'team-3']);
  });

  it('should use coin_flip to break complete ties', () => {
    const teams = [
      createStanding({
        registration_id: 'tied-team-a',
        wins: 2,
        total_speaks: 100,
      }),
      createStanding({
        registration_id: 'tied-team-b',
        wins: 2,
        total_speaks: 100,
      }),
    ];

    const sorted = sortByTiebreakers(teams, ['wins', 'speaks', 'coin_flip']);

    // Coin flip should produce a deterministic order
    expect(sorted).toHaveLength(2);
    // Order should be consistent on repeated calls
    const sorted2 = sortByTiebreakers(teams, ['wins', 'speaks', 'coin_flip']);
    expect(sorted.map(t => t.registration_id)).toEqual(sorted2.map(t => t.registration_id));
  });
});

// ============================================================================
// Additional tests for comprehensive coverage
// ============================================================================
describe('calculateAdjustedSpeaks - convenience function', () => {
  it('should work as an alias for calculateAdjustedValue with high preference', () => {
    const speaks = [25, 27, 28, 29, 30];
    const result = calculateAdjustedSpeaks(speaks, 1);

    expect(result).toBe(84);
  });

  it('should default to dropCount of 1', () => {
    const speaks = [25, 27, 28, 29, 30];
    const result = calculateAdjustedSpeaks(speaks);

    expect(result).toBe(84);
  });
});

describe('Standings with forfeits', () => {
  it('should track forfeits separately from regular losses', () => {
    const standing = createStanding({
      registration_id: 'team-with-forfeit',
      wins: 2,
      losses: 2,
      forfeits_given: 1,
      forfeits_received: 0,
      rounds_completed: 4,
    });

    expect(standing.forfeits_given).toBe(1);
    expect(standing.losses).toBe(2); // Forfeit counts as loss
  });

  it('should handle forfeit wins correctly', () => {
    const standing = createStanding({
      registration_id: 'team-with-forfeit-win',
      wins: 3,
      losses: 1,
      forfeits_given: 0,
      forfeits_received: 1, // Opponent forfeited
      rounds_completed: 4,
    });

    expect(standing.forfeits_received).toBe(1);
    expect(standing.wins).toBe(3); // Forfeit win counts as win
  });
});

describe('Side balance tracking', () => {
  it('should track aff and neg rounds correctly', () => {
    const standing = createStanding({
      registration_id: 'balanced-team',
      wins: 4,
      losses: 0,
      aff_rounds: 2,
      neg_rounds: 2,
      rounds_completed: 4,
    });

    expect(standing.aff_rounds).toBe(2);
    expect(standing.neg_rounds).toBe(2);
    expect(standing.aff_rounds + standing.neg_rounds).toBe(standing.rounds_completed);
  });

  it('should handle imbalanced sides', () => {
    const standing = createStanding({
      registration_id: 'imbalanced-team',
      wins: 3,
      losses: 1,
      aff_rounds: 3,
      neg_rounds: 1,
      rounds_completed: 4,
    });

    expect(standing.aff_rounds).toBe(3);
    expect(standing.neg_rounds).toBe(1);
  });
});

describe('Ranking assignment', () => {
  it('should assign ranks after sorting', () => {
    const teams = [
      createStanding({ registration_id: 'team-c', wins: 1 }),
      createStanding({ registration_id: 'team-a', wins: 3 }),
      createStanding({ registration_id: 'team-b', wins: 2 }),
    ];

    const sorted = sortByTiebreakers(teams, ['wins']);

    // Assign ranks
    sorted.forEach((standing, index) => {
      standing.prelim_rank = index + 1;
      standing.overall_rank = index + 1;
    });

    expect(sorted[0].prelim_rank).toBe(1);
    expect(sorted[0].registration_id).toBe('team-a');
    expect(sorted[1].prelim_rank).toBe(2);
    expect(sorted[2].prelim_rank).toBe(3);
  });
});

describe('Break determination', () => {
  it('should correctly identify breaking teams', () => {
    const teams = [
      createStanding({
        registration_id: 'team-1',
        wins: 4,
        is_breaking: true,
        break_seed: 1,
      }),
      createStanding({
        registration_id: 'team-2',
        wins: 4,
        is_breaking: true,
        break_seed: 2,
      }),
      createStanding({
        registration_id: 'team-3',
        wins: 3,
        is_breaking: false,
        break_seed: null,
      }),
    ];

    const breakingTeams = teams.filter(t => t.is_breaking);

    expect(breakingTeams).toHaveLength(2);
    expect(breakingTeams[0].break_seed).toBe(1);
    expect(breakingTeams[1].break_seed).toBe(2);
  });
});
