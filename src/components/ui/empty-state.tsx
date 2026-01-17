import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Main title text */
  title: string;
  /** Description/subtitle text */
  description: string;
  /** 
   * Optional action element - can be a Button, Link, or any ReactNode.
   * For navigation actions, use: <Button asChild><Link to="/path">Label</Link></Button>
   */
  action?: React.ReactNode;
  /** Visual variant affecting icon color */
  variant?: 'no_data' | 'not_authorized' | 'error' | 'loading';
  /** Additional CSS classes */
  className?: string;
  /** Whether to render inside a Card (default: true) */
  withCard?: boolean;
}

const variantStyles = {
  no_data: 'text-muted-foreground',
  not_authorized: 'text-yellow-500',
  error: 'text-destructive',
  loading: 'text-primary animate-pulse'
};

/**
 * EmptyState - Consistent empty state component for "no data" scenarios
 * 
 * @example
 * // Basic usage
 * <EmptyState
 *   icon={Trophy}
 *   title="No Tournaments Yet"
 *   description="You haven't registered for any tournaments."
 *   action={<Button asChild><Link to="/tournaments">Browse Tournaments</Link></Button>}
 * />
 * 
 * @example
 * // Without card wrapper (for use inside existing cards)
 * <EmptyState
 *   icon={Users}
 *   title="No Pairings"
 *   description="Pairings haven't been released yet."
 *   withCard={false}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'no_data',
  className,
  withCard = true
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className={cn('h-12 w-12 mb-4 opacity-50', variantStyles[variant])} />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-4">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );

  if (!withCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={className}>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
