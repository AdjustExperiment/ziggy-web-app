import { Calendar, Lock, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RoundEmptyStateProps {
  status: 'no_rounds' | 'unpublished' | 'no_permission' | 'loading';
  isAdmin?: boolean;
  unreleasedCount?: number;
  onAdminAction?: () => void;
}

export default function RoundEmptyState({ 
  status, 
  isAdmin = false, 
  unreleasedCount = 0,
  onAdminAction 
}: RoundEmptyStateProps) {
  const configs = {
    no_rounds: {
      icon: Calendar,
      title: 'No Rounds Available',
      description: 'Rounds haven\'t been created for this tournament yet.',
      adminAction: null
    },
    unpublished: {
      icon: Lock,
      title: 'Rounds Exist But Not Published',
      description: `${unreleasedCount} round${unreleasedCount !== 1 ? 's have' : ' has'} been created but ${unreleasedCount !== 1 ? 'are' : 'is'} not yet released to participants.`,
      adminAction: 'View All Rounds'
    },
    no_permission: {
      icon: Shield,
      title: 'Access Restricted',
      description: 'You don\'t have permission to view pairings for this tournament.',
      adminAction: null
    },
    loading: {
      icon: Clock,
      title: 'Loading Rounds...',
      description: 'Please wait while we fetch the round information.',
      adminAction: null
    }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="text-center py-12">
        <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {config.description}
        </p>
        {isAdmin && config.adminAction && onAdminAction && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onAdminAction}
          >
            {config.adminAction}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
