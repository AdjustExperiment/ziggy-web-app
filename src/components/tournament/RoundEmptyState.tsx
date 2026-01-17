import { Calendar, Lock, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

interface RoundEmptyStateProps {
  status: 'no_rounds' | 'unpublished' | 'no_permission' | 'loading';
  isAdmin?: boolean;
  unreleasedCount?: number;
  onAdminAction?: () => void;
}

const statusConfigs = {
  no_rounds: {
    icon: Calendar,
    title: 'No Rounds Available',
    description: "Rounds haven't been created for this tournament yet.",
    adminActionLabel: null,
    variant: 'no_data' as const
  },
  unpublished: {
    icon: Lock,
    title: 'Rounds Exist But Not Published',
    description: '', // Dynamic, set below
    adminActionLabel: 'View All Rounds',
    variant: 'no_data' as const
  },
  no_permission: {
    icon: Shield,
    title: 'Access Restricted',
    description: "You don't have permission to view pairings for this tournament.",
    adminActionLabel: null,
    variant: 'not_authorized' as const
  },
  loading: {
    icon: Clock,
    title: 'Loading Rounds...',
    description: 'Please wait while we fetch the round information.',
    adminActionLabel: null,
    variant: 'loading' as const
  }
};

export default function RoundEmptyState({ 
  status, 
  isAdmin = false, 
  unreleasedCount = 0,
  onAdminAction 
}: RoundEmptyStateProps) {
  const config = statusConfigs[status];
  
  // Dynamic description for 'unpublished' status
  const description = status === 'unpublished'
    ? `${unreleasedCount} round${unreleasedCount !== 1 ? 's have' : ' has'} been created but ${unreleasedCount !== 1 ? 'are' : 'is'} not yet released to participants.`
    : config.description;

  // Build action element if admin and action is available
  const actionElement = isAdmin && config.adminActionLabel && onAdminAction ? (
    <Button variant="outline" onClick={onAdminAction}>
      {config.adminActionLabel}
    </Button>
  ) : undefined;

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={description}
      variant={config.variant}
      action={actionElement}
    />
  );
}
