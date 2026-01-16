/**
 * Standings Computation Service
 *
 * Computes tournament standings by aggregating round results from pairings,
 * calculating all standing metrics, and using the tiebreaker engine to sort
 * standings. Supports upsert to computed_standings table for caching.
 *
 * @module standingsService
 */

import { supabase } from '@/integrations/supabase/client';
import { sortByTiebreakers } from './tiebreakerEngine';
import type {
  ComputedStanding,
  ComputedStandingInsert,
  TiebreakerType,
  HeadToHead,
  HeadToHeadInsert,
  Side,
} from '@/types/tabulation';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for computing standings
 */
export interface ComputeOptions {
  tournamentId: string;
  eventId?: string | null;
  includeElims?: boolean;
  forceRecompute?: boolean;
}

/**
 * Result of standings computation
 */
export interface StandingsResult {
  standings: ComputedStanding[];
  computedAt: string;
  roundsIncluded: number;
  teamsRanked: number;
}

/**
 * Aggregated stats for a single team during computation
 */
export interface AggregatedStats {
  registrationId: string;
  wins: number;
  losses: number;
  byes: number;
  forfeitsGiven: number;
  forfeitsReceived: number;
  speaksList: number[];
  ranksList: number[];
  affRounds: number;
  negRounds: number;
  opponentIds: string[];
  roundsCompleted: number;
}

/**
 * Pairing result structure from DB
 */
interface PairingResult {
  winner?: 'aff' | 'neg' | 'bye' | null;
  aff_speaks?: number;
  neg_speaks?: number;
  aff_ranks?: number;
  neg_ranks?: number;
  forfeit?: boolean;
}

/**
 * Registration info for display
 */
interface RegistrationRow {
  id: string;
  participant_name: string;
  partner_name: string | null;
  school_organization: string | null;
  event_id: string | null;
}

/**
 * Pairing row from database
 */
interface PairingRow {
  id: string;
  tournament_id: string;
  round_id: string;
  event_id: string | null;
  aff_registration_id: string;
  neg_registration_id: string;
  result: PairingResult | null;
  flags: string[];
  aff_registration?: RegistrationRow;
  neg_registration?: RegistrationRow;
}

/**
 * Round row for determining elim status
 */
interface RoundRow {
  id: string;
  is_elimination?: boolean;
  round_type?: string;
}

// ============================================================================
// Main Computation Function
// ============================================================================

/**
 * Computes standings for a tournament, optionally filtered by event.
 *
 * @param options - Computation options
 * @returns StandingsResult with sorted standings and metadata
 *
 * @example
 * const result = await computeStandings({
 *   tournamentId: 'tour-123',
 *   eventId: 'event-456',
 * });
 * console.log(`Ranked ${result.teamsRanked} teams`);
 */
export async function computeStandings(options: ComputeOptions): Promise<StandingsResult> {
  const { tournamentId, eventId, includeElims = false } = options;

  // Fetch tournament tab config for tiebreaker order and drop settings
  const config = await fetchTabConfig(tournamentId, eventId);
  const tiebreakerOrder = config?.tiebreaker_order ?? [
    'wins',
    'speaks',
    'adjusted_speaks',
    'opp_wins',
    'head_to_head',
    'coin_flip',
  ];
  const dropCount = config?.drop_high_low_speaks ?? 1;

  // Aggregate round results
  const { statsMap, roundsIncluded } = await aggregateRoundResults(
    tournamentId,
    eventId,
    includeElims
  );

  // Calculate opponent strength after we have all stats
  const statsArray = Array.from(statsMap.values());
  for (const stats of statsArray) {
    const oppStrength = calculateOpponentStrength(stats.opponentIds, statsMap);
    (stats as AggregatedStats & { oppWins: number; oppWinPct: number }).oppWins = oppStrength.oppWins;
    (stats as AggregatedStats & { oppWins: number; oppWinPct: number }).oppWinPct = oppStrength.oppWinPct;
  }

  // Build head-to-head records
  const headToHeadRecords = await buildHeadToHeadRecords(tournamentId, eventId);

  // Convert aggregated stats to ComputedStanding format
  const standings: ComputedStanding[] = statsArray.map((stats) => {
    const extStats = stats as AggregatedStats & { oppWins: number; oppWinPct: number };
    const totalSpeaks = stats.speaksList.reduce((sum, s) => sum + s, 0);
    const totalRanks = stats.ranksList.reduce((sum, r) => sum + r, 0);
    const roundCount = stats.roundsCompleted || 1;

    return {
      id: `computed-${stats.registrationId}`,
      tournament_id: tournamentId,
      event_id: eventId ?? null,
      registration_id: stats.registrationId,
      wins: stats.wins,
      losses: stats.losses,
      byes: stats.byes,
      forfeits_given: stats.forfeitsGiven,
      forfeits_received: stats.forfeitsReceived,
      total_speaks: totalSpeaks,
      avg_speaks: roundCount > 0 ? totalSpeaks / roundCount : 0,
      adjusted_speaks: calculateAdjustedValue(stats.speaksList, dropCount, 'high'),
      double_adjusted_speaks: calculateAdjustedValue(stats.speaksList, 2, 'high'),
      total_ranks: totalRanks,
      avg_ranks: roundCount > 0 ? totalRanks / roundCount : 0,
      adjusted_ranks: calculateAdjustedValue(stats.ranksList, dropCount, 'low'),
      double_adjusted_ranks: calculateAdjustedValue(stats.ranksList, 2, 'low'),
      opp_wins: extStats.oppWins,
      opp_win_pct: extStats.oppWinPct,
      aff_rounds: stats.affRounds,
      neg_rounds: stats.negRounds,
      prelim_rank: null,
      overall_rank: null,
      is_breaking: false,
      break_seed: null,
      rounds_completed: stats.roundsCompleted,
      last_computed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  // Sort using tiebreaker engine
  const sortedStandings = sortByTiebreakers(standings, tiebreakerOrder, headToHeadRecords);

  // Assign ranks
  sortedStandings.forEach((standing, index) => {
    standing.prelim_rank = index + 1;
    standing.overall_rank = index + 1;
  });

  return {
    standings: sortedStandings,
    computedAt: new Date().toISOString(),
    roundsIncluded,
    teamsRanked: sortedStandings.length,
  };
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Fetches tournament tab configuration for tiebreaker order and drop settings
 */
async function fetchTabConfig(
  tournamentId: string,
  eventId?: string | null
): Promise<{ tiebreaker_order: TiebreakerType[]; drop_high_low_speaks: number } | null> {
  try {
    let query = supabase
      .from('tournament_tab_config' as 'tournaments')
      .select('tiebreaker_order, drop_high_low_speaks')
      .eq('tournament_id', tournamentId);

    if (eventId) {
      query = query.eq('event_id', eventId);
    } else {
      query = query.is('event_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return null;
    }

    // Type assertion since we're using 'as' in the query
    const configData = data as unknown as {
      tiebreaker_order: TiebreakerType[];
      drop_high_low_speaks: number;
    };

    return configData;
  } catch {
    return null;
  }
}

/**
 * Fetches all registrations for the tournament/event
 */
async function fetchRegistrations(
  tournamentId: string,
  eventId?: string | null
): Promise<RegistrationRow[]> {
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

  return (data ?? []) as RegistrationRow[];
}

/**
 * Aggregates round results from pairings into stats for each team.
 *
 * @param tournamentId - Tournament ID
 * @param eventId - Optional event ID filter
 * @param includeElims - Whether to include elimination rounds
 * @returns Map of registration ID to aggregated stats and round count
 */
export async function aggregateRoundResults(
  tournamentId: string,
  eventId?: string | null,
  includeElims: boolean = false
): Promise<{ statsMap: Map<string, AggregatedStats>; roundsIncluded: number }> {
  // Initialize map with all registrations
  const registrations = await fetchRegistrations(tournamentId, eventId);
  const statsMap = new Map<string, AggregatedStats>();

  for (const reg of registrations) {
    statsMap.set(reg.id, createEmptyStats(reg.id));
  }

  // Fetch pairings with results
  let query = supabase
    .from('pairings')
    .select(`
      id,
      tournament_id,
      round_id,
      event_id,
      aff_registration_id,
      neg_registration_id,
      result,
      flags,
      aff_registration:tournament_registrations!aff_registration_id(
        id, participant_name, partner_name, school_organization, event_id
      ),
      neg_registration:tournament_registrations!neg_registration_id(
        id, participant_name, partner_name, school_organization, event_id
      )
    `)
    .eq('tournament_id', tournamentId);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data: pairings, error: pairingsError } = await query;

  if (pairingsError) {
    console.error('Error fetching pairings:', pairingsError);
    return { statsMap, roundsIncluded: 0 };
  }

  // Optionally filter out elimination rounds
  let filteredPairings = (pairings ?? []) as unknown as PairingRow[];
  if (!includeElims) {
    // Fetch rounds to check elim status
    const roundIds = [...new Set(filteredPairings.map((p) => p.round_id))];
    if (roundIds.length > 0) {
      const { data: rounds } = await supabase
        .from('rounds')
        .select('id, is_elimination, round_type')
        .in('id', roundIds);

      const elimRoundIds = new Set(
        ((rounds ?? []) as RoundRow[])
          .filter((r) => r.is_elimination || r.round_type === 'elimination')
          .map((r) => r.id)
      );

      filteredPairings = filteredPairings.filter((p) => !elimRoundIds.has(p.round_id));
    }
  }

  // Count unique rounds with results
  const roundsWithResults = new Set<string>();

  // Process each pairing
  for (const pairing of filteredPairings) {
    const result = pairing.result as PairingResult | null;
    if (!result || !result.winner) continue;

    roundsWithResults.add(pairing.round_id);

    const affId = pairing.aff_registration_id;
    const negId = pairing.neg_registration_id;

    // Ensure both teams exist in map
    if (!statsMap.has(affId)) {
      statsMap.set(affId, createEmptyStats(affId));
    }
    if (!statsMap.has(negId)) {
      statsMap.set(negId, createEmptyStats(negId));
    }

    const affStats = statsMap.get(affId)!;
    const negStats = statsMap.get(negId)!;

    // Handle special cases
    const isBye = result.winner === 'bye' || pairing.flags?.includes('bye');
    const isForfeit = result.forfeit === true || pairing.flags?.includes('forfeit');

    if (isBye) {
      // Bye - winner gets a win, no speaks
      if (result.winner === 'aff' || pairing.aff_registration_id) {
        affStats.wins++;
        affStats.byes++;
        affStats.roundsCompleted++;
        affStats.affRounds++;
      }
    } else if (isForfeit) {
      // Forfeit handling
      if (result.winner === 'aff') {
        affStats.wins++;
        negStats.losses++;
        negStats.forfeitsGiven++;
        affStats.forfeitsReceived++;
      } else if (result.winner === 'neg') {
        negStats.wins++;
        affStats.losses++;
        affStats.forfeitsGiven++;
        negStats.forfeitsReceived++;
      }
      affStats.roundsCompleted++;
      negStats.roundsCompleted++;
      affStats.affRounds++;
      negStats.negRounds++;
      affStats.opponentIds.push(negId);
      negStats.opponentIds.push(affId);
    } else {
      // Normal round
      if (result.winner === 'aff') {
        affStats.wins++;
        negStats.losses++;
      } else if (result.winner === 'neg') {
        negStats.wins++;
        affStats.losses++;
      }

      // Record speaks if available
      const affSpeaks = parseFloat(String(result.aff_speaks ?? 0)) || 0;
      const negSpeaks = parseFloat(String(result.neg_speaks ?? 0)) || 0;

      if (affSpeaks > 0) affStats.speaksList.push(affSpeaks);
      if (negSpeaks > 0) negStats.speaksList.push(negSpeaks);

      // Record ranks if available
      const affRanks = parseFloat(String(result.aff_ranks ?? 0)) || 0;
      const negRanks = parseFloat(String(result.neg_ranks ?? 0)) || 0;

      if (affRanks > 0) affStats.ranksList.push(affRanks);
      if (negRanks > 0) negStats.ranksList.push(negRanks);

      // Track side balance
      affStats.affRounds++;
      negStats.negRounds++;

      // Track opponents
      affStats.opponentIds.push(negId);
      negStats.opponentIds.push(affId);

      // Increment rounds
      affStats.roundsCompleted++;
      negStats.roundsCompleted++;
    }
  }

  return { statsMap, roundsIncluded: roundsWithResults.size };
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Creates an empty stats object for a registration
 */
function createEmptyStats(registrationId: string): AggregatedStats {
  return {
    registrationId,
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
  };
}

/**
 * Calculates adjusted speaks or ranks by dropping high and/or low values.
 *
 * @param values - Array of speak/rank values
 * @param dropCount - Number of high AND low values to drop
 * @param preference - 'high' for speaks (drop both, keep middle), 'low' for ranks
 * @returns Adjusted sum after dropping
 *
 * @example
 * // Drop 1 high and 1 low from [25, 27, 28, 29, 30]
 * calculateAdjustedValue([25, 27, 28, 29, 30], 1, 'high'); // 27 + 28 + 29 = 84
 */
export function calculateAdjustedValue(
  values: number[],
  dropCount: number,
  preference: 'high' | 'low'
): number {
  if (values.length === 0) return 0;

  // Need at least 2 * dropCount + 1 values to drop from both ends
  const minValuesNeeded = dropCount * 2 + 1;
  if (values.length < minValuesNeeded) {
    // Not enough values to drop - return total
    return values.reduce((sum, v) => sum + v, 0);
  }

  // Sort values
  const sorted = [...values].sort((a, b) => a - b);

  // Drop dropCount from both ends
  const trimmed = sorted.slice(dropCount, sorted.length - dropCount);

  return trimmed.reduce((sum, v) => sum + v, 0);
}

/**
 * Calculates adjusted value by dropping high and low scores.
 * This is an alias with a simpler signature for external use.
 *
 * @param values - Array of numeric values
 * @param dropCount - Number of values to drop from each end
 * @param lowerIsBetter - If true, treats lower values as better (for ranks)
 * @returns Sum of remaining values after dropping
 *
 * @example
 * calculateAdjusted([10, 20, 30, 40, 50], 1) // Returns 90 (20+30+40)
 */
export function calculateAdjusted(
  values: number[],
  dropCount: number,
  lowerIsBetter = false
): number {
  return calculateAdjustedValue(values, dropCount, lowerIsBetter ? 'low' : 'high');
}

/**
 * Calculates adjusted speaks by dropping the highest and lowest values.
 * This is an alias for calculateAdjustedValue with 'high' preference.
 *
 * @param speaks - Array of speaker point values
 * @param dropCount - Number of high/low values to drop (default 1)
 * @returns Adjusted sum
 */
export function calculateAdjustedSpeaks(speaks: number[], dropCount: number = 1): number {
  return calculateAdjustedValue(speaks, dropCount, 'high');
}

/**
 * Simple opponent stats interface for opponent strength calculation
 */
export interface OpponentStats {
  wins: number;
  rounds: number;
}

/**
 * Calculates opponent strength metrics.
 *
 * @param opponentIds - Array of opponent registration IDs faced
 * @param statsMap - Map of registration ID to stats (either AggregatedStats or simple OpponentStats)
 * @returns Object with oppWins (total) and oppWinPct (average)
 *
 * @example
 * const oppStrength = calculateOpponentStrength(
 *   ['opp1', 'opp2'],
 *   new Map([['opp1', { wins: 2, rounds: 3 }], ['opp2', { wins: 1, rounds: 3 }]])
 * );
 * // { oppWins: 3, oppWinPct: 0.5 }
 */
export function calculateOpponentStrength(
  opponentIds: string[],
  statsMap: Map<string, AggregatedStats | OpponentStats>
): { oppWins: number; oppWinPct: number } {
  if (opponentIds.length === 0) {
    return { oppWins: 0, oppWinPct: 0 };
  }

  let totalOppWins = 0;
  let totalOppRounds = 0;

  for (const oppId of opponentIds) {
    const oppStats = statsMap.get(oppId);
    if (oppStats) {
      totalOppWins += oppStats.wins;
      // Support both AggregatedStats (roundsCompleted) and simple OpponentStats (rounds)
      const rounds = 'roundsCompleted' in oppStats ? oppStats.roundsCompleted : oppStats.rounds;
      totalOppRounds += rounds;
    }
  }

  const oppWinPct = totalOppRounds > 0 ? totalOppWins / totalOppRounds : 0;

  return { oppWins: totalOppWins, oppWinPct };
}

// ============================================================================
// Head-to-Head Functions
// ============================================================================

/**
 * Builds head-to-head records from pairings for H2H tiebreaker support.
 *
 * @param tournamentId - Tournament ID
 * @param eventId - Optional event ID filter
 * @returns Array of HeadToHead records
 */
export async function buildHeadToHeadRecords(
  tournamentId: string,
  eventId?: string | null
): Promise<HeadToHead[]> {
  // Build H2H map from pairings
  let query = supabase
    .from('pairings')
    .select('aff_registration_id, neg_registration_id, result')
    .eq('tournament_id', tournamentId);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data: pairings, error } = await query;

  if (error || !pairings) {
    return [];
  }

  // Map: `${teamA}-${teamB}` -> { wins: number, losses: number, speaksFor: number, speaksAgainst: number }
  const h2hMap = new Map<
    string,
    { wins: number; losses: number; speaksFor: number; speaksAgainst: number }
  >();

  for (const pairing of pairings) {
    const result = pairing.result as PairingResult | null;
    if (!result || !result.winner) continue;

    const affId = pairing.aff_registration_id;
    const negId = pairing.neg_registration_id;

    // Initialize entries
    const affKey = `${affId}-${negId}`;
    const negKey = `${negId}-${affId}`;

    if (!h2hMap.has(affKey)) {
      h2hMap.set(affKey, { wins: 0, losses: 0, speaksFor: 0, speaksAgainst: 0 });
    }
    if (!h2hMap.has(negKey)) {
      h2hMap.set(negKey, { wins: 0, losses: 0, speaksFor: 0, speaksAgainst: 0 });
    }

    const affH2H = h2hMap.get(affKey)!;
    const negH2H = h2hMap.get(negKey)!;

    if (result.winner === 'aff') {
      affH2H.wins++;
      negH2H.losses++;
    } else if (result.winner === 'neg') {
      negH2H.wins++;
      affH2H.losses++;
    }

    // Track speaks
    const affSpeaks = parseFloat(String(result.aff_speaks ?? 0)) || 0;
    const negSpeaks = parseFloat(String(result.neg_speaks ?? 0)) || 0;

    affH2H.speaksFor += affSpeaks;
    affH2H.speaksAgainst += negSpeaks;
    negH2H.speaksFor += negSpeaks;
    negH2H.speaksAgainst += affSpeaks;
  }

  // Convert to HeadToHead array
  const records: HeadToHead[] = [];
  for (const [key, stats] of h2hMap) {
    const [regId, oppId] = key.split('-');
    records.push({
      id: `h2h-${key}`,
      tournament_id: tournamentId,
      event_id: eventId ?? null,
      registration_id: regId,
      opponent_id: oppId,
      wins: stats.wins,
      losses: stats.losses,
      total_speaks_for: stats.speaksFor,
      total_speaks_against: stats.speaksAgainst,
    });
  }

  return records;
}

// ============================================================================
// Database Upsert Functions
// ============================================================================

/**
 * Upserts computed standings to the database for caching.
 *
 * @param tournamentId - Tournament ID
 * @param standings - Array of computed standings to upsert
 */
export async function upsertStandings(
  tournamentId: string,
  standings: ComputedStanding[]
): Promise<void> {
  if (standings.length === 0) return;

  // Convert to insert format
  const inserts: ComputedStandingInsert[] = standings.map((s) => ({
    tournament_id: s.tournament_id,
    event_id: s.event_id,
    registration_id: s.registration_id,
    wins: s.wins,
    losses: s.losses,
    byes: s.byes,
    forfeits_given: s.forfeits_given,
    forfeits_received: s.forfeits_received,
    total_speaks: s.total_speaks,
    avg_speaks: s.avg_speaks,
    adjusted_speaks: s.adjusted_speaks,
    double_adjusted_speaks: s.double_adjusted_speaks,
    total_ranks: s.total_ranks,
    avg_ranks: s.avg_ranks,
    adjusted_ranks: s.adjusted_ranks,
    double_adjusted_ranks: s.double_adjusted_ranks,
    opp_wins: s.opp_wins,
    opp_win_pct: s.opp_win_pct,
    aff_rounds: s.aff_rounds,
    neg_rounds: s.neg_rounds,
    prelim_rank: s.prelim_rank,
    overall_rank: s.overall_rank,
    is_breaking: s.is_breaking,
    break_seed: s.break_seed,
    rounds_completed: s.rounds_completed,
    last_computed_at: s.last_computed_at,
  }));

  try {
    // Upsert using tournament_id + registration_id as unique key
    const { error } = await supabase
      .from('computed_standings' as 'tournaments')
      .upsert(inserts as unknown as Record<string, unknown>[], {
        onConflict: 'tournament_id,registration_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error upserting standings:', error);
    }
  } catch (err) {
    console.error('Error upserting standings:', err);
  }
}

/**
 * Upserts head-to-head records to the database.
 *
 * @param tournamentId - Tournament ID
 * @param records - Array of head-to-head records to upsert
 */
export async function upsertHeadToHead(
  tournamentId: string,
  records: HeadToHead[]
): Promise<void> {
  if (records.length === 0) return;

  const inserts: HeadToHeadInsert[] = records.map((r) => ({
    tournament_id: r.tournament_id,
    event_id: r.event_id,
    registration_id: r.registration_id,
    opponent_id: r.opponent_id,
    wins: r.wins,
    losses: r.losses,
    total_speaks_for: r.total_speaks_for,
    total_speaks_against: r.total_speaks_against,
  }));

  try {
    const { error } = await supabase
      .from('head_to_head' as 'tournaments')
      .upsert(inserts as unknown as Record<string, unknown>[], {
        onConflict: 'tournament_id,registration_id,opponent_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error upserting head-to-head records:', error);
    }
  } catch (err) {
    console.error('Error upserting head-to-head records:', err);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Fetches existing computed standings from the database.
 *
 * @param tournamentId - Tournament ID
 * @param eventId - Optional event ID filter
 * @returns Array of computed standings with registration info
 */
export async function fetchComputedStandings(
  tournamentId: string,
  eventId?: string | null
): Promise<ComputedStanding[]> {
  let query = supabase
    .from('computed_standings' as 'tournaments')
    .select('*')
    .eq('tournament_id', tournamentId);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching computed standings:', error);
    return [];
  }

  return (data ?? []) as unknown as ComputedStanding[];
}

/**
 * Computes and persists standings to the database.
 * This is the main entry point for recalculating and caching standings.
 *
 * @param options - Computation options
 * @returns StandingsResult with sorted standings
 */
export async function computeAndPersistStandings(
  options: ComputeOptions
): Promise<StandingsResult> {
  const result = await computeStandings(options);

  // Persist standings
  await upsertStandings(options.tournamentId, result.standings);

  // Build and persist H2H records
  const h2hRecords = await buildHeadToHeadRecords(options.tournamentId, options.eventId);
  await upsertHeadToHead(options.tournamentId, h2hRecords);

  return result;
}
