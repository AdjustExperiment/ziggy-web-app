import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

export type NotificationSource = 'admin' | 'judge' | 'competitor';

export interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  source: NotificationSource;
  priority?: string;
  action_url?: string | null;
  action_text?: string | null;
  pairing_id?: string | null;
  tournament_id?: string | null;
}

interface UseUnifiedNotificationsResult {
  notifications: UnifiedNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notification: UnifiedNotification) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notification: UnifiedNotification) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUnifiedNotifications(): UseUnifiedNotificationsResult {
  const { user, isAdmin } = useOptimizedAuth();
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [judgeProfileId, setJudgeProfileId] = useState<string | null>(null);
  const [registrationIds, setRegistrationIds] = useState<string[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const allNotifications: UnifiedNotification[] = [];

      // Fetch admin notifications if user is admin
      if (isAdmin) {
        const { data: adminNotifs } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (adminNotifs) {
          const validAdminNotifs = adminNotifs.filter(n => {
            if (n.expires_at) return new Date(n.expires_at) > new Date();
            return true;
          });
          
          allNotifications.push(...validAdminNotifs.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            is_read: n.is_read,
            created_at: n.created_at,
            source: 'admin' as const,
            priority: n.priority,
            action_url: n.action_url,
            action_text: n.action_text,
            tournament_id: n.tournament_id,
          })));
        }
      }

      // Fetch judge notifications if user has a judge profile
      const { data: judgeProfile } = await supabase
        .from('judge_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (judgeProfile) {
        setJudgeProfileId(judgeProfile.id);
        const { data: judgeNotifs } = await supabase
          .from('judge_notifications')
          .select('*')
          .eq('judge_profile_id', judgeProfile.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (judgeNotifs) {
          allNotifications.push(...judgeNotifs.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            is_read: n.is_read,
            created_at: n.created_at,
            source: 'judge' as const,
            pairing_id: n.pairing_id,
            tournament_id: n.tournament_id,
          })));
        }
      }

      // Fetch competitor notifications
      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('user_id', user.id);

      if (registrations && registrations.length > 0) {
        const regIds = registrations.map(r => r.id);
        setRegistrationIds(regIds);
        
        const { data: competitorNotifs } = await supabase
          .from('competitor_notifications')
          .select('*')
          .in('registration_id', regIds)
          .order('created_at', { ascending: false })
          .limit(20);

        if (competitorNotifs) {
          allNotifications.push(...competitorNotifs.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            is_read: n.is_read,
            created_at: n.created_at,
            source: 'competitor' as const,
            pairing_id: n.pairing_id,
            tournament_id: n.tournament_id,
          })));
        }
      }

      // Sort by priority (urgent admin first), then by created_at
      allNotifications.sort((a, b) => {
        // Admin urgent/high priority first
        if (a.source === 'admin' && b.source !== 'admin') {
          if (a.priority === 'urgent' || a.priority === 'high') return -1;
        }
        if (b.source === 'admin' && a.source !== 'admin') {
          if (b.priority === 'urgent' || b.priority === 'high') return 1;
        }
        // Then by date
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNotifications(allNotifications.slice(0, 50));
    } catch (error) {
      console.error('Error fetching unified notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const markAsRead = useCallback(async (notification: UnifiedNotification) => {
    try {
      let tableName: 'admin_notifications' | 'judge_notifications' | 'competitor_notifications';
      
      switch (notification.source) {
        case 'admin':
          tableName = 'admin_notifications';
          break;
        case 'judge':
          tableName = 'judge_notifications';
          break;
        case 'competitor':
          tableName = 'competitor_notifications';
          break;
      }

      const { error } = await supabase
        .from(tableName)
        .update({ is_read: true })
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id && n.source === notification.source
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      // Mark admin notifications as read
      if (isAdmin) {
        const adminUnread = notifications.filter(n => n.source === 'admin' && !n.is_read);
        if (adminUnread.length > 0) {
          await supabase
            .from('admin_notifications')
            .update({ is_read: true })
            .in('id', adminUnread.map(n => n.id));
        }
      }

      // Mark judge notifications as read
      if (judgeProfileId) {
        await supabase
          .from('judge_notifications')
          .update({ is_read: true })
          .eq('judge_profile_id', judgeProfileId)
          .eq('is_read', false);
      }

      // Mark competitor notifications as read
      if (registrationIds.length > 0) {
        await supabase
          .from('competitor_notifications')
          .update({ is_read: true })
          .in('registration_id', registrationIds)
          .eq('is_read', false);
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user, isAdmin, judgeProfileId, registrationIds, notifications]);

  const deleteNotification = useCallback(async (notification: UnifiedNotification) => {
    // Only admin notifications can be deleted
    if (notification.source !== 'admin') return;

    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !(n.id === notification.id && n.source === 'admin')));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Admin notifications channel
    if (isAdmin) {
      const adminChannel = supabase
        .channel('unified-admin-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchNotifications)
        .subscribe();
      channels.push(adminChannel);
    }

    // Judge notifications channel
    const judgeChannel = supabase
      .channel('unified-judge-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judge_notifications' }, fetchNotifications)
      .subscribe();
    channels.push(judgeChannel);

    // Competitor notifications channel
    const competitorChannel = supabase
      .channel('unified-competitor-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitor_notifications' }, fetchNotifications)
      .subscribe();
    channels.push(competitorChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, isAdmin, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
