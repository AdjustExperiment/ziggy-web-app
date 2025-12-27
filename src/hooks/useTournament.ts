import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  is_online: boolean;
  tournament_type: string | null;
  format: string | null;
  allow_judge_volunteering: boolean;
  auto_approve_judge_volunteers: boolean;
  registration_open: boolean;
  current_participants: number;
  max_participants: number;
}

interface UseTournamentOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useTournament(tournamentId: string | undefined, options: UseTournamentOptions = {}) {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options; // 5 minute default cache
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      if (!tournamentId) throw new Error('Tournament ID required');
      
      if (import.meta.env.DEV) {
        console.log('[useTournament] Fetching tournament:', tournamentId);
      }

      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      
      if (import.meta.env.DEV) {
        console.log('[useTournament] Fetched tournament:', data?.name);
      }
      
      return data as Tournament;
    },
    enabled: enabled && !!tournamentId,
    staleTime,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
  }, [queryClient, tournamentId]);

  const prefetch = useCallback(async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['tournament', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data as Tournament;
      },
      staleTime,
    });
  }, [queryClient, staleTime]);

  return {
    tournament: query.data,
    isLoading: query.isLoading,
    error: query.error,
    invalidate,
    prefetch,
    refetch: query.refetch,
  };
}
