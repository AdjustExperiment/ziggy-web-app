import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';

interface Round {
  id: string;
  name: string;
  round_number: number;
  status: string;
  scheduled_date: string | null;
  event_id: string | null;
}

interface Pairing {
  id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  judge_id: string | null;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  result: any;
  released: boolean;
  event_id: string | null;
  round_id: string;
}

interface UseTournamentRoundsOptions {
  enabled?: boolean;
  staleTime?: number;
  includeUnreleased?: boolean;
}

export function useTournamentRounds(
  tournamentId: string | undefined, 
  options: UseTournamentRoundsOptions = {}
) {
  const { 
    enabled = true, 
    staleTime = 2 * 60 * 1000, // 2 minute default cache
    includeUnreleased = false 
  } = options;
  const queryClient = useQueryClient();

  // Fetch rounds
  const roundsQuery = useQuery({
    queryKey: ['tournament-rounds', tournamentId],
    queryFn: async () => {
      if (!tournamentId) throw new Error('Tournament ID required');
      
      if (import.meta.env.DEV) {
        console.log('[useTournamentRounds] Fetching rounds for tournament:', tournamentId);
      }

      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true });

      if (error) throw error;
      
      if (import.meta.env.DEV) {
        console.log('[useTournamentRounds] Fetched rounds:', data?.length);
      }
      
      return (data || []) as Round[];
    },
    enabled: enabled && !!tournamentId,
    staleTime,
    gcTime: 5 * 60 * 1000,
  });

  // Derived data
  const rounds = roundsQuery.data || [];
  
  const activeRound = useMemo(() => {
    return rounds.find(r => r.status === 'in_progress') || rounds[rounds.length - 1];
  }, [rounds]);

  const eliminationRounds = useMemo(() => {
    return rounds.filter(r => r.name?.toLowerCase().includes('elim') || r.name?.toLowerCase().includes('final'));
  }, [rounds]);

  const prelimRounds = useMemo(() => {
    return rounds.filter(r => !r.name?.toLowerCase().includes('elim') && !r.name?.toLowerCase().includes('final'));
  }, [rounds]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tournament-rounds', tournamentId] });
  }, [queryClient, tournamentId]);

  return {
    rounds,
    activeRound,
    eliminationRounds,
    prelimRounds,
    isLoading: roundsQuery.isLoading,
    error: roundsQuery.error,
    invalidate,
    refetch: roundsQuery.refetch,
  };
}

// Separate hook for pairings to allow independent loading
export function useRoundPairings(
  roundId: string | null,
  options: { includeUnreleased?: boolean; staleTime?: number } = {}
) {
  const { includeUnreleased = false, staleTime = 60 * 1000 } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['round-pairings', roundId, includeUnreleased],
    queryFn: async () => {
      if (!roundId) throw new Error('Round ID required');
      
      if (import.meta.env.DEV) {
        console.log('[useRoundPairings] Fetching pairings for round:', roundId, { includeUnreleased });
      }

      let queryBuilder = supabase
        .from('pairings')
        .select('*')
        .eq('round_id', roundId)
        .order('room_rank', { ascending: true });

      // Only filter by released if not including unreleased
      if (!includeUnreleased) {
        queryBuilder = queryBuilder.eq('released', true);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      
      if (import.meta.env.DEV) {
        console.log('[useRoundPairings] Fetched pairings:', data?.length, 
          'released:', data?.filter(p => p.released).length,
          'unreleased:', data?.filter(p => !p.released).length
        );
      }
      
      return data as Pairing[];
    },
    enabled: !!roundId,
    staleTime,
    gcTime: 5 * 60 * 1000,
  });

  const pairings = query.data || [];
  
  const releasedPairings = useMemo(() => 
    pairings.filter(p => p.released), [pairings]);
  
  const unreleasedPairings = useMemo(() => 
    pairings.filter(p => !p.released), [pairings]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['round-pairings', roundId] });
  }, [queryClient, roundId]);

  return {
    pairings,
    releasedPairings,
    unreleasedPairings,
    hasUnreleased: unreleasedPairings.length > 0,
    isLoading: query.isLoading,
    error: query.error,
    invalidate,
    refetch: query.refetch,
  };
}
