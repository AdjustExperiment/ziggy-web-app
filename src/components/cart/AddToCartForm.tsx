import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { scrollToFirstInvalid } from '@/lib/forms/scrollToFirstInvalid';

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

// Zod schema for the cart form
const addToCartSchema = z.object({
  participantName: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  participantEmail: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  partnerName: z.string().optional(),
  partnerEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  schoolOrganization: z.string().optional(),
  eventId: z.string().optional(),
  role: z.enum(['competitor', 'judge']),
});

type AddToCartFormValues = z.infer<typeof addToCartSchema>;

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
  const [discount, setDiscount] = useState<{ amount: number; promoCodeId?: string }>({ amount: 0 });
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddToCartFormValues>({
    resolver: zodResolver(addToCartSchema),
    mode: 'onChange',
    defaultValues: {
      participantName: '',
      participantEmail: '',
      partnerName: '',
      partnerEmail: '',
      schoolOrganization: '',
      eventId: '',
      role: 'competitor',
    },
  });

  // Pre-fill email for self registration
  useEffect(() => {
    if (registrantType === 'self' && user?.email) {
      form.setValue('participantEmail', user.email);
    } else if (registrantType === 'other') {
      form.setValue('participantEmail', '');
    }
  }, [registrantType, user, form]);

  const onSubmit = async (data: AddToCartFormValues) => {
    setSubmitting(true);

    try {
      await onAddItem({
        registrant_type: registrantType,
        participant_name: data.participantName,
        participant_email: data.participantEmail,
        partner_name: data.partnerName || undefined,
        partner_email: data.partnerEmail || undefined,
        school_organization: data.schoolOrganization || undefined,
        event_id: data.eventId || undefined,
        role: data.role,
        base_price: registrationFee,
        promo_code_id: discount.promoCodeId,
        discount_amount: discount.amount
      });

      // Reset form for next entry
      form.reset({
        participantName: '',
        participantEmail: registrantType === 'self' ? (user?.email || '') : '',
        partnerName: '',
        partnerEmail: '',
        schoolOrganization: '',
        eventId: '',
        role: 'competitor',
      });
      setDiscount({ amount: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromoDiscount = (discountAmount: number, promoCode: string, promoCodeId?: string) => {
    setDiscount({ amount: discountAmount, promoCodeId });
  };

  const handleRegistrantTypeChange = (value: string) => {
    setRegistrantType(value as 'self' | 'other');
    // Clear name when switching types so user enters fresh data
    form.setValue('participantName', '');
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstInvalid)} className="space-y-6">
            {/* Registrant Type Tabs */}
            <Tabs value={registrantType} onValueChange={handleRegistrantTypeChange}>
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
                  <FormField
                    control={form.control}
                    name="participantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="participantEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="other" className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground mb-4">
                  The person you register will receive an email to claim their account and access their tournament dashboard.
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="participantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Their Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter their full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="participantEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Their Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="their@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Role Selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Role *</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      value={field.value} 
                      onValueChange={field.onChange} 
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="competitor" id="role-competitor" />
                        <Label htmlFor="role-competitor" className="cursor-pointer">Competitor</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="judge" id="role-judge" />
                        <Label htmlFor="role-judge" className="cursor-pointer">Judge</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Selection */}
            {events.length > 1 && (
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event/Format</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} ({event.short_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Additional Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="schoolOrganization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School/Organization</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter school or organization"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partnerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Name (if applicable)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter partner's name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              disabled={submitting || isLoading}
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
        </Form>
      </CardContent>
    </Card>
  );
}
