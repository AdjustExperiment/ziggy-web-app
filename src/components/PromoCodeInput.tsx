
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PromoCodeInputProps {
  tournamentId: string;
  originalAmount: number;
  onDiscountApplied: (discount: number, promoCode: string) => void;
}

export default function PromoCodeInput({ tournamentId, originalAmount, onDiscountApplied }: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [validationState, setValidationState] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
    discount?: number;
  }>({ status: 'idle' });
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    setValidationState({ status: 'checking' });

    try {
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: {
          code: promoCode.toUpperCase(),
          tournament_id: tournamentId,
          registration_amount: originalAmount
        }
      });

      if (error) throw error;

      if (data.valid) {
        const discount = data.discount_amount;
        setValidationState({ 
          status: 'valid', 
          message: `${data.discount_type === 'percent' ? data.discount_value + '%' : '$' + data.discount_value} discount applied!`,
          discount 
        });
        setAppliedDiscount({ code: promoCode.toUpperCase(), discount });
        onDiscountApplied(discount, promoCode.toUpperCase());
      } else {
        setValidationState({ 
          status: 'invalid', 
          message: data.message || 'Invalid promo code' 
        });
        setAppliedDiscount(null);
        onDiscountApplied(0, '');
      }
    } catch (error: any) {
      setValidationState({ 
        status: 'invalid', 
        message: 'Failed to validate promo code. Please try again.' 
      });
      setAppliedDiscount(null);
      onDiscountApplied(0, '');
    }
  };

  const clearPromoCode = () => {
    setPromoCode('');
    setValidationState({ status: 'idle' });
    setAppliedDiscount(null);
    onDiscountApplied(0, '');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <Label htmlFor="promo-code">Promo Code (Optional)</Label>
      </div>

      {!appliedDiscount ? (
        <div className="flex gap-2">
          <Input
            id="promo-code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="uppercase"
            onKeyPress={(e) => e.key === 'Enter' && validatePromoCode()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={validatePromoCode}
            disabled={!promoCode.trim() || validationState.status === 'checking'}
          >
            {validationState.status === 'checking' ? 'Checking...' : 'Apply'}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <Badge variant="secondary" className="font-mono">
              {appliedDiscount.code}
            </Badge>
            <span className="text-sm text-green-700">
              ${appliedDiscount.discount.toFixed(2)} discount applied
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPromoCode}
          >
            Remove
          </Button>
        </div>
      )}

      {validationState.status === 'invalid' && validationState.message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationState.message}</AlertDescription>
        </Alert>
      )}

      {validationState.status === 'valid' && validationState.message && !appliedDiscount && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{validationState.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
