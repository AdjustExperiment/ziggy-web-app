import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'no_data' | 'not_authorized' | 'error' | 'loading';
  className?: string;
}

const variantStyles = {
  no_data: 'text-muted-foreground',
  not_authorized: 'text-yellow-500',
  error: 'text-destructive',
  loading: 'text-primary animate-pulse'
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'no_data',
  className = ''
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className={`h-12 w-12 mb-4 opacity-50 ${variantStyles[variant]}`} />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-4">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
