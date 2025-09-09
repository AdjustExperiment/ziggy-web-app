
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Smartphone } from 'lucide-react';

interface PaymentButtonsProps {
  amount: number;
  currency?: string;
  onPayPalPayment: () => Promise<void>;
  onVenmoPayment: () => Promise<void>;
  disabled?: boolean;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const PaymentButtons = ({ amount, currency = 'USD', onPayPalPayment, onVenmoPayment, disabled = false }: PaymentButtonsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Registration Fee</p>
            <p className="text-2xl font-bold">
              {currencySymbols[currency] || ''}{amount.toFixed(2)}{currency !== 'USD' ? ` ${currency}` : ''}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={onPayPalPayment}
            disabled={disabled}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay with PayPal
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
          
          <Button
            onClick={onVenmoPayment}
            disabled={disabled}
            variant="outline"
            className="w-full border-2 border-blue-500 text-blue-500 hover:bg-blue-50"
            size="lg"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Pay with Venmo
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center mt-4">
          Your payment information is secure and encrypted. Registration will be confirmed upon successful payment.
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentButtons;
