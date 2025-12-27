import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface RealtimeEvent {
  type: 'round' | 'pairing' | 'announcement';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
}

interface UseTournamentRealtimeOptions {
  tournamentId: string | null;
  onRoundUpdate?: (event: RealtimeEvent) => void;
  onPairingUpdate?: (event: RealtimeEvent) => void;
  onAnnouncementUpdate?: (event: RealtimeEvent) => void;
  showNotifications?: boolean;
}

export function useTournamentRealtime({
  tournamentId,
  onRoundUpdate,
  onPairingUpdate,
  onAnnouncementUpdate,
  showNotifications = true
}: UseTournamentRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const subscribe = useCallback(() => {
    if (!tournamentId) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    if (import.meta.env.DEV) {
      console.log('[TournamentRealtime] Subscribing to tournament:', tournamentId);
    }

    const channel = supabase
      .channel(`tournament-realtime-${tournamentId}`)
      // Listen for round changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[TournamentRealtime] Round event:', payload.eventType, payload);
          }
          
          const event: RealtimeEvent = {
            type: 'round',
            action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            data: (payload.new || payload.old) as Record<string, unknown>
          };
          
          onRoundUpdate?.(event);
          
          if (showNotifications && payload.eventType === 'INSERT') {
            toast.info('New Round Created', {
              description: `Round ${(payload.new as any)?.round_number || ''} has been added.`
            });
          }
        }
      )
      // Listen for pairing changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pairings',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[TournamentRealtime] Pairing event:', payload.eventType, payload);
          }
          
          const event: RealtimeEvent = {
            type: 'pairing',
            action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            data: (payload.new || payload.old) as Record<string, unknown>
          };
          
          onPairingUpdate?.(event);
          
          // Show notification for released pairings
          if (showNotifications && payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            if (newData?.released && !oldData?.released) {
              toast.success('Pairings Released', {
                description: 'New pairings have been released. Check your match!'
              });
            }
            
            if (newData?.judge_id && !oldData?.judge_id) {
              toast.info('Judge Assigned', {
                description: 'A judge has been assigned to a match.'
              });
            }
          }
        }
      )
      // Listen for announcement changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_content',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[TournamentRealtime] Announcement event:', payload.eventType, payload);
          }
          
          const event: RealtimeEvent = {
            type: 'announcement',
            action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            data: (payload.new || payload.old) as Record<string, unknown>
          };
          
          onAnnouncementUpdate?.(event);
          
          if (showNotifications && payload.eventType === 'UPDATE') {
            toast.info('Tournament Update', {
              description: 'Tournament information has been updated.'
            });
          }
        }
      );

    channel.subscribe((status) => {
      if (import.meta.env.DEV) {
        console.log('[TournamentRealtime] Subscription status:', status);
      }
    });

    channelRef.current = channel;
  }, [tournamentId, onRoundUpdate, onPairingUpdate, onAnnouncementUpdate, showNotifications]);

  useEffect(() => {
    subscribe();

    return () => {
      if (channelRef.current) {
        if (import.meta.env.DEV) {
          console.log('[TournamentRealtime] Unsubscribing from tournament:', tournamentId);
        }
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscribe]);

  return { resubscribe: subscribe };
}
