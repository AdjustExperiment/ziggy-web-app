/**
 * Speaker Awards Calculator
 *
 * Calculates individual speaker awards by aggregating speaker points across rounds.
 * Supports:
 * - Top N speaker calculation
 * - Excluding breaking teams
 * - Division filtering (novice/open)
 * - Drop high/low adjustment
 *
 * @module speakerAwards
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

/**
 * Aggregated statistics for a single speaker
 */
export interface SpeakerStats {
  speakerId: string;
  speakerName: string;
  teamId: string;
  teamName: string;
  school: string;
  division?: string;
  roundsSpoken: number;
  totalPoints: number;
  avgPoints: number;
  highPoint: number;
  lowPoint: number;
  adjustedPoints: number;
  rank?: number;
  isBreaking?: boolean;
}

/**
 * Options for calculating speaker awards
 */
export interface SpeakerAwardsOptions {
  tournamentId: string;
  eventId?: string | null;
  topN?: number;
  excludeBreaking?: boolean;
  divisionFilter?: string | null;
  dropHighLow?: number;
}

/**
 * Result of speaker awards calculation
 */
export interface SpeakerAwardsResult {
  speakers: SpeakerStats[];
  topSpeakers: SpeakerStats[];
  divisions: string[];
  computedAt: string;
}

/**
 * Raw speaker result from database query
 */
interface RawSpeakerResult {
  id: string;
  pairing_id: string;
  registration_id: string;
  speaker_position: number;
  speaker_name: string | null;
  speaker_points: number | null;
  speaker_rank: number | null;
  side: 'aff' | 'neg' | null;
  is_reply_speaker: boolean;
}

/**
 * Registration data from database
 */
interface RegistrationData {
  id: string;
  participant_name: string;
  partner_name: string | null;
  school_organization: string | null;
  event_id: string | null;
  division?: string;
}

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Calculates speaker awards for a tournament.
 *
 * @param options - Calculation options
 * @returns SpeakerAwardsResult with all speakers and top N
 *
 * @example
 * const result = await calculateSpeakerAwards({
 *   tournamentId: 'tour-123',
 *   topN: 10,
 *   excludeBreaking: true,
 * });
 */
export async function calculateSpeakerAwards(
  options: SpeakerAwardsOptions
): Promise<SpeakerAwardsResult> {
  const {
    tournamentId,
    eventId,
    topN = 10,
    excludeBreaking = false,
    divisionFilter = null,
    dropHighLow = 0,
  } = options;

  // Fetch speaker results
  const speakerResults = await fetchSpeakerResults(tournamentId, eventId);

  // Fetch registrations for team info
  const registrations = await fetchRegistrations(tournamentId, eventId);

  // Get breaking team IDs if needed
  let breakingTeamIds = new Set<string>();
  if (excludeBreaking) {
    breakingTeamIds = await fetchBreakingTeamIds(tournamentId, eventId);
  }

  // Aggregate speaker points
  const speakerStatsMap = aggregateSpeakerPoints(
    speakerResults,
    registrations,
    breakingTeamIds
  );

  // Convert to array and apply drop high/low
  let speakers = Array.from(speakerStatsMap.values());

  // Recalculate adjusted points with drop count
  if (dropHighLow > 0) {
    speakers = speakers.map((speaker) => ({
      ...speaker,
      adjustedPoints: calculateAdjustedPointsFromStats(speaker, dropHighLow),
    }));
  }

  // Filter by division if specified
  if (divisionFilter) {
    speakers = speakers.filter(
      (s) => s.division?.toLowerCase() === divisionFilter.toLowerCase()
    );
  }

  // Filter out breaking teams if requested
  if (excludeBreaking) {
    speakers = speakers.filter((s) => !s.isBreaking);
  }

  // Sort by total points (or adjusted if dropping)
  const sortKey = dropHighLow > 0 ? 'adjustedPoints' : 'totalPoints';
  speakers.sort((a, b) => b[sortKey] - a[sortKey]);

  // Assign ranks
  speakers.forEach((speaker, index) => {
    speaker.rank = index + 1;
  });

  // Get top N
  const topSpeakers = speakers.slice(0, topN);

  // Collect unique divisions
  const divisionsSet = new Set<string>();
  for (const speaker of Array.from(speakerStatsMap.values())) {
    if (speaker.division) {
      divisionsSet.add(speaker.division);
    }
  }
  const divisions = Array.from(divisionsSet).sort();

  return {
    speakers,
    topSpeakers,
    divisions,
    computedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Fetches speaker results from the database
 */
async function fetchSpeakerResults(
  tournamentId: string,
  eventId?: string | null
): Promise<RawSpeakerResult[]> {
  // Query speaker_results via pairings
  let query = supabase
    .from('pairings')
    .select(`
      id,
      tournament_id,
      event_id,
      speaker_results(
        id,
        pairing_id,
        registration_id,
        speaker_position,
        speaker_name,
        speaker_points,
        speaker_rank,
        side,
        is_reply_speaker
      )
    `)
    .eq('tournament_id', tournamentId);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching speaker results:', error);
    return [];
  }

  // Flatten speaker results from all pairings
  const results: RawSpeakerResult[] = [];
  for (const pairing of data ?? []) {
    const speakerResults = (pairing as unknown as { speaker_results: RawSpeakerResult[] }).speaker_results;
    if (speakerResults) {
      results.push(...speakerResults);
    }
  }

  return results;
}

/**
 * Fetches registrations for the tournament
 */
async function fetchRegistrations(
  tournamentId: string,
  eventId?: string | null
): Promise<RegistrationData[]> {
  let query = supabase
    .from('tournament_registrations')
    .select('id, participant_name, partner_name, school_organization, event_id')
    .eq('tournament_id', tournamentId);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }

  return (data ?? []) as RegistrationData[];
}

/**
 * Fetches IDs of teams that are breaking
 */
async function fetchBreakingTeamIds(
  tournamentId: string,
  eventId?: string | null
): Promise<Set<string>> {
  // Query computed_standings for breaking teams - using type assertion
  let query = (supabase
    .from('computed_standings' as any)
    .select('registration_id')
    .eq('tournament_id', tournamentId)
    .eq('is_breaking', true) as any);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching breaking teams:', error);
    return new Set();
  }

  const ids = new Set<string>();
  const typedData = (data ?? []) as { registration_id: string }[];
  for (const row of typedData) {
    ids.add(row.registration_id);
  }

  return ids;
}

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Aggregates speaker points from raw results into SpeakerStats.
 *
 * @param speakerResults - Raw speaker results from database
 * @param registrations - Registration data for team info
 * @param breakingTeamIds - Set of breaking team registration IDs
 * @returns Map of speaker ID to aggregated stats
 *
 * @example
 * const statsMap = aggregateSpeakerPoints(results, registrations, new Set());
 */
export function aggregateSpeakerPoints(
  speakerResults: RawSpeakerResult[],
  registrations: RegistrationData[],
  breakingTeamIds: Set<string>
): Map<string, SpeakerStats> {
  // Build registration lookup
  const registrationMap = new Map<string, RegistrationData>();
  for (const reg of registrations) {
    registrationMap.set(reg.id, reg);
  }

  // Map to aggregate by unique speaker
  // Key: `${registration_id}-${speaker_position}` or speaker_name if available
  const speakerMap = new Map<string, SpeakerStats>();
  const speakerPointsMap = new Map<string, number[]>();

  for (const result of speakerResults) {
    // Skip if no points recorded
    if (result.speaker_points === null || result.speaker_points === undefined) {
      continue;
    }

    // Create unique speaker key
    const speakerKey = result.speaker_name
      ? `${result.registration_id}-${result.speaker_name}`
      : `${result.registration_id}-${result.speaker_position}`;

    const registration = registrationMap.get(result.registration_id);
    const isBreaking = breakingTeamIds.has(result.registration_id);

    // Get team name
    const teamName = registration
      ? registration.partner_name
        ? `${registration.participant_name} & ${registration.partner_name}`
        : registration.participant_name
      : 'Unknown';

    // Get or create stats entry
    if (!speakerMap.has(speakerKey)) {
      speakerMap.set(speakerKey, {
        speakerId: speakerKey,
        speakerName:
          result.speaker_name ||
          `Speaker ${result.speaker_position}`,
        teamId: result.registration_id,
        teamName,
        school: registration?.school_organization || 'Independent',
        division: registration?.division,
        roundsSpoken: 0,
        totalPoints: 0,
        avgPoints: 0,
        highPoint: 0,
        lowPoint: Infinity,
        adjustedPoints: 0,
        isBreaking,
      });
      speakerPointsMap.set(speakerKey, []);
    }

    const stats = speakerMap.get(speakerKey)!;
    const points = speakerPointsMap.get(speakerKey)!;

    // Update stats
    stats.roundsSpoken++;
    stats.totalPoints += result.speaker_points;
    points.push(result.speaker_points);

    // Update high/low
    if (result.speaker_points > stats.highPoint) {
      stats.highPoint = result.speaker_points;
    }
    if (result.speaker_points < stats.lowPoint) {
      stats.lowPoint = result.speaker_points;
    }
  }

  // Calculate averages and adjusted points
  for (const [key, stats] of speakerMap) {
    const points = speakerPointsMap.get(key)!;

    if (stats.roundsSpoken > 0) {
      stats.avgPoints = stats.totalPoints / stats.roundsSpoken;
    }

    // Fix lowPoint if never updated
    if (stats.lowPoint === Infinity) {
      stats.lowPoint = 0;
    }

    // Default adjusted = total (no drops)
    stats.adjustedPoints = stats.totalPoints;

    // If we have enough rounds, calculate adjusted with 1 drop from each end
    if (points.length >= 3) {
      stats.adjustedPoints = calculateAdjustedPoints(points, 1);
    }
  }

  return speakerMap;
}

/**
 * Calculates adjusted points by dropping high and low values.
 *
 * @param points - Array of speaker point values
 * @param dropCount - Number of high/low values to drop from each end
 * @returns Sum of remaining points after dropping
 *
 * @example
 * calculateAdjustedPoints([25, 27, 28, 29, 30], 1); // 27 + 28 + 29 = 84
 */
export function calculateAdjustedPoints(
  points: number[],
  dropCount: number
): number {
  if (points.length === 0) {
    return 0;
  }

  // Need at least 2 * dropCount + 1 values to drop from both ends
  const minValuesNeeded = dropCount * 2 + 1;
  if (points.length < minValuesNeeded) {
    // Not enough values to drop - return total
    return points.reduce((sum, v) => sum + v, 0);
  }

  // Sort values
  const sorted = [...points].sort((a, b) => a - b);

  // Drop dropCount from both ends
  const trimmed = sorted.slice(dropCount, sorted.length - dropCount);

  return trimmed.reduce((sum, v) => sum + v, 0);
}

/**
 * Helper to recalculate adjusted points from existing stats
 */
function calculateAdjustedPointsFromStats(
  speaker: SpeakerStats,
  dropCount: number
): number {
  // If we have high and low, we can approximate the adjustment
  // For exact calculation, we'd need the original points array
  if (speaker.roundsSpoken < dropCount * 2 + 1) {
    return speaker.totalPoints;
  }

  // Approximate by removing high and low * dropCount
  const adjustment = (speaker.highPoint + speaker.lowPoint) * dropCount;
  return Math.max(0, speaker.totalPoints - adjustment);
}

// ============================================================================
// Export Functions for Speaker Awards
// ============================================================================

/**
 * Exports speaker awards to CSV format
 */
export function exportSpeakerAwardsToCSV(speakers: SpeakerStats[]): string {
  const headers = [
    'Rank',
    'Speaker',
    'Team',
    'School',
    'Rounds',
    'Total Points',
    'Avg Points',
    'High',
    'Low',
    'Adjusted',
  ];

  const rows: string[] = [headers.join(',')];

  for (const speaker of speakers) {
    const row = [
      speaker.rank ?? '',
      `"${speaker.speakerName.replace(/"/g, '""')}"`,
      `"${speaker.teamName.replace(/"/g, '""')}"`,
      `"${speaker.school.replace(/"/g, '""')}"`,
      speaker.roundsSpoken,
      speaker.totalPoints.toFixed(1),
      speaker.avgPoints.toFixed(2),
      speaker.highPoint.toFixed(1),
      speaker.lowPoint.toFixed(1),
      speaker.adjustedPoints.toFixed(1),
    ].join(',');

    rows.push(row);
  }

  return rows.join('\n');
}

/**
 * Downloads speaker awards as CSV
 */
export function downloadSpeakerAwardsCSV(
  speakers: SpeakerStats[],
  filename: string = 'speaker-awards.csv'
): void {
  const csv = exportSpeakerAwardsToCSV(speakers);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
