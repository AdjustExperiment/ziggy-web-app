import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, User, Users, Tag, Mail } from 'lucide-react';
import { CartItem as CartItemType } from '@/hooks/useRegistrationCart';

interface CartItemProps {
  item: CartItemType;
  currency?: string;
  onRemove: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

export function CartItem({ item, currency = 'USD', onRemove, onEdit }: CartItemProps) {
  const symbol = currencySymbols[currency] || '$';
  const finalPrice = Math.max(0, item.base_price - (item.discount_amount || 0));

  return (
    <Card className="relative group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {item.registrant_type === 'self' ? (
                <User className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Users className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{item.participant_name}</span>
              {item.registrant_type === 'other' && (
                <Badge variant="outline" className="text-xs">
                  Registering for someone else
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              {item.participant_email}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {item.role === 'competitor' ? 'Competitor' : 'Judge'}
              </Badge>
              {item.partner_name && (
                <Badge variant="outline">
                  Partner: {item.partner_name}
                </Badge>
              )}
              {item.school_organization && (
                <Badge variant="outline">
                  {item.school_organization}
                </Badge>
              )}
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="font-semibold">
              {item.discount_amount > 0 ? (
                <div className="space-y-1">
                  <span className="line-through text-muted-foreground text-sm">
                    {symbol}{item.base_price.toFixed(2)}
                  </span>
                  <div className="text-green-600">
                    {symbol}{finalPrice.toFixed(2)}
                  </div>
                </div>
              ) : (
                <span>{symbol}{item.base_price.toFixed(2)}</span>
              )}
            </div>

            {item.discount_amount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                -{symbol}{item.discount_amount.toFixed(2)}
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
