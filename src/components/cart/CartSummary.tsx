import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tag, Users, DollarSign } from 'lucide-react';
import { CartSummary as CartSummaryType, GroupDiscountRule } from '@/hooks/useRegistrationCart';

interface CartSummaryProps {
  summary: CartSummaryType;
  currency?: string;
  nextGroupDiscount?: GroupDiscountRule | null;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

export function CartSummary({ summary, currency = 'USD', nextGroupDiscount }: CartSummaryProps) {
  const symbol = currencySymbols[currency] || '$';

  const formatPrice = (amount: number) => {
    return `${symbol}${amount.toFixed(2)}`;
  };

  const getGroupDiscountLabel = (rule: GroupDiscountRule) => {
    if (rule.discount_type === 'percent') {
      return `${rule.discount_value}% group discount`;
    } else if (rule.discount_type === 'fixed') {
      return `${formatPrice(rule.discount_value)} group discount`;
    } else {
      return `${formatPrice(rule.discount_value)} off per person`;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({summary.itemCount} {summary.itemCount === 1 ? 'registration' : 'registrations'})
            </span>
            <span>{formatPrice(summary.subtotal)}</span>
          </div>

          {summary.promoDiscounts > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Promo Discounts
              </span>
              <span>-{formatPrice(summary.promoDiscounts)}</span>
            </div>
          )}

          {summary.groupDiscount > 0 && summary.groupDiscountRule && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {getGroupDiscountLabel(summary.groupDiscountRule)}
              </span>
              <span>-{formatPrice(summary.groupDiscount)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatPrice(summary.total)}</span>
        </div>

        {/* Show next group discount tier if applicable */}
        {nextGroupDiscount && summary.itemCount < nextGroupDiscount.min_registrations && (
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              Add {nextGroupDiscount.min_registrations - summary.itemCount} more {
                nextGroupDiscount.min_registrations - summary.itemCount === 1 ? 'registration' : 'registrations'
              } to unlock{' '}
              <span className="font-medium text-foreground">
                {nextGroupDiscount.discount_type === 'percent' 
                  ? `${nextGroupDiscount.discount_value}% off` 
                  : `${formatPrice(nextGroupDiscount.discount_value)} off`}
              </span>
            </p>
          </div>
        )}

        {summary.groupDiscountRule && (
          <Badge variant="secondary" className="w-full justify-center py-2">
            <Users className="h-3 w-3 mr-1" />
            Group discount applied!
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
