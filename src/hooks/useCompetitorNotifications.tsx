import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompetitorNotification {
  id: string;
  registration_id: string;
  tournament_id: string | null;
  pairing_id: string | null;
  round_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface UseCompetitorNotificationsResult {
  notifications: CompetitorNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useCompetitorNotifications(userId: string | undefined): UseCompetitorNotificationsResult {
  const [notifications, setNotifications] = useState<CompetitorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      // First get user's registration IDs
      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('user_id', userId);

      if (!registrations || registrations.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const regIds = registrations.map(r => r.id);

      // Fetch notifications for these registrations
      const { data, error } = await supabase
        .from('competitor_notifications')
        .select('*')
        .in('registration_id', regIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching competitor notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('competitor_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      // Get user's registration IDs first
      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('user_id', userId);

      if (!registrations || registrations.length === 0) return;

      const regIds = registrations.map(r => r.id);

      const { error } = await supabase
        .from('competitor_notifications')
        .update({ is_read: true })
        .in('registration_id', regIds)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: "Success", description: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('competitor-notifications')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'competitor_notifications'
        },
        (payload) => {
          // Refresh to check if it's for current user
          fetchNotifications();
          toast({
            title: "New Notification",
            description: (payload.new as any).title || "You have a new notification",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications, toast]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
}
