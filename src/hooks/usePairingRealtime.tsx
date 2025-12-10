import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PairingRealtimeOptions {
  roundId: string | null;
  onUpdate: (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => void;
  onInsert?: (payload: { new: Record<string, unknown> }) => void;
  onDelete?: (payload: { old: Record<string, unknown> }) => void;
}

export function usePairingRealtime({ roundId, onUpdate, onInsert, onDelete }: PairingRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const subscribe = useCallback(() => {
    if (!roundId) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`pairings-realtime-${roundId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pairings',
          filter: `round_id=eq.${roundId}`
        },
        (payload) => {
          onUpdate({
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>
          });
        }
      );

    if (onInsert) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pairings',
          filter: `round_id=eq.${roundId}`
        },
        (payload) => {
          onInsert({ new: payload.new as Record<string, unknown> });
        }
      );
    }

    if (onDelete) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'pairings',
          filter: `round_id=eq.${roundId}`
        },
        (payload) => {
          onDelete({ old: payload.old as Record<string, unknown> });
        }
      );
    }

    channel.subscribe();
    channelRef.current = channel;
  }, [roundId, onUpdate, onInsert, onDelete]);

  useEffect(() => {
    subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscribe]);

  return { resubscribe: subscribe };
}
