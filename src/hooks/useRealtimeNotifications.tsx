
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealtimeNotificationCounts {
  unreadMessages: number;
  pendingRequests: number;
  pendingProposals: number;
  unreadJudgeNotifications: number;
}

interface UseRealtimeNotificationsProps {
  tournamentId?: string;
  judgeProfileId?: string;
  userId?: string;
}

export const useRealtimeNotifications = ({ 
  tournamentId, 
  judgeProfileId, 
  userId 
}: UseRealtimeNotificationsProps = {}) => {
  const { toast } = useToast();
  const [counts, setCounts] = useState<RealtimeNotificationCounts>({
    unreadMessages: 0,
    pendingRequests: 0,
    pendingProposals: 0,
    unreadJudgeNotifications: 0,
  });

  const updateCounts = useCallback(async () => {
    try {
      const promises = [];

      // Count unread judge notifications for this judge
      if (judgeProfileId) {
        promises.push(
          supabase
            .from('judge_notifications')
            .select('id', { count: 'exact' })
            .eq('judge_profile_id', judgeProfileId)
            .eq('is_read', false)
        );
      } else {
        promises.push(Promise.resolve({ count: 0 }));
      }

      // Count pending judge requests for this tournament
      if (tournamentId) {
        promises.push(
          supabase
            .from('judge_requests')
            .select('id', { count: 'exact' })
            .eq('status', 'pending')
            .in('pairing_id', 
              supabase
                .from('pairings')
                .select('id')
                .eq('tournament_id', tournamentId)
            )
        );
      } else {
        promises.push(Promise.resolve({ count: 0 }));
      }

      // Count pending schedule proposals for this tournament
      if (tournamentId) {
        promises.push(
          supabase
            .from('schedule_proposals')
            .select('id', { count: 'exact' })
            .eq('status', 'pending')
            .in('pairing_id',
              supabase
                .from('pairings')
                .select('id')
                .eq('tournament_id', tournamentId)
            )
        );
      } else {
        promises.push(Promise.resolve({ count: 0 }));
      }

      const [judgeNotifications, judgeRequests, scheduleProposals] = await Promise.all(promises);

      setCounts({
        unreadMessages: 0, // Will be handled per-pairing
        pendingRequests: judgeRequests.count || 0,
        pendingProposals: scheduleProposals.count || 0,
        unreadJudgeNotifications: judgeNotifications.count || 0,
      });
    } catch (error) {
      console.error('Error updating notification counts:', error);
    }
  }, [tournamentId, judgeProfileId]);

  useEffect(() => {
    updateCounts();

    // Set up realtime subscriptions
    const channels = [];

    // Judge notifications for judges
    if (judgeProfileId) {
      const judgeChannel = supabase
        .channel('judge-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'judge_notifications',
            filter: `judge_profile_id=eq.${judgeProfileId}`,
          },
          (payload) => {
            console.log('New judge notification:', payload);
            toast({
              title: payload.new.title,
              description: payload.new.message,
              duration: 5000,
            });
            updateCounts();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'judge_notifications',
            filter: `judge_profile_id=eq.${judgeProfileId}`,
          },
          () => {
            updateCounts();
          }
        )
        .subscribe();

      channels.push(judgeChannel);
    }

    // Judge requests for admins
    if (tournamentId) {
      const requestsChannel = supabase
        .channel('judge-requests')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'judge_requests',
          },
          (payload) => {
            console.log('Judge request change:', payload);
            if (payload.eventType === 'INSERT') {
              toast({
                title: 'New Judge Request',
                description: 'A competitor has requested a different judge',
                duration: 5000,
              });
            }
            updateCounts();
          }
        )
        .subscribe();

      channels.push(requestsChannel);
    }

    // Schedule proposals for admins
    if (tournamentId) {
      const proposalsChannel = supabase
        .channel('schedule-proposals')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'schedule_proposals',
          },
          (payload) => {
            console.log('Schedule proposal change:', payload);
            if (payload.eventType === 'INSERT') {
              toast({
                title: 'New Schedule Proposal',
                description: 'A competitor has proposed a schedule change',
                duration: 5000,
              });
            }
            updateCounts();
          }
        )
        .subscribe();

      channels.push(proposalsChannel);
    }

    // Pairing messages (will be handled per pairing in other components)
    if (userId) {
      const messagesChannel = supabase
        .channel('pairing-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pairing_messages',
          },
          (payload) => {
            console.log('New pairing message:', payload);
            // Only toast if it's not from the current user
            if (payload.new.sender_id !== userId) {
              toast({
                title: 'New Message',
                description: 'You have received a new message in a pairing',
                duration: 3000,
              });
            }
          }
        )
        .subscribe();

      channels.push(messagesChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [tournamentId, judgeProfileId, userId, updateCounts, toast]);

  return {
    counts,
    refreshCounts: updateCounts,
  };
};
