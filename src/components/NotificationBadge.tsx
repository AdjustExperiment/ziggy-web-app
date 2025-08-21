
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface NotificationBadgeProps {
  judgeProfileId?: string;
  tournamentId?: string;
  userId?: string;
  showJudgeNotifications?: boolean;
  showAdminNotifications?: boolean;
}

export function NotificationBadge({ 
  judgeProfileId, 
  tournamentId, 
  userId,
  showJudgeNotifications = false,
  showAdminNotifications = false
}: NotificationBadgeProps) {
  const { counts } = useRealtimeNotifications({ 
    judgeProfileId, 
    tournamentId, 
    userId 
  });

  let totalCount = 0;
  
  if (showJudgeNotifications) {
    totalCount += counts.unreadJudgeNotifications;
  }
  
  if (showAdminNotifications) {
    totalCount += counts.pendingRequests + counts.pendingProposals;
  }

  if (totalCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className="ml-2 text-xs min-w-[1.25rem] h-5 flex items-center justify-center px-1"
    >
      {totalCount > 99 ? '99+' : totalCount}
    </Badge>
  );
}
