import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';
import { toast } from 'sonner';

interface PushNotificationOptions {
  enabled?: boolean;
  tournamentId?: string | null;
  registrationId?: string | null;
  judgeProfileId?: string | null;
}

export function usePushNotifications({
  enabled = true,
  tournamentId,
  registrationId,
  judgeProfileId
}: PushNotificationOptions = {}) {
  const { user } = useOptimizedAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notification permission denied');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      // Fall back to toast notification
      toast.info(title, {
        description: options?.body
      });
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Error showing notification:', error);
      // Fall back to toast
      toast.info(title, { description: options?.body });
    }
  }, [isSupported, permission]);

  // Subscribe to real-time notifications for the user
  useEffect(() => {
    if (!enabled || !user || permission !== 'granted') return;

    const channels: any[] = [];

    // Subscribe to competitor notifications
    if (registrationId) {
      const competitorChannel = supabase
        .channel(`push-competitor-${registrationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'competitor_notifications',
            filter: `registration_id=eq.${registrationId}`
          },
          (payload) => {
            const data = payload.new as any;
            showNotification(data.title, {
              body: data.message,
              tag: `competitor-${data.id}`,
              data: { type: 'competitor', id: data.id }
            });
          }
        )
        .subscribe();
      
      channels.push(competitorChannel);
    }

    // Subscribe to judge notifications
    if (judgeProfileId) {
      const judgeChannel = supabase
        .channel(`push-judge-${judgeProfileId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'judge_notifications',
            filter: `judge_profile_id=eq.${judgeProfileId}`
          },
          (payload) => {
            const data = payload.new as any;
            showNotification(data.title, {
              body: data.message,
              tag: `judge-${data.id}`,
              data: { type: 'judge', id: data.id }
            });
          }
        )
        .subscribe();
      
      channels.push(judgeChannel);
    }

    // Subscribe to round releases for the tournament
    if (tournamentId) {
      const roundChannel = supabase
        .channel(`push-rounds-${tournamentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pairings',
            filter: `tournament_id=eq.${tournamentId}`
          },
          (payload) => {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            // Notify when pairings are released
            if (newData?.released && !oldData?.released) {
              showNotification('Pairings Released! 🎯', {
                body: 'New match pairings are now available. Check your assignment!',
                tag: `pairing-release-${newData.round_id}`,
                requireInteraction: true
              });
            }
          }
        )
        .subscribe();
      
      channels.push(roundChannel);
    }

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [enabled, user, permission, tournamentId, registrationId, judgeProfileId, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    isEnabled: permission === 'granted'
  };
}
