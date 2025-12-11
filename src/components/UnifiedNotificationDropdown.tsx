import React, { useState } from 'react';
import { Bell, Check, X, Shield, Gavel, Users, ExternalLink, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUnifiedNotifications, NotificationSource, UnifiedNotification } from '@/hooks/useUnifiedNotifications';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { formatDistanceToNow } from 'date-fns';

const getSourceIcon = (source: NotificationSource) => {
  switch (source) {
    case 'admin':
      return <Shield className="h-3 w-3 text-destructive" />;
    case 'judge':
      return <Gavel className="h-3 w-3 text-primary" />;
    case 'competitor':
      return <Users className="h-3 w-3 text-secondary-foreground" />;
  }
};

const getSourceLabel = (source: NotificationSource) => {
  switch (source) {
    case 'admin':
      return 'Admin';
    case 'judge':
      return 'Judge';
    case 'competitor':
      return 'Debater';
  }
};

const getSourceBadgeClass = (source: NotificationSource) => {
  switch (source) {
    case 'admin':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'judge':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'competitor':
      return 'bg-secondary text-secondary-foreground border-secondary';
  }
};

const getPriorityIcon = (type: string, priority?: string) => {
  switch (type) {
    case 'tournament_completed':
    case 'payment_received':
    case 'financial_milestone':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'system_alert':
      return priority === 'high' || priority === 'urgent'
        ? <AlertTriangle className="h-4 w-4 text-destructive" />
        : <AlertCircle className="h-4 w-4 text-warning" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
};

const getPriorityBorderClass = (priority?: string, isRead?: boolean) => {
  if (isRead) return 'border-l-2 border-l-transparent';
  switch (priority) {
    case 'urgent':
      return 'border-l-4 border-l-destructive';
    case 'high':
      return 'border-l-4 border-l-destructive/60';
    case 'medium':
      return 'border-l-4 border-l-warning';
    default:
      return 'border-l-2 border-l-primary/30';
  }
};

export function UnifiedNotificationDropdown() {
  const { user, isAdmin } = useOptimizedAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useUnifiedNotifications();
  const [filter, setFilter] = useState<'all' | NotificationSource>('all');
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.source === filter);

  const handleNotificationClick = (notification: UnifiedNotification) => {
    if (!notification.is_read) {
      markAsRead(notification);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 text-xs min-w-[1.25rem] h-5 flex items-center justify-center px-1 animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0 bg-background/95 backdrop-blur-lg border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-2 py-2 border-b">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="w-full h-8">
              <TabsTrigger value="all" className="text-xs flex-1">All</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin" className="text-xs flex-1">Admin</TabsTrigger>}
              <TabsTrigger value="judge" className="text-xs flex-1">Judge</TabsTrigger>
              <TabsTrigger value="competitor" className="text-xs flex-1">Debater</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={`${notification.source}-${notification.id}`}
                  className={`p-3 rounded-md cursor-pointer transition-all hover:bg-muted/50 ${
                    !notification.is_read ? 'bg-muted/20' : 'opacity-70'
                  } ${getPriorityBorderClass(notification.priority, notification.is_read)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {notification.source === 'admin'
                        ? getPriorityIcon(notification.type, notification.priority)
                        : getSourceIcon(notification.source)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getSourceBadgeClass(notification.source)}`}>
                          {getSourceLabel(notification.source)}
                        </Badge>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                        {notification.priority && notification.source === 'admin' && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {notification.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {notification.action_text && notification.action_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 text-[10px] px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                          >
                            {notification.action_text}
                            <ExternalLink className="h-2.5 w-2.5 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      {notification.source === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-primary"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/dashboard';
                }}
              >
                View all in Dashboard
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
