import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { CartSummary as CartSummaryType } from '@/hooks/useRegistrationCart';

interface PayPalCheckoutProps {
  cartId: string;
  summary: CartSummaryType;
  currency?: string;
  onSuccess: (captureData: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

export function PayPalCheckout({
  cartId,
  summary,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel
}: PayPalCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paypalNotConfigured, setPaypalNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const symbol = currencySymbols[currency] || '$';

  const createOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('paypal-create-order', {
        body: { cart_id: cartId }
      });

      if (fnError) throw fnError;

      if (data.not_configured) {
        setPaypalNotConfigured(true);
        setError('PayPal is not configured. Please contact the administrator.');
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setOrderId(data.order_id);
      
      // Open PayPal in new window
      const paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.order_id}`;
      window.open(paypalUrl, 'paypal_checkout', 'width=500,height=700');

      toast({
        title: "PayPal Checkout",
        description: "Complete your payment in the PayPal window. Return here after payment.",
      });

    } catch (err: any) {
      console.error('Error creating PayPal order:', err);
      setError(err.message || 'Failed to create PayPal order');
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const captureOrder = async () => {
    if (!orderId) {
      toast({
        title: "No order to capture",
        description: "Please create an order first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('paypal-capture-order', {
        body: { 
          order_id: orderId,
          cart_id: cartId 
        }
      });

      if (fnError) throw fnError;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Payment Successful!",
        description: `${data.registrations_created} registration(s) created successfully.`,
      });

      onSuccess(data);

    } catch (err: any) {
      console.error('Error capturing PayPal order:', err);
      setError(err.message || 'Failed to capture payment');
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (paypalNotConfigured) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              PayPal checkout is not yet configured. Please contact the tournament administrator for payment instructions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pay with PayPal
        </CardTitle>
        <CardDescription>
          Secure checkout powered by PayPal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount</span>
            <span>{symbol}{summary.total.toFixed(2)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {summary.itemCount} {summary.itemCount === 1 ? 'registration' : 'registrations'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Flow */}
        {!orderId ? (
          <Button
            className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
            size="lg"
            onClick={createOrder}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Preparing Checkout...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue to PayPal
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Order created! Complete your payment in the PayPal window, then click the button below.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full"
              size="lg"
              onClick={captureOrder}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I've Completed Payment
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setOrderId(null);
                onCancel?.();
              }}
            >
              Cancel & Start Over
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          You will be redirected to PayPal to complete your payment securely.
          Your payment information is never stored on our servers.
        </p>
      </CardContent>
    </Card>
  );
}
