/**
 * Tabulation Types
 *
 * Type definitions for the enhanced tabulation system including:
 * - Debate format configurations
 * - Tournament-specific tab settings
 * - Speaker results and statistics
 * - Round results and standings
 * - Tiebreaker configurations
 * - Audit logging
 */

// ============================================================================
// Core Enums and Union Types
// ============================================================================

/**
 * Available tiebreaker types for ranking competitors
 */
export type TiebreakerType =
  | 'wins'
  | 'losses'
  | 'speaks'
  | 'ranks'
  | 'adjusted_speaks'
  | 'adjusted_ranks'
  | 'double_adjusted_speaks'
  | 'double_adjusted_ranks'
  | 'opp_wins'
  | 'opp_win_pct'
  | 'head_to_head'
  | 'coin_flip';

/**
 * Possible round result outcomes
 */
export type RoundResultType = 'win' | 'loss' | 'bye' | 'forfeit_win' | 'forfeit_loss';

/**
 * Side in a debate round
 */
export type Side = 'aff' | 'neg';

/**
 * Audit log action types
 */
export type TabAuditAction =
  | 'score_override'
  | 'forfeit'
  | 'dq'
  | 'manual_rank'
  | 'bye_assigned'
  | 'result_correction'
  | 'speaker_points_edit'
  | 'tiebreaker_override';

/**
 * Entity types that can be audited
 */
export type TabAuditEntityType =
  | 'pairing'
  | 'registration'
  | 'round_result'
  | 'speaker_result'
  | 'computed_standing'
  | 'head_to_head';

// ============================================================================
// Debate Format Configuration
// ============================================================================

/**
 * Debate format configuration (e.g., LD, TP, Parli)
 */
export interface DebateFormatTab {
  id: string;
  name: string;
  speaker_count: number;
  speaker_point_min: number;
  speaker_point_max: number;
  rank_scale: number;
  uses_teams: boolean;
  default_tiebreakers: TiebreakerType[];
  created_at: string;
}

/**
 * Insert type for DebateFormatTab
 */
export interface DebateFormatTabInsert {
  id?: string;
  name: string;
  speaker_count?: number;
  speaker_point_min?: number;
  speaker_point_max?: number;
  rank_scale?: number;
  uses_teams?: boolean;
  default_tiebreakers?: TiebreakerType[];
  created_at?: string;
}

// ============================================================================
// Tournament Tab Configuration
// ============================================================================

/**
 * Tournament-specific tabulation configuration
 */
export interface TournamentTabConfig {
  id: string;
  tournament_id: string;
  event_id: string | null;
  debate_format_id: string | null;
  speaker_point_min: number | null;
  speaker_point_max: number | null;
  rank_scale: number | null;
  tiebreaker_order: TiebreakerType[];
  drop_high_low_speaks: number;
  drop_high_low_ranks: number;
  prelim_rounds: number | null;
  break_to: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert type for TournamentTabConfig
 */
export interface TournamentTabConfigInsert {
  id?: string;
  tournament_id: string;
  event_id?: string | null;
  debate_format_id?: string | null;
  speaker_point_min?: number | null;
  speaker_point_max?: number | null;
  rank_scale?: number | null;
  tiebreaker_order?: TiebreakerType[];
  drop_high_low_speaks?: number;
  drop_high_low_ranks?: number;
  prelim_rounds?: number | null;
  break_to?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Update type for TournamentTabConfig
 */
export interface TournamentTabConfigUpdate {
  debate_format_id?: string | null;
  speaker_point_min?: number | null;
  speaker_point_max?: number | null;
  rank_scale?: number | null;
  tiebreaker_order?: TiebreakerType[];
  drop_high_low_speaks?: number;
  drop_high_low_ranks?: number;
  prelim_rounds?: number | null;
  break_to?: number | null;
  updated_at?: string;
}

// ============================================================================
// Speaker Results
// ============================================================================

/**
 * Individual speaker result for a single round
 */
export interface SpeakerResult {
  id: string;
  pairing_id: string;
  registration_id: string;
  speaker_position: number;
  speaker_name: string | null;
  speaker_points: number | null;
  speaker_rank: number | null;
  side: Side | null;
  is_reply_speaker: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Insert type for SpeakerResult
 */
export interface SpeakerResultInsert {
  id?: string;
  pairing_id: string;
  registration_id: string;
  speaker_position: number;
  speaker_name?: string | null;
  speaker_points?: number | null;
  speaker_rank?: number | null;
  side?: Side | null;
  is_reply_speaker?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Update type for SpeakerResult
 */
export interface SpeakerResultUpdate {
  speaker_name?: string | null;
  speaker_points?: number | null;
  speaker_rank?: number | null;
  is_reply_speaker?: boolean;
  updated_at?: string;
}

// ============================================================================
// Round Results
// ============================================================================

/**
 * Round-by-round team result (denormalized for queries)
 */
export interface RoundResult {
  id: string;
  tournament_id: string;
  event_id: string | null;
  round_id: string;
  registration_id: string;
  pairing_id: string;
  opponent_registration_id: string | null;
  side: Side | null;
  result: RoundResultType;
  total_speaks: number | null;
  total_ranks: number | null;
  ballot_count: number;
  round_number: number;
  is_elim: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Insert type for RoundResult
 */
export interface RoundResultInsert {
  id?: string;
  tournament_id: string;
  event_id?: string | null;
  round_id: string;
  registration_id: string;
  pairing_id: string;
  opponent_registration_id?: string | null;
  side?: Side | null;
  result: RoundResultType;
  total_speaks?: number | null;
  total_ranks?: number | null;
  ballot_count?: number;
  round_number: number;
  is_elim?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Update type for RoundResult
 */
export interface RoundResultUpdate {
  result?: RoundResultType;
  total_speaks?: number | null;
  total_ranks?: number | null;
  ballot_count?: number;
  is_elim?: boolean;
  updated_at?: string;
}

// ============================================================================
// Computed Standings
// ============================================================================

/**
 * Precomputed standings with all tiebreaker metrics
 */
export interface ComputedStanding {
  id: string;
  tournament_id: string;
  event_id: string | null;
  registration_id: string;
  // Basic record
  wins: number;
  losses: number;
  byes: number;
  forfeits_given: number;
  forfeits_received: number;
  // Speaks
  total_speaks: number;
  avg_speaks: number;
  adjusted_speaks: number;
  double_adjusted_speaks: number;
  // Ranks
  total_ranks: number;
  avg_ranks: number;
  adjusted_ranks: number;
  double_adjusted_ranks: number;
  // Opponent strength
  opp_wins: number;
  opp_win_pct: number;
  // Side balance
  aff_rounds: number;
  neg_rounds: number;
  // Rankings
  prelim_rank: number | null;
  overall_rank: number | null;
  is_breaking: boolean;
  break_seed: number | null;
  // Metadata
  rounds_completed: number;
  last_computed_at: string;
  updated_at: string;
}

/**
 * Insert type for ComputedStanding
 */
export interface ComputedStandingInsert {
  id?: string;
  tournament_id: string;
  event_id?: string | null;
  registration_id: string;
  wins?: number;
  losses?: number;
  byes?: number;
  forfeits_given?: number;
  forfeits_received?: number;
  total_speaks?: number;
  avg_speaks?: number;
  adjusted_speaks?: number;
  double_adjusted_speaks?: number;
  total_ranks?: number;
  avg_ranks?: number;
  adjusted_ranks?: number;
  double_adjusted_ranks?: number;
  opp_wins?: number;
  opp_win_pct?: number;
  aff_rounds?: number;
  neg_rounds?: number;
  prelim_rank?: number | null;
  overall_rank?: number | null;
  is_breaking?: boolean;
  break_seed?: number | null;
  rounds_completed?: number;
  last_computed_at?: string;
  updated_at?: string;
}

/**
 * Update type for ComputedStanding
 */
export interface ComputedStandingUpdate {
  wins?: number;
  losses?: number;
  byes?: number;
  forfeits_given?: number;
  forfeits_received?: number;
  total_speaks?: number;
  avg_speaks?: number;
  adjusted_speaks?: number;
  double_adjusted_speaks?: number;
  total_ranks?: number;
  avg_ranks?: number;
  adjusted_ranks?: number;
  double_adjusted_ranks?: number;
  opp_wins?: number;
  opp_win_pct?: number;
  aff_rounds?: number;
  neg_rounds?: number;
  prelim_rank?: number | null;
  overall_rank?: number | null;
  is_breaking?: boolean;
  break_seed?: number | null;
  rounds_completed?: number;
  last_computed_at?: string;
}

// ============================================================================
// Head-to-Head Records
// ============================================================================

/**
 * Head-to-head record between two competitors
 */
export interface HeadToHead {
  id: string;
  tournament_id: string;
  event_id: string | null;
  registration_id: string;
  opponent_id: string;
  wins: number;
  losses: number;
  total_speaks_for: number;
  total_speaks_against: number;
}

/**
 * Insert type for HeadToHead
 */
export interface HeadToHeadInsert {
  id?: string;
  tournament_id: string;
  event_id?: string | null;
  registration_id: string;
  opponent_id: string;
  wins?: number;
  losses?: number;
  total_speaks_for?: number;
  total_speaks_against?: number;
}

/**
 * Update type for HeadToHead
 */
export interface HeadToHeadUpdate {
  wins?: number;
  losses?: number;
  total_speaks_for?: number;
  total_speaks_against?: number;
}

// ============================================================================
// Audit Log
// ============================================================================

/**
 * Audit log entry for tabulation changes
 */
export interface TabAuditEntry {
  id: string;
  tournament_id: string;
  user_id: string | null;
  action: TabAuditAction;
  entity_type: TabAuditEntityType;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

/**
 * Insert type for TabAuditEntry
 */
export interface TabAuditEntryInsert {
  id?: string;
  tournament_id: string;
  user_id?: string | null;
  action: TabAuditAction;
  entity_type: TabAuditEntityType;
  entity_id: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  reason?: string | null;
  created_at?: string;
}

// ============================================================================
// Extended Types for UI
// ============================================================================

/**
 * Registration info for display in standings
 */
export interface RegistrationInfo {
  id: string;
  participant_name: string;
  partner_name: string | null;
  school_organization: string | null;
}

/**
 * Standing with registration info and optional round details
 */
export interface StandingWithTeam extends ComputedStanding {
  registration: RegistrationInfo;
  round_results?: RoundResult[];
  speaker_results?: SpeakerResult[];
}

/**
 * Round result with opponent info for display
 */
export interface RoundResultWithOpponent extends RoundResult {
  opponent?: RegistrationInfo;
  round_name?: string;
}

// ============================================================================
// Tiebreaker Presets
// ============================================================================

/**
 * Predefined tiebreaker configuration
 */
export interface TiebreakerPreset {
  name: string;
  description: string;
  order: TiebreakerType[];
}

/**
 * Common tiebreaker presets
 */
export const TIEBREAKER_PRESETS: TiebreakerPreset[] = [
  {
    name: 'Standard',
    description: 'Win/Loss -> Speaks -> Ranks -> Adjusted -> Opponent Strength',
    order: ['wins', 'speaks', 'ranks', 'adjusted_speaks', 'adjusted_ranks', 'opp_wins', 'head_to_head', 'coin_flip'],
  },
  {
    name: 'Speaks-First',
    description: 'Speaks -> Win/Loss -> Ranks (rewards good speaking)',
    order: ['speaks', 'wins', 'ranks', 'opp_wins', 'head_to_head', 'coin_flip'],
  },
  {
    name: 'NCFCA Standard',
    description: 'Traditional NCFCA tiebreaker order',
    order: ['wins', 'speaks', 'ranks', 'adjusted_speaks', 'adjusted_ranks', 'opp_wins', 'coin_flip'],
  },
  {
    name: 'Opponent-Weighted',
    description: 'Emphasizes opponent strength (rewards tough schedules)',
    order: ['wins', 'opp_win_pct', 'speaks', 'head_to_head', 'coin_flip'],
  },
];

/**
 * Human-readable labels for tiebreaker types
 */
export const TIEBREAKER_LABELS: Record<TiebreakerType, string> = {
  wins: 'Wins',
  losses: 'Losses',
  speaks: 'Speaker Points',
  ranks: 'Speaker Ranks',
  adjusted_speaks: 'Adjusted Speaks',
  adjusted_ranks: 'Adjusted Ranks',
  double_adjusted_speaks: 'Double Adjusted Speaks',
  double_adjusted_ranks: 'Double Adjusted Ranks',
  opp_wins: 'Opponent Wins',
  opp_win_pct: 'Opponent Win %',
  head_to_head: 'Head-to-Head',
  coin_flip: 'Coin Flip',
};

// ============================================================================
// Scoring Input Types
// ============================================================================

/**
 * Speaker score input for ballot submission
 */
export interface SpeakerScoreInput {
  position: number;
  name?: string;
  points: number;
  rank: number;
}

/**
 * Complete scoring input for a round
 */
export interface ScoringInput {
  winner: Side;
  aff_speakers: SpeakerScoreInput[];
  neg_speakers: SpeakerScoreInput[];
  comments?: string;
}

/**
 * Validation result for scoring input
 */
export interface ScoringValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Computation Types
// ============================================================================

/**
 * Options for computing standings
 */
export interface ComputeStandingsOptions {
  tournament_id: string;
  event_id?: string | null;
  include_elims?: boolean;
  force_recompute?: boolean;
}

/**
 * Result of standings computation
 */
export interface ComputeStandingsResult {
  standings: ComputedStanding[];
  computed_at: string;
  rounds_included: number;
  teams_ranked: number;
}

/**
 * Tiebreaker comparison result
 */
export interface TiebreakerComparison {
  registration_a: string;
  registration_b: string;
  decided_by: TiebreakerType | null;
  result: -1 | 0 | 1; // -1 = A wins, 0 = tie, 1 = B wins
}
