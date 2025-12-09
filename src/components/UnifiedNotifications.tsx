import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Gavel, Users, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  pairing_id?: string;
  tournament_id?: string;
  source: 'judge' | 'competitor';
}

interface UnifiedNotificationsProps {
  userId?: string;
  judgeProfileId?: string;
}

export function UnifiedNotifications({ userId, judgeProfileId }: UnifiedNotificationsProps) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const allNotifications: UnifiedNotification[] = [];

      // Fetch judge notifications if user is a judge
      if (judgeProfileId) {
        const { data: judgeNotifs } = await supabase
          .from('judge_notifications')
          .select('*')
          .eq('judge_profile_id', judgeProfileId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (judgeNotifs) {
          allNotifications.push(...judgeNotifs.map(n => ({
            ...n,
            source: 'judge' as const
          })));
        }
      }

      // Fetch competitor notifications
      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('user_id', userId);

      if (registrations && registrations.length > 0) {
        const regIds = registrations.map(r => r.id);
        const { data: competitorNotifs } = await supabase
          .from('competitor_notifications')
          .select('*')
          .in('registration_id', regIds)
          .order('created_at', { ascending: false })
          .limit(30);

        if (competitorNotifs) {
          allNotifications.push(...competitorNotifs.map(n => ({
            ...n,
            source: 'competitor' as const
          })));
        }
      }

      // Sort by created_at descending
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, judgeProfileId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('unified-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'judge_notifications' }, 
        () => fetchNotifications()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'competitor_notifications' }, 
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (notification: UnifiedNotification) => {
    try {
      const table = notification.source === 'judge' ? 'judge_notifications' : 'competitor_notifications';
      const { error } = await supabase
        .from(table)
        .update({ is_read: true })
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      // Mark judge notifications as read
      if (judgeProfileId) {
        await supabase
          .from('judge_notifications')
          .update({ is_read: true })
          .eq('judge_profile_id', judgeProfileId)
          .eq('is_read', false);
      }

      // Mark competitor notifications as read
      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('user_id', userId);

      if (registrations && registrations.length > 0) {
        const regIds = registrations.map(r => r.id);
        await supabase
          .from('competitor_notifications')
          .update({ is_read: true })
          .in('registration_id', regIds)
          .eq('is_read', false);
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: "Success", description: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading notifications...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Stay updated with your tournament activity
          </CardDescription>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No notifications yet</p>
            <p className="text-sm mt-2">You'll be notified when pairings are released or results are published</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={`${notification.source}-${notification.id}`}
                className={`p-4 rounded-lg border transition-colors ${
                  !notification.is_read ? 'bg-muted/30 border-primary/20' : 'bg-background'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.source === 'judge' ? (
                        <Badge variant="outline" className="text-xs">
                          <Gavel className="h-3 w-3 mr-1" />
                          Judge
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Competitor
                        </Badge>
                      )}
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.tournament_id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/tournaments/${notification.tournament_id}/postings`}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    )}
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
