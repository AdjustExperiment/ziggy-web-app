import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timezones } from '@/lib/timezones';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import PaymentButtons from '@/components/PaymentButtons';
import { Registration } from '@/types/database';
import { AlertCircle, CheckCircle, Info, User, Lock } from 'lucide-react';
import PromoCodeInput from '@/components/PromoCodeInput';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Tournament {
  id: string;
  name: string;
  registration_fee: number;
}

interface FormData {
  participantName: string;
  email: string;
  partnerName: string;
  partnerEmail: string;
  judgeEmail: string;
  emergencyContact: string;
  schoolOrganization: string;
  experienceLevel: string;
  additionalNotes: string;
  timezone: string;
}

const initialFormData: FormData = {
  participantName: '',
  email: '',
  partnerName: '',
  partnerEmail: '',
  judgeEmail: '',
  emergencyContact: '',
  schoolOrganization: '',
  experienceLevel: '',
  additionalNotes: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export default function TournamentRegistration() {
  const { user } = useOptimizedAuth();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [judgeValidation, setJudgeValidation] = useState<{
    status: 'idle' | 'checking' | 'found' | 'not_found';
    judgeProfile?: any;
  }>({ status: 'idle' });
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');

  useEffect(() => {
    // Check if user is authenticated when component mounts
    if (!user) {
      setShowSignInModal(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) {
        setError('Tournament ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('id, name, registration_fee')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (!data) {
          setError('Tournament not found.');
          setLoading(false);
          return;
        }

        setTournament(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check judge email when it changes
    if (name === 'judgeEmail' && value.includes('@')) {
      checkJudgeEmail(value);
    }
  };

  const checkJudgeEmail = async (email: string) => {
    setJudgeValidation({ status: 'checking' });

    try {
      // Use edge function to check judge email to bypass RLS
      const { data, error } = await supabase.functions.invoke('lookup-user-by-email', {
        body: { email: email.toLowerCase(), table: 'judge_profiles' }
      });

      if (error) {
        console.error('Error checking judge email:', error);
        setJudgeValidation({ status: 'not_found' });
        return;
      }

      if (data && data.exists) {
        setJudgeValidation({ 
          status: 'found', 
          judgeProfile: { 
            id: data.profile?.id, 
            name: data.profile?.name, 
            email: data.profile?.email 
          } 
        });
      } else {
        setJudgeValidation({ status: 'not_found' });
      }
    } catch (error) {
      console.error('Error checking judge email:', error);
      setJudgeValidation({ status: 'not_found' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    
    setIsSubmitting(true);

    try {
      const registrationData = {
        tournament_id: tournament?.id,
        participant_name: formData.participantName,
        participant_email: formData.email,
        partner_name: formData.partnerName || null,
        emergency_contact: formData.emergencyContact || null,
        school_organization: formData.schoolOrganization || null,
        additional_info: {
          experience_level: formData.experienceLevel,
          additional_notes: formData.additionalNotes,
          timezone: formData.timezone,
          judge_email: formData.judgeEmail,
          partner_email: formData.partnerEmail || null,
          promo_code: appliedPromoCode || null
        },
        payment_status: 'pending',
        user_id: user?.id,
        requested_judge_profile_id: judgeValidation.judgeProfile?.id || null,
        amount_paid: Math.max(0, (tournament?.registration_fee || 0) - discountAmount)
      };

      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert([registrationData])
        .select()
        .single();

      if (error) throw error;

      // Transform the data to match Registration interface
      const transformedRegistration: Registration = {
        ...data,
        judge_name: judgeValidation.judgeProfile?.name || null,
        partnership_status: registrationData.partner_name ? 'with_partner' : 'individual'
      };

      setRegistration(transformedRegistration);

      // Send registration email
      if (data) {
        try {
          await supabase.functions.invoke('send-registration-email', {
            body: {
              registration_id: data.id,
              email_type: 'registration_success'
            }
          });
        } catch (emailError) {
          console.warn('Failed to send registration email:', emailError);
        }
      }

      toast({
        title: "Registration Submitted!",
        description: "Your registration has been submitted successfully. Complete payment to secure your spot.",
      });

      setStep(3);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestRefund = async () => {
    if (!registration || !user) return;

    toast({
      title: "Refund Request",
      description: "Refund requests will be available after database migration. Please contact support directly.",
      variant: "default",
    });
  };

  const handlePromoCodeDiscount = (discount: number, promoCode: string) => {
    setDiscountAmount(discount);
    setAppliedPromoCode(promoCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card>
          <CardContent>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
            <Button onClick={() => navigate('/tournaments')}>Back to Tournaments</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const finalAmount = Math.max(0, (tournament?.registration_fee || 0) - discountAmount);

  const renderSignInModal = () => (
    <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Sign In Required
          </DialogTitle>
          <DialogDescription>
            You need to sign in to register for tournaments. Create an account or sign in to continue with your registration.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button asChild className="w-full">
            <Link to="/signup">
              <User className="h-4 w-4 mr-2" />
              Create Account
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/login">
              Sign In
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/tournaments/${id}`)} className="w-full">
            View Tournament Info
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderRegistrationForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Registration</CardTitle>
        <CardDescription>
          Complete your registration for {tournament?.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="participantName">Your Name *</Label>
                <Input
                  id="participantName"
                  value={formData.participantName}
                  onChange={(e) => handleInputChange('participantName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Partner Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Partner Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partnerName">Partner Name</Label>
                <Input
                  id="partnerName"
                  value={formData.partnerName}
                  onChange={(e) => handleInputChange('partnerName', e.target.value)}
                  placeholder="Leave blank if competing individually"
                />
              </div>
              <div>
                <Label htmlFor="partnerEmail">Partner Email</Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  value={formData.partnerEmail}
                  onChange={(e) => handleInputChange('partnerEmail', e.target.value)}
                  placeholder="Partner must also register separately"
                />
              </div>
            </div>
          </div>

          {/* Judge Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Judge Information (Required)</h3>
            <div>
              <Label htmlFor="judgeEmail">Judge Email *</Label>
              <Input
                id="judgeEmail"
                type="email"
                value={formData.judgeEmail}
                onChange={(e) => handleInputChange('judgeEmail', e.target.value)}
                placeholder="Email of the judge who will judge your rounds"
                required
              />
              
              {/* Judge validation feedback */}
              {judgeValidation.status === 'checking' && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>Checking judge email...</AlertDescription>
                </Alert>
              )}
              
              {judgeValidation.status === 'found' && (
                <Alert className="mt-2">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Great! Found judge: {judgeValidation.judgeProfile?.name}. They will be notified of your registration.
                  </AlertDescription>
                </Alert>
              )}
              
              {judgeValidation.status === 'not_found' && formData.judgeEmail && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No judge account found with this email. Please ask your judge to create an account first, or double-check the email address.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Promo Code Section */}
          {tournament && (
            <div className="space-y-4">
              <PromoCodeInput
                tournamentId={tournament.id}
                originalAmount={tournament.registration_fee}
                onDiscountApplied={handlePromoCodeDiscount}
              />
              
              {discountAmount > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Registration Fee:</span>
                    <span>${tournament.registration_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span>Promo Code Discount ({appliedPromoCode}):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-bold">
                    <span>Final Amount:</span>
                    <span>${finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolOrganization">School/Organization</Label>
                <Input
                  id="schoolOrganization"
                  value={formData.schoolOrganization}
                  onChange={(e) => handleInputChange('schoolOrganization', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Name and phone number"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone *</Label>
              <Select 
                value={formData.timezone} 
                onValueChange={(value) => handleInputChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select 
                value={formData.experienceLevel} 
                onValueChange={(value) => handleInputChange('experienceLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Any additional information you'd like to share"
                rows={3}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || judgeValidation.status === 'not_found'}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderPaymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>
          {discountAmount > 0 
            ? `Final Amount: $${finalAmount} (${appliedPromoCode} discount applied)` 
            : `Registration Fee: $${tournament?.registration_fee}`
          } - Complete payment to secure your spot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {registration && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Registration Summary</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Participant:</strong> {registration.participant_name}</p>
              <p><strong>Email:</strong> {registration.participant_email}</p>
              {registration.partner_name && (
                <p><strong>Partner:</strong> {registration.partner_name}</p>
              )}
              <p><strong>Judge Email:</strong> {registration.additional_info?.judge_email}</p>
            </div>
          </div>
        )}
        
        <PaymentButtons
          amount={finalAmount}
          currency="USD"
          onPayPalPayment={async () => {
            console.log('PayPal payment initiated for:', finalAmount);
          }}
          onVenmoPayment={async () => {
            console.log('Venmo payment initiated for:', finalAmount);
          }}
        />

        {registration?.payment_status === 'paid' && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={requestRefund}
              className="w-full"
            >
              Request Refund
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {renderSignInModal()}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && renderRegistrationForm()}
            {step === 3 && renderPaymentStep()}
          </div>
          
          {step === 1 && tournament && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Registration Summary</CardTitle>
                  <CardDescription>{tournament.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Registration Fee:</span>
                    <span className="font-semibold">${tournament.registration_fee.toFixed(2)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-green-600">
                        <span>Discount ({appliedPromoCode}):</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total:</span>
                        <span>${finalAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <p>• Complete registration form</p>
                    <p>• Provide judge information</p>
                    <p>• Process payment to secure spot</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
