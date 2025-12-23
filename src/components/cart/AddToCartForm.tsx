import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, Loader2, Plus } from 'lucide-react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import PromoCodeInput from '@/components/PromoCodeInput';

interface TournamentEvent {
  id: string;
  name: string;
  short_code: string;
}

interface AddToCartFormProps {
  tournamentId: string;
  registrationFee: number;
  events?: TournamentEvent[];
  currency?: string;
  onAddItem: (item: {
    registrant_type: 'self' | 'other';
    participant_name: string;
    participant_email: string;
    partner_name?: string;
    partner_email?: string;
    school_organization?: string;
    event_id?: string;
    role: 'competitor' | 'judge';
    base_price: number;
    promo_code_id?: string;
    discount_amount?: number;
    additional_info?: Record<string, any>;
  }) => Promise<any>;
  isLoading?: boolean;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

export function AddToCartForm({ 
  tournamentId, 
  registrationFee, 
  events = [], 
  currency = 'USD',
  onAddItem,
  isLoading 
}: AddToCartFormProps) {
  const { user } = useOptimizedAuth();
  const symbol = currencySymbols[currency] || '$';

  const [registrantType, setRegistrantType] = useState<'self' | 'other'>('self');
  const [role, setRole] = useState<'competitor' | 'judge'>('competitor');
  const [formData, setFormData] = useState({
    participantName: '',
    participantEmail: '',
    partnerName: '',
    partnerEmail: '',
    schoolOrganization: '',
    eventId: ''
  });
  const [discount, setDiscount] = useState<{ amount: number; promoCodeId?: string }>({ amount: 0 });
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill for self registration
  React.useEffect(() => {
    if (registrantType === 'self' && user) {
      setFormData(prev => ({
        ...prev,
        participantEmail: user.email || ''
      }));
    }
  }, [registrantType, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onAddItem({
        registrant_type: registrantType,
        participant_name: formData.participantName,
        participant_email: formData.participantEmail,
        partner_name: formData.partnerName || undefined,
        partner_email: formData.partnerEmail || undefined,
        school_organization: formData.schoolOrganization || undefined,
        event_id: formData.eventId || undefined,
        role,
        base_price: registrationFee,
        promo_code_id: discount.promoCodeId,
        discount_amount: discount.amount
      });

      // Reset form for next entry
      setFormData({
        participantName: '',
        participantEmail: registrantType === 'self' ? (user?.email || '') : '',
        partnerName: '',
        partnerEmail: '',
        schoolOrganization: '',
        eventId: ''
      });
      setDiscount({ amount: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromoDiscount = (discountAmount: number, promoCode: string, promoCodeId?: string) => {
    setDiscount({ amount: discountAmount, promoCodeId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Registration
        </CardTitle>
        <CardDescription>
          Register yourself or someone else for this tournament
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Registrant Type Tabs */}
          <Tabs value={registrantType} onValueChange={(v) => setRegistrantType(v as 'self' | 'other')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="self" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Register Myself
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Register Someone Else
              </TabsTrigger>
            </TabsList>

            <TabsContent value="self" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="self-name">Your Name *</Label>
                  <Input
                    id="self-name"
                    value={formData.participantName}
                    onChange={(e) => setFormData(prev => ({ ...prev, participantName: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="self-email">Your Email *</Label>
                  <Input
                    id="self-email"
                    type="email"
                    value={formData.participantEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, participantEmail: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4 mt-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground mb-4">
                The person you register will receive an email to claim their account and access their tournament dashboard.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="other-name">Their Name *</Label>
                  <Input
                    id="other-name"
                    value={formData.participantName}
                    onChange={(e) => setFormData(prev => ({ ...prev, participantName: e.target.value }))}
                    placeholder="Enter their full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other-email">Their Email *</Label>
                  <Input
                    id="other-email"
                    type="email"
                    value={formData.participantEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, participantEmail: e.target.value }))}
                    placeholder="their@email.com"
                    required
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Role *</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as 'competitor' | 'judge')} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="competitor" id="role-competitor" />
                <Label htmlFor="role-competitor" className="cursor-pointer">Competitor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="judge" id="role-judge" />
                <Label htmlFor="role-judge" className="cursor-pointer">Judge</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Event Selection */}
          {events.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="event">Event/Format</Label>
              <Select 
                value={formData.eventId} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, eventId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} ({event.short_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Additional Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="school">School/Organization</Label>
              <Input
                id="school"
                value={formData.schoolOrganization}
                onChange={(e) => setFormData(prev => ({ ...prev, schoolOrganization: e.target.value }))}
                placeholder="Enter school or organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner">Partner Name (if applicable)</Label>
              <Input
                id="partner"
                value={formData.partnerName}
                onChange={(e) => setFormData(prev => ({ ...prev, partnerName: e.target.value }))}
                placeholder="Enter partner's name"
              />
            </div>
          </div>

          {/* Promo Code */}
          <PromoCodeInput
            tournamentId={tournamentId}
            originalAmount={registrationFee}
            onDiscountApplied={handlePromoDiscount}
          />

          {/* Price Display */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span>Registration Fee</span>
              <div className="text-right">
                {discount.amount > 0 ? (
                  <div className="space-y-1">
                    <span className="line-through text-muted-foreground text-sm block">
                      {symbol}{registrationFee.toFixed(2)}
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      {symbol}{Math.max(0, registrationFee - discount.amount).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold">
                    {symbol}{registrationFee.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitting || isLoading || !formData.participantName || !formData.participantEmail}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
