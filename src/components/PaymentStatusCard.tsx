import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PaymentStatusCardProps {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amountDue: number;
  amountPaid: number;
  currency?: string;
  paymentReference?: string;
  paypalLink?: string;
  venmoLink?: string;
  onMarkAsPaid?: () => void;
  isAdmin?: boolean;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    variant: 'secondary' as const,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
  },
  processing: {
    icon: Clock,
    label: 'Processing',
    variant: 'secondary' as const,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  completed: {
    icon: CheckCircle,
    label: 'Paid',
    variant: 'default' as const,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    variant: 'destructive' as const,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10'
  },
  refunded: {
    icon: AlertCircle,
    label: 'Refunded',
    variant: 'outline' as const,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
};

export function PaymentStatusCard({
  status,
  amountDue,
  amountPaid,
  currency = 'USD',
  paymentReference,
  paypalLink,
  venmoLink,
  onMarkAsPaid,
  isAdmin = false
}: PaymentStatusCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const balance = amountDue - amountPaid;
  const symbol = currencySymbols[currency] || '';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Card className={`border-2 ${status === 'completed' ? 'border-green-500/30' : status === 'pending' ? 'border-yellow-500/30' : 'border-border'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            Payment Status
          </CardTitle>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount breakdown */}
        <div className={`rounded-lg p-4 ${config.bgColor}`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Due</p>
              <p className="text-lg font-semibold">{symbol}{amountDue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Paid</p>
              <p className="text-lg font-semibold text-green-600">{symbol}{amountPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
              <p className={`text-lg font-semibold ${balance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {symbol}{balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment reference */}
        {paymentReference && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Reference</p>
              <p className="font-mono text-sm">{paymentReference}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(paymentReference, 'Reference')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Copy amount button for pending payments */}
        {status === 'pending' && balance > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Copy amount for payment:
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => copyToClipboard(balance.toFixed(2), 'Amount')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy {symbol}{balance.toFixed(2)}
            </Button>
          </div>
        )}

        {/* Payment links for pending */}
        {status === 'pending' && (paypalLink || venmoLink) && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pay Now:</p>
            <div className="flex gap-2">
              {paypalLink && (
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open(paypalLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  PayPal
                </Button>
              )}
              {venmoLink && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-blue-500 text-blue-600"
                  onClick={() => window.open(venmoLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Venmo
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Admin mark as paid */}
        {isAdmin && status === 'pending' && onMarkAsPaid && (
          <Button 
            className="w-full" 
            onClick={onMarkAsPaid}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Paid
          </Button>
        )}

        {/* Status messages */}
        {status === 'completed' && (
          <p className="text-sm text-green-600 text-center">
            ✓ Payment received. Your registration is confirmed!
          </p>
        )}
        {status === 'pending' && (
          <p className="text-xs text-muted-foreground text-center">
            Complete payment to confirm your registration.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
