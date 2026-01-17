import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw, Info, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ErrorCode = 
  | 'ERR_ROUND_MISSING'
  | 'ERR_NO_JUDGES'
  | 'ERR_NO_TEAMS'
  | 'ERR_RLS_DENIED'
  | 'ERR_API_FAILED'
  | 'ERR_NO_DATA'
  | 'ERR_NO_PAIRINGS'
  | 'ERR_NO_BALLOTS'
  | 'ERR_NO_SPONSORS'
  | 'ERR_PERMISSION_DENIED'
  | 'ERR_NETWORK'
  | 'ERR_UNKNOWN';

interface ErrorDisplayProps {
  errorCode: ErrorCode;
  message: string;
  details?: string;
  retryAction?: () => void;
  className?: string;
  variant?: 'error' | 'warning' | 'info' | 'empty';
}

const errorCodeLabels: Record<ErrorCode, { label: string; defaultMessage: string }> = {
  ERR_ROUND_MISSING: { label: 'Missing Rounds', defaultMessage: 'No rounds have been created yet' },
  ERR_NO_JUDGES: { label: 'No Judges', defaultMessage: 'No judges are registered for this tournament' },
  ERR_NO_TEAMS: { label: 'No Teams', defaultMessage: 'No teams have registered yet' },
  ERR_RLS_DENIED: { label: 'Access Denied', defaultMessage: 'You do not have permission to view this data' },
  ERR_API_FAILED: { label: 'Server Error', defaultMessage: 'Failed to load data from server' },
  ERR_NO_DATA: { label: 'No Data', defaultMessage: 'No data available to display' },
  ERR_NO_PAIRINGS: { label: 'No Pairings', defaultMessage: 'No pairings have been generated for this round' },
  ERR_NO_BALLOTS: { label: 'No Ballots', defaultMessage: 'No ballots have been submitted yet' },
  ERR_NO_SPONSORS: { label: 'No Sponsors', defaultMessage: 'No sponsors are linked to this tournament' },
  ERR_PERMISSION_DENIED: { label: 'Permission Denied', defaultMessage: 'You do not have access to this resource' },
  ERR_NETWORK: { label: 'Network Error', defaultMessage: 'Unable to connect to the server' },
  ERR_UNKNOWN: { label: 'Error', defaultMessage: 'An unexpected error occurred' },
};

export function ErrorDisplay({ 
  errorCode, 
  message, 
  details, 
  retryAction,
  className,
  variant = 'empty'
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const errorInfo = errorCodeLabels[errorCode] || errorCodeLabels.ERR_UNKNOWN;

  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <XCircle className="h-12 w-12 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      case 'info':
        return <Info className="h-12 w-12 text-blue-500" />;
      case 'empty':
      default:
        return <AlertCircle className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case 'error':
        return 'bg-destructive/5 border-destructive/20';
      case 'warning':
        return 'bg-yellow-500/5 border-yellow-500/20';
      case 'info':
        return 'bg-blue-500/5 border-blue-500/20';
      case 'empty':
      default:
        return 'bg-muted/30 border-border';
    }
  };

  return (
    <Card className={cn('border', getBgColor(), className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {getIcon()}
        
        <h3 className="mt-4 text-lg font-semibold">{message || errorInfo.defaultMessage}</h3>
        
        <Badge variant="outline" className="mt-2 font-mono text-xs">
          {errorCode}
        </Badge>
        
        {details && (
          <div className="mt-4 w-full max-w-md">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-muted-foreground"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show Details
                </>
              )}
            </Button>
            
            {showDetails && (
              <pre className="mt-2 p-3 bg-muted/50 rounded-md text-xs text-left overflow-auto max-h-32 text-muted-foreground">
                {details}
              </pre>
            )}
          </div>
        )}
        
        {retryAction && (
          <Button 
            variant="outline" 
            onClick={retryAction}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * @deprecated Use `EmptyState` from `@/components/ui/empty-state` instead.
 * This simple version is kept for backward compatibility with existing code.
 */
interface SimpleEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * @deprecated Use `EmptyState` from `@/components/ui/empty-state` instead.
 */
export function SimpleEmptyState({ icon, title, description, action, className }: SimpleEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon || <AlertCircle className="h-12 w-12 text-muted-foreground" />}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
