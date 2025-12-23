import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartItem as CartItemType, CartSummary as CartSummaryType, GroupDiscountRule } from '@/hooks/useRegistrationCart';

interface RegistrationCartProps {
  items: CartItemType[];
  summary: CartSummaryType;
  groupDiscountRules: GroupDiscountRule[];
  currency?: string;
  onRemoveItem: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
  isLoading?: boolean;
}

export function RegistrationCart({
  items,
  summary,
  groupDiscountRules,
  currency = 'USD',
  onRemoveItem,
  onEditItem,
  onCheckout,
  onClearCart,
  isLoading
}: RegistrationCartProps) {
  // Find next applicable group discount
  const nextGroupDiscount = groupDiscountRules.find(
    rule => rule.min_registrations > items.length
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground">
            Add registrations using the form above
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Registration Cart
            </CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? 'registration' : 'registrations'}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearCart}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => (
            <CartItem
              key={item.id}
              item={item}
              currency={currency}
              onRemove={onRemoveItem}
              onEdit={onEditItem}
            />
          ))}
        </CardContent>
      </Card>

      <CartSummary 
        summary={summary} 
        currency={currency}
        nextGroupDiscount={nextGroupDiscount}
      />

      <Button 
        className="w-full" 
        size="lg"
        onClick={onCheckout}
        disabled={isLoading}
      >
        Proceed to Checkout
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
