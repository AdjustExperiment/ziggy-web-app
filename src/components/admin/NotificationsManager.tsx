import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Trash2, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const getNotificationIcon = (type: string, priority: string) => {
  switch (type) {
    case 'tournament_completed':
      return <CheckCircle className="h-5 w-5 text-success" />;
    case 'registration_closed':
      return <Info className="h-5 w-5 text-primary" />;
    case 'payment_received':
      return <CheckCircle className="h-5 w-5 text-success" />;
    case 'new_user':
      return <Info className="h-5 w-5 text-primary" />;
    case 'financial_milestone':
      return <CheckCircle className="h-5 w-5 text-success" />;
    case 'system_alert':
      return priority === 'high' || priority === 'urgent' 
        ? <AlertTriangle className="h-5 w-5 text-destructive" />
        : <AlertCircle className="h-5 w-5 text-warning" />;
    default:
      return <Info className="h-5 w-5 text-primary" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-destructive text-destructive-foreground';
    case 'high':
      return 'bg-destructive/80 text-destructive-foreground';
    case 'medium':
      return 'bg-warning text-warning-foreground';
    case 'low':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const NotificationsManager = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useNotifications();
  const [generatingFinancials, setGeneratingFinancials] = useState(false);
  const { toast } = useToast();

  const generateFinancialNotifications = async () => {
    setGeneratingFinancials(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-financial-notifications');
      
      if (error) throw error;

      toast({
        title: 'Success',
        description: `Generated ${data.notifications_created} financial notifications`,
      });
      
      refreshNotifications();
    } catch (error) {
      console.error('Error generating financial notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate financial notifications',
        variant: 'destructive',
      });
    } finally {
      setGeneratingFinancials(false);
    }
  };

  const filterNotifications = (type?: string) => {
    if (!type) return notifications;
    return notifications.filter(n => n.type === type);
  };

  const notificationTypes = [
    { label: 'All', value: '' },
    { label: 'Tournament Completed', value: 'tournament_completed' },
    { label: 'Registration Closed', value: 'registration_closed' },
    { label: 'Payment Received', value: 'payment_received' },
    { label: 'New User', value: 'new_user' },
    { label: 'Financial Milestone', value: 'financial_milestone' },
    { label: 'System Alert', value: 'system_alert' },
    { label: 'General', value: 'general' },
  ];

  const [selectedType, setSelectedType] = useState('');

  const filteredNotifications = filterNotifications(selectedType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Center</h2>
          <p className="text-muted-foreground">
            Manage and view all admin notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary">
                {unreadCount} unread
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateFinancialNotifications}
            disabled={generatingFinancials}
          >
            {generatingFinancials ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Generate Financial Alerts
          </Button>
          
          <Button
            variant="outline"
            onClick={refreshNotifications}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <EyeOff className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filter Notifications</CardTitle>
            <div className="flex flex-wrap gap-2">
              {notificationTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                >
                  {type.label}
                  {type.value && (
                    <Badge variant="secondary" className="ml-2">
                      {filterNotifications(type.value).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
          <CardDescription>
            {selectedType 
              ? `Showing ${notificationTypes.find(t => t.value === selectedType)?.label.toLowerCase()} notifications`
              : 'Showing all notifications'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      notification.is_read ? 'opacity-70 bg-muted/20' : 'bg-background'
                    } ${notification.priority === 'urgent' ? 'border-destructive border-l-4' : 
                        notification.priority === 'high' ? 'border-destructive/60 border-l-4' : 
                        notification.priority === 'medium' ? 'border-warning border-l-4' : 
                        'border-border'}`}>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-medium text-foreground">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                disabled={notification.is_read}
                              >
                                {notification.is_read ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatDistanceToNow(new Date(notification.created_at))} ago</span>
                              <Badge variant="outline" className="text-xs">
                                {notification.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            {notification.action_text && notification.action_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!notification.is_read) {
                                    markAsRead(notification.id);
                                  }
                                  window.location.href = notification.action_url;
                                }}
                              >
                                {notification.action_text}
                              </Button>
                            )}
                          </div>
                          
                          {notification.metadata && (
                            <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                              <pre className="whitespace-pre-wrap text-muted-foreground">
                                {JSON.stringify(notification.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {index < filteredNotifications.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};