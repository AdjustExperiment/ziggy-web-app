/**
 * React Query Hook for Computed Standings
 *
 * Provides access to computed tournament standings with caching,
 * recomputation mutations, and real-time updates.
 *
 * @module useComputedStandings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  computeStandings,
  computeAndPersistStandings,
  fetchComputedStandings,
  type ComputeOptions,
  type StandingsResult,
} from '@/lib/tabulation/standingsService';
import type { ComputedStanding } from '@/types/tabulation';

/**
 * Options for the useComputedStandings hook
 */
interface UseComputedStandingsOptions {
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
  /** Time in ms before data is considered stale (default: 2 minutes) */
  staleTime?: number;
  /** Whether to include elimination round results (default: false) */
  includeElims?: boolean;
  /** Whether to force fresh computation vs. using cached standings (default: false) */
  forceCompute?: boolean;
}

/**
 * Hook to fetch and manage computed standings for a tournament/event.
 *
 * @param tournamentId - The tournament ID
 * @param eventId - Optional event ID to filter by
 * @param options - Query options
 * @returns Object with standings data, loading state, and utility functions
 *
 * @example
 * const { standings, isLoading, recompute } = useComputedStandings(
 *   tournamentId,
 *   eventId,
 *   { staleTime: 60000 }
 * );
 *
 * // Force recomputation
 * await recompute();
 */
export function useComputedStandings(
  tournamentId: string | undefined,
  eventId?: string | null,
  options: UseComputedStandingsOptions = {}
) {
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minute default cache
    includeElims = false,
    forceCompute = false,
  } = options;

  const queryClient = useQueryClient();

  // Main query to fetch standings
  const standingsQuery = useQuery({
    queryKey: ['computed-standings', tournamentId, eventId, includeElims],
    queryFn: async (): Promise<StandingsResult> => {
      if (!tournamentId) {
        throw new Error('Tournament ID required');
      }

      if (import.meta.env.DEV) {
        console.log('[useComputedStandings] Fetching standings for:', {
          tournamentId,
          eventId,
          includeElims,
        });
      }

      // If forceCompute, always compute fresh
      // Otherwise try to use cached standings
      if (forceCompute) {
        const result = await computeStandings({
          tournamentId,
          eventId,
          includeElims,
        });

        if (import.meta.env.DEV) {
          console.log('[useComputedStandings] Computed standings:', {
            teamsRanked: result.teamsRanked,
            roundsIncluded: result.roundsIncluded,
          });
        }

        return result;
      }

      // Try to fetch cached standings first
      const cached = await fetchComputedStandings(tournamentId, eventId);
      if (cached.length > 0) {
        if (import.meta.env.DEV) {
          console.log('[useComputedStandings] Using cached standings:', cached.length);
        }
        return {
          standings: cached,
          computedAt: cached[0]?.last_computed_at || new Date().toISOString(),
          roundsIncluded: 0, // Unknown from cache
          teamsRanked: cached.length,
        };
      }

      // No cache, compute fresh
      const result = await computeStandings({
        tournamentId,
        eventId,
        includeElims,
      });

      if (import.meta.env.DEV) {
        console.log('[useComputedStandings] Computed fresh standings:', {
          teamsRanked: result.teamsRanked,
          roundsIncluded: result.roundsIncluded,
        });
      }

      return result;
    },
    enabled: enabled && !!tournamentId,
    staleTime,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Derived data - wrap standings in useMemo to ensure stable reference
  const standings = useMemo(() => {
    return standingsQuery.data?.standings ?? [];
  }, [standingsQuery.data?.standings]);

  const computedAt = standingsQuery.data?.computedAt;
  const roundsIncluded = standingsQuery.data?.roundsIncluded ?? 0;
  const teamsRanked = standingsQuery.data?.teamsRanked ?? 0;

  // Top standings (top N teams)
  const topStandings = useMemo(() => {
    return standings.slice(0, 10);
  }, [standings]);

  // Breaking teams
  const breakingTeams = useMemo(() => {
    return standings.filter((s) => s.is_breaking);
  }, [standings]);

  // Invalidate query cache
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['computed-standings', tournamentId, eventId],
    });
  }, [queryClient, tournamentId, eventId]);

  return {
    // Data
    standings,
    topStandings,
    breakingTeams,
    computedAt,
    roundsIncluded,
    teamsRanked,

    // Query state
    isLoading: standingsQuery.isLoading,
    isFetching: standingsQuery.isFetching,
    error: standingsQuery.error,

    // Actions
    invalidate,
    refetch: standingsQuery.refetch,
  };
}

/**
 * Options for the recompute mutation
 */
interface RecomputeOptions {
  /** Whether to persist results to database (default: true) */
  persist?: boolean;
  /** Optional callback on success */
  onSuccess?: (result: StandingsResult) => void;
  /** Optional callback on error */
  onError?: (error: Error) => void;
}

/**
 * Hook to trigger standings recomputation.
 *
 * @param options - Mutation options
 * @returns Mutation object with recompute function
 *
 * @example
 * const { recompute, isRecomputing } = useRecomputeStandings({
 *   onSuccess: (result) => console.log('Recomputed:', result.teamsRanked),
 * });
 *
 * await recompute({ tournamentId: 'abc123', eventId: 'event456' });
 */
export function useRecomputeStandings(options: RecomputeOptions = {}) {
  const { persist = true, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: ComputeOptions): Promise<StandingsResult> => {
      if (import.meta.env.DEV) {
        console.log('[useRecomputeStandings] Recomputing standings:', params);
      }

      if (persist) {
        return computeAndPersistStandings(params);
      }
      return computeStandings(params);
    },
    onSuccess: (result, variables) => {
      if (import.meta.env.DEV) {
        console.log('[useRecomputeStandings] Recomputation complete:', {
          teamsRanked: result.teamsRanked,
          roundsIncluded: result.roundsIncluded,
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['computed-standings', variables.tournamentId],
      });

      onSuccess?.(result);
    },
    onError: (error: Error) => {
      console.error('[useRecomputeStandings] Error:', error);
      onError?.(error);
    },
  });

  return {
    recompute: mutation.mutateAsync,
    isRecomputing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Hook to get a single team's standing by registration ID.
 *
 * @param tournamentId - Tournament ID
 * @param registrationId - Team's registration ID
 * @param eventId - Optional event ID filter
 * @returns The team's standing or null if not found
 *
 * @example
 * const standing = useTeamStanding(tournamentId, registrationId);
 * if (standing) {
 *   console.log(`Rank: ${standing.overall_rank}, Wins: ${standing.wins}`);
 * }
 */
export function useTeamStanding(
  tournamentId: string | undefined,
  registrationId: string | undefined,
  eventId?: string | null
): ComputedStanding | null {
  const { standings } = useComputedStandings(tournamentId, eventId, {
    enabled: !!tournamentId && !!registrationId,
  });

  return useMemo(() => {
    if (!registrationId) return null;
    return standings.find((s) => s.registration_id === registrationId) ?? null;
  }, [standings, registrationId]);
}
