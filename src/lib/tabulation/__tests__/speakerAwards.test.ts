/**
 * Tests for the Speaker Awards Calculator
 *
 * Comprehensive test suite covering speaker points aggregation,
 * adjusted points calculation, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  aggregateSpeakerPoints,
  calculateAdjustedPoints,
  exportSpeakerAwardsToCSV,
  type SpeakerStats,
} from '../speakerAwards';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Factory to create mock speaker result
 */
function createMockSpeakerResult(overrides: Partial<{
  id: string;
  pairing_id: string;
  registration_id: string;
  speaker_position: number;
  speaker_name: string | null;
  speaker_points: number | null;
  speaker_rank: number | null;
  side: 'aff' | 'neg' | null;
  is_reply_speaker: boolean;
}> = {}) {
  return {
    id: `sr-${Math.random().toString(36).slice(2, 9)}`,
    pairing_id: `pairing-${Math.random().toString(36).slice(2, 9)}`,
    registration_id: 'reg-1',
    speaker_position: 1,
    speaker_name: null,
    speaker_points: 28.0,
    speaker_rank: 1,
    side: 'aff' as const,
    is_reply_speaker: false,
    ...overrides,
  };
}

/**
 * Factory to create mock registration
 */
function createMockRegistration(overrides: Partial<{
  id: string;
  participant_name: string;
  partner_name: string | null;
  school_organization: string | null;
  event_id: string | null;
  division?: string;
}> = {}) {
  return {
    id: 'reg-1',
    participant_name: 'John Doe',
    partner_name: null,
    school_organization: 'Central High',
    event_id: 'event-1',
    ...overrides,
  };
}

/**
 * Factory to create SpeakerStats for testing
 */
function createSpeakerStats(overrides: Partial<SpeakerStats> = {}): SpeakerStats {
  return {
    speakerId: `speaker-${Math.random().toString(36).slice(2, 9)}`,
    speakerName: 'Test Speaker',
    teamId: 'team-1',
    teamName: 'Test Team',
    school: 'Test School',
    division: undefined,
    roundsSpoken: 4,
    totalPoints: 112.0,
    avgPoints: 28.0,
    highPoint: 30.0,
    lowPoint: 26.0,
    adjustedPoints: 56.0,
    rank: 1,
    isBreaking: false,
    ...overrides,
  };
}

// ============================================================================
// Test 1: Single speaker single round
// ============================================================================
describe('Speaker Awards - single speaker single round', () => {
  it('should correctly calculate stats for a speaker with one round', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_position: 1,
        speaker_points: 28.5,
        speaker_name: 'Alice',
      }),
    ];

    const registrations = [
      createMockRegistration({
        id: 'reg-1',
        participant_name: 'Team Alpha',
      }),
    ];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());

    expect(result.size).toBe(1);

    const speaker = Array.from(result.values())[0];
    expect(speaker.speakerName).toBe('Alice');
    expect(speaker.roundsSpoken).toBe(1);
    expect(speaker.totalPoints).toBe(28.5);
    expect(speaker.avgPoints).toBe(28.5);
    expect(speaker.highPoint).toBe(28.5);
    expect(speaker.lowPoint).toBe(28.5);
  });

  it('should use speaker position if no name is provided', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_position: 2,
        speaker_points: 27.0,
        speaker_name: null,
      }),
    ];

    const registrations = [
      createMockRegistration({ id: 'reg-1' }),
    ];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());
    const speaker = Array.from(result.values())[0];

    expect(speaker.speakerName).toBe('Speaker 2');
  });
});

// ============================================================================
// Test 2: Multiple speakers multiple rounds
// ============================================================================
describe('Speaker Awards - multiple speakers multiple rounds', () => {
  it('should aggregate points across multiple rounds for same speaker', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Bob',
        speaker_points: 27.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Bob',
        speaker_points: 28.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Bob',
        speaker_points: 29.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Bob',
        speaker_points: 30.0,
      }),
    ];

    const registrations = [
      createMockRegistration({ id: 'reg-1', participant_name: 'Team Beta' }),
    ];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());

    expect(result.size).toBe(1);

    const speaker = Array.from(result.values())[0];
    expect(speaker.roundsSpoken).toBe(4);
    expect(speaker.totalPoints).toBe(114.0);
    expect(speaker.avgPoints).toBe(28.5);
    expect(speaker.highPoint).toBe(30.0);
    expect(speaker.lowPoint).toBe(27.0);
  });

  it('should handle multiple speakers from different teams', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Alice',
        speaker_points: 28.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-2',
        speaker_name: 'Charlie',
        speaker_points: 27.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Alice',
        speaker_points: 29.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-2',
        speaker_name: 'Charlie',
        speaker_points: 26.0,
      }),
    ];

    const registrations = [
      createMockRegistration({ id: 'reg-1', participant_name: 'Team A' }),
      createMockRegistration({ id: 'reg-2', participant_name: 'Team B' }),
    ];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());

    expect(result.size).toBe(2);

    const speakers = Array.from(result.values());
    const alice = speakers.find((s) => s.speakerName === 'Alice');
    const charlie = speakers.find((s) => s.speakerName === 'Charlie');

    expect(alice?.totalPoints).toBe(57.0);
    expect(alice?.avgPoints).toBe(28.5);

    expect(charlie?.totalPoints).toBe(53.0);
    expect(charlie?.avgPoints).toBe(26.5);
  });
});

// ============================================================================
// Test 3: Adjusted points calculation
// ============================================================================
describe('calculateAdjustedPoints', () => {
  it('should drop one high and one low when dropCount is 1', () => {
    const points = [25, 27, 28, 29, 30];
    const adjusted = calculateAdjustedPoints(points, 1);

    // Drop 25 (low) and 30 (high)
    // Remaining: 27 + 28 + 29 = 84
    expect(adjusted).toBe(84);
  });

  it('should drop two from each end when dropCount is 2', () => {
    const points = [24, 25, 27, 28, 29, 30, 31];
    const adjusted = calculateAdjustedPoints(points, 2);

    // Drop 24, 25 (low) and 30, 31 (high)
    // Remaining: 27 + 28 + 29 = 84
    expect(adjusted).toBe(84);
  });

  it('should return total if not enough values to drop', () => {
    const points = [28, 29];
    const adjusted = calculateAdjustedPoints(points, 1);

    // Need at least 3 values to drop 1 from each end
    expect(adjusted).toBe(57); // 28 + 29
  });

  it('should return 0 for empty array', () => {
    const adjusted = calculateAdjustedPoints([], 1);
    expect(adjusted).toBe(0);
  });

  it('should handle exact minimum values needed', () => {
    const points = [25, 28, 30];
    const adjusted = calculateAdjustedPoints(points, 1);

    // Exactly 3 values, drop 1 from each end
    expect(adjusted).toBe(28);
  });

  it('should handle zero dropCount', () => {
    const points = [25, 28, 30];
    const adjusted = calculateAdjustedPoints(points, 0);

    expect(adjusted).toBe(83); // All values summed
  });

  it('should sort unsorted input correctly', () => {
    const points = [30, 25, 28, 27, 29];
    const adjusted = calculateAdjustedPoints(points, 1);

    // Should still drop 25 and 30
    // Remaining: 27 + 28 + 29 = 84
    expect(adjusted).toBe(84);
  });
});

// ============================================================================
// Test 4: Exclude breaking teams
// ============================================================================
describe('Speaker Awards - exclude breaking teams', () => {
  it('should mark speakers from breaking teams', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-breaking',
        speaker_name: 'Breaking Speaker',
        speaker_points: 29.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-not-breaking',
        speaker_name: 'Non-Breaking Speaker',
        speaker_points: 28.0,
      }),
    ];

    const registrations = [
      createMockRegistration({ id: 'reg-breaking', participant_name: 'Breaking Team' }),
      createMockRegistration({ id: 'reg-not-breaking', participant_name: 'Other Team' }),
    ];

    const breakingTeamIds = new Set(['reg-breaking']);
    const result = aggregateSpeakerPoints(speakerResults, registrations, breakingTeamIds);

    const speakers = Array.from(result.values());
    const breakingSpeaker = speakers.find((s) => s.speakerName === 'Breaking Speaker');
    const nonBreakingSpeaker = speakers.find((s) => s.speakerName === 'Non-Breaking Speaker');

    expect(breakingSpeaker?.isBreaking).toBe(true);
    expect(nonBreakingSpeaker?.isBreaking).toBe(false);
  });
});

// ============================================================================
// Test 5: Division filtering
// ============================================================================
describe('Speaker Awards - division handling', () => {
  it('should include division information in speaker stats', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-novice',
        speaker_name: 'Novice Speaker',
        speaker_points: 26.0,
      }),
    ];

    const registrations = [
      createMockRegistration({
        id: 'reg-novice',
        participant_name: 'Novice Team',
        division: 'Novice',
      }),
    ];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());
    const speaker = Array.from(result.values())[0];

    expect(speaker.division).toBe('Novice');
  });
});

// ============================================================================
// Test 6: Empty results
// ============================================================================
describe('Speaker Awards - empty results', () => {
  it('should return empty map for no speaker results', () => {
    const result = aggregateSpeakerPoints([], [], new Set());
    expect(result.size).toBe(0);
  });

  it('should skip speaker results with null points', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'No Points',
        speaker_points: null,
      }),
    ];

    const registrations = [
      createMockRegistration({ id: 'reg-1' }),
    ];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());
    expect(result.size).toBe(0);
  });

  it('should handle missing registration gracefully', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-missing',
        speaker_name: 'Unknown Speaker',
        speaker_points: 28.0,
      }),
    ];

    const registrations: ReturnType<typeof createMockRegistration>[] = [];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());

    expect(result.size).toBe(1);
    const speaker = Array.from(result.values())[0];
    expect(speaker.teamName).toBe('Unknown');
    expect(speaker.school).toBe('Independent');
  });
});

// ============================================================================
// Test 7: Tie handling
// ============================================================================
describe('Speaker Awards - tie handling', () => {
  it('should correctly aggregate tied speaker scores', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Speaker A',
        speaker_points: 28.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-2',
        speaker_name: 'Speaker B',
        speaker_points: 28.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Speaker A',
        speaker_points: 28.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-2',
        speaker_name: 'Speaker B',
        speaker_points: 28.0,
      }),
    ];

    const registrations = [
      createMockRegistration({ id: 'reg-1', participant_name: 'Team A' }),
      createMockRegistration({ id: 'reg-2', participant_name: 'Team B' }),
    ];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());

    const speakers = Array.from(result.values());
    const speakerA = speakers.find((s) => s.speakerName === 'Speaker A');
    const speakerB = speakers.find((s) => s.speakerName === 'Speaker B');

    expect(speakerA?.totalPoints).toBe(56.0);
    expect(speakerB?.totalPoints).toBe(56.0);
    expect(speakerA?.avgPoints).toBe(28.0);
    expect(speakerB?.avgPoints).toBe(28.0);
  });
});

// ============================================================================
// Test 8: Large tournament (50+ speakers)
// ============================================================================
describe('Speaker Awards - large tournament', () => {
  it('should handle 50+ speakers efficiently', () => {
    const speakerResults: ReturnType<typeof createMockSpeakerResult>[] = [];
    const registrations: ReturnType<typeof createMockRegistration>[] = [];

    // Create 50 different speakers from 25 teams (2 speakers per team)
    for (let team = 1; team <= 25; team++) {
      registrations.push(
        createMockRegistration({
          id: `reg-${team}`,
          participant_name: `Team ${team}`,
          school_organization: `School ${team}`,
        })
      );

      for (let speaker = 1; speaker <= 2; speaker++) {
        // Each speaker speaks 4 rounds
        for (let round = 1; round <= 4; round++) {
          const basePoints = 25 + Math.random() * 5;
          speakerResults.push(
            createMockSpeakerResult({
              registration_id: `reg-${team}`,
              speaker_position: speaker,
              speaker_name: `Speaker ${team}-${speaker}`,
              speaker_points: Math.round(basePoints * 10) / 10,
            })
          );
        }
      }
    }

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());

    // Should have 50 unique speakers (25 teams * 2 speakers)
    expect(result.size).toBe(50);

    // All speakers should have 4 rounds
    for (const speaker of result.values()) {
      expect(speaker.roundsSpoken).toBe(4);
    }
  });

  it('should correctly sort large number of speakers by points', () => {
    const speakers: SpeakerStats[] = [];

    for (let i = 0; i < 50; i++) {
      speakers.push(
        createSpeakerStats({
          speakerId: `speaker-${i}`,
          speakerName: `Speaker ${i}`,
          totalPoints: 100 + i,
          avgPoints: 25 + i * 0.1,
        })
      );
    }

    // Sort by total points descending
    const sorted = [...speakers].sort((a, b) => b.totalPoints - a.totalPoints);

    expect(sorted[0].totalPoints).toBe(149);
    expect(sorted[49].totalPoints).toBe(100);
  });
});

// ============================================================================
// Test 9: Partner teams (TP format)
// ============================================================================
describe('Speaker Awards - partner teams', () => {
  it('should display partner team names correctly', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-tp',
        speaker_position: 1,
        speaker_name: 'First Partner',
        speaker_points: 28.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-tp',
        speaker_position: 2,
        speaker_name: 'Second Partner',
        speaker_points: 27.5,
      }),
    ];

    const registrations = [
      createMockRegistration({
        id: 'reg-tp',
        participant_name: 'John Smith',
        partner_name: 'Jane Doe',
      }),
    ];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());

    expect(result.size).toBe(2);

    const speakers = Array.from(result.values());
    const firstPartner = speakers.find((s) => s.speakerName === 'First Partner');

    expect(firstPartner?.teamName).toBe('John Smith & Jane Doe');
  });
});

// ============================================================================
// Test 10: CSV Export
// ============================================================================
describe('exportSpeakerAwardsToCSV', () => {
  it('should generate valid CSV output', () => {
    const speakers: SpeakerStats[] = [
      createSpeakerStats({
        rank: 1,
        speakerName: 'Alice',
        teamName: 'Team Alpha',
        school: 'Central High',
        roundsSpoken: 4,
        totalPoints: 116.0,
        avgPoints: 29.0,
        highPoint: 30.0,
        lowPoint: 28.0,
        adjustedPoints: 58.0,
      }),
      createSpeakerStats({
        rank: 2,
        speakerName: 'Bob',
        teamName: 'Team Beta',
        school: 'West Academy',
        roundsSpoken: 4,
        totalPoints: 114.0,
        avgPoints: 28.5,
        highPoint: 29.5,
        lowPoint: 27.5,
        adjustedPoints: 57.0,
      }),
    ];

    const csv = exportSpeakerAwardsToCSV(speakers);
    const lines = csv.split('\n');

    // Check header
    expect(lines[0]).toBe(
      'Rank,Speaker,Team,School,Rounds,Total Points,Avg Points,High,Low,Adjusted'
    );

    // Check first data row
    expect(lines[1]).toContain('1');
    expect(lines[1]).toContain('"Alice"');
    expect(lines[1]).toContain('"Team Alpha"');
    expect(lines[1]).toContain('116.0');
    expect(lines[1]).toContain('29.00');

    // Check second data row
    expect(lines[2]).toContain('2');
    expect(lines[2]).toContain('"Bob"');
  });

  it('should escape special characters in CSV', () => {
    const speakers: SpeakerStats[] = [
      createSpeakerStats({
        rank: 1,
        speakerName: 'Name, With "Quotes"',
        teamName: 'Team "Special"',
        school: 'School, Inc.',
      }),
    ];

    const csv = exportSpeakerAwardsToCSV(speakers);

    // Check that quotes are escaped
    expect(csv).toContain('"Name, With ""Quotes"""');
    expect(csv).toContain('"Team ""Special"""');
    expect(csv).toContain('"School, Inc."');
  });

  it('should handle empty speaker list', () => {
    const csv = exportSpeakerAwardsToCSV([]);
    const lines = csv.split('\n');

    // Should only have header
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Rank');
  });
});

// ============================================================================
// Test 11: Edge cases
// ============================================================================
describe('Speaker Awards - edge cases', () => {
  it('should handle speaker with very high points', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Top Speaker',
        speaker_points: 30.0,
      }),
    ];

    const registrations = [createMockRegistration({ id: 'reg-1' })];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());
    const speaker = Array.from(result.values())[0];

    expect(speaker.highPoint).toBe(30.0);
    expect(speaker.lowPoint).toBe(30.0);
  });

  it('should handle speaker with decimal points', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Decimal Speaker',
        speaker_points: 27.5,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Decimal Speaker',
        speaker_points: 28.25,
      }),
    ];

    const registrations = [createMockRegistration({ id: 'reg-1' })];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());
    const speaker = Array.from(result.values())[0];

    expect(speaker.totalPoints).toBe(55.75);
    expect(speaker.avgPoints).toBe(27.875);
  });

  it('should handle zero speaker points', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Zero Points',
        speaker_points: 0,
      }),
    ];

    const registrations = [createMockRegistration({ id: 'reg-1' })];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());

    // Zero is a valid point value, should be included
    expect(result.size).toBe(1);
    const speaker = Array.from(result.values())[0];
    expect(speaker.totalPoints).toBe(0);
    expect(speaker.lowPoint).toBe(0);
  });
});

// ============================================================================
// Test 12: aggregateSpeakerPoints with adjusted calculation
// ============================================================================
describe('aggregateSpeakerPoints - adjusted points', () => {
  it('should calculate adjusted points automatically for 3+ rounds', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Multi Round',
        speaker_points: 25.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Multi Round',
        speaker_points: 27.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Multi Round',
        speaker_points: 28.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Multi Round',
        speaker_points: 30.0,
      }),
    ];

    const registrations = [createMockRegistration({ id: 'reg-1' })];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());
    const speaker = Array.from(result.values())[0];

    // Total: 25 + 27 + 28 + 30 = 110
    expect(speaker.totalPoints).toBe(110.0);

    // Adjusted (drop 1 high, 1 low): 27 + 28 = 55
    expect(speaker.adjustedPoints).toBe(55.0);
  });

  it('should use total for adjusted when less than 3 rounds', () => {
    const speakerResults = [
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Two Rounds',
        speaker_points: 28.0,
      }),
      createMockSpeakerResult({
        registration_id: 'reg-1',
        speaker_name: 'Two Rounds',
        speaker_points: 29.0,
      }),
    ];

    const registrations = [createMockRegistration({ id: 'reg-1' })];

    const result = aggregateSpeakerPoints(speakerResults, registrations, new Set());
    const speaker = Array.from(result.values())[0];

    // With only 2 rounds, adjusted = total
    expect(speaker.adjustedPoints).toBe(speaker.totalPoints);
    expect(speaker.adjustedPoints).toBe(57.0);
  });
});
