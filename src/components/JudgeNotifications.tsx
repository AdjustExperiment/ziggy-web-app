
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Users, Gavel, CheckCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface JudgeNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  pairing_id: string | null;
  tournament_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface JudgeNotificationsProps {
  judgeProfileId: string;
}

export default function JudgeNotifications({ judgeProfileId }: JudgeNotificationsProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<JudgeNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Use realtime notifications hook
  const { counts } = useRealtimeNotifications({ judgeProfileId });

  useEffect(() => {
    fetchNotifications();
  }, [judgeProfileId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('judge_notifications')
        .select('*')
        .eq('judge_profile_id', judgeProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('judge_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('judge_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'judge_assigned':
      case 'new_assignment':
        return <Gavel className="h-5 w-5 text-primary" />;
      case 'schedule_change':
      case 'schedule_approved':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'pairing_chat':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'ballot_reminder':
        return <Bell className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'judge_assigned':
      case 'new_assignment': 
        return 'default';
      case 'schedule_change':
      case 'schedule_approved': 
        return 'secondary';
      case 'pairing_chat': 
        return 'outline';
      case 'ballot_reminder': 
        return 'destructive';
      default: 
        return 'secondary';
    }
  };

  const unreadCount = counts.unreadJudgeNotifications;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Judge Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Stay updated on your judging assignments and tournament communications
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="mr-2">
              {unreadCount} unread
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
            <p className="text-muted-foreground">
              You'll receive notifications here about judging assignments, schedule changes, and other tournament updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all hover:shadow-md ${
                !notification.is_read ? 'ring-2 ring-primary/20 bg-primary/5' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {notification.title}
                        {!notification.is_read && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {new Date(notification.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getNotificationTypeColor(notification.type)} className="text-xs">
                      {notification.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm mb-4">{notification.message}</p>
                
                <div className="flex gap-2">
                  {notification.pairing_id && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/pairings/${notification.pairing_id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Pairing
                      </Link>
                    </Button>
                  )}
                  
                  {notification.tournament_id && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/tournaments/${notification.tournament_id}/postings`}>
                        <Users className="h-4 w-4 mr-2" />
                        Tournament Postings
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
