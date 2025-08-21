import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import PaymentButtons from '@/components/PaymentButtons';
import { Registration } from '@/types/database';

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
  judgeName: string;
  judgePhone: string;
  emergencyContact: string;
  schoolOrganization: string;
  experienceLevel: string;
  additionalNotes: string;
}

const initialFormData: FormData = {
  participantName: '',
  email: '',
  partnerName: '',
  partnerEmail: '',
  judgeName: '',
  judgePhone: '',
  emergencyContact: '',
  schoolOrganization: '',
  experienceLevel: '',
  additionalNotes: '',
};

export default function TournamentRegistration() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const registrationData = {
        tournament_id: tournament?.id,
        participant_name: formData.participantName,
        participant_email: formData.email,
        partner_name: formData.partnerName || null,
        partner_email: formData.partnerEmail || null,
        judge_name: formData.judgeName || null,
        judge_phone: formData.judgePhone || null,
        emergency_contact: formData.emergencyContact || null,
        school_organization: formData.schoolOrganization || null,
        additional_info: {
          experience_level: formData.experienceLevel,
          additional_notes: formData.additionalNotes
        },
        payment_status: 'pending',
        partnership_status: formData.partnerName ? 'with_partner' : 'individual',
        user_id: user?.id || null
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
        judge_name: data.judge_name || null,
        partnership_status: data.partnership_status || 'individual'
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

    // Since refund_requests table doesn't exist yet, we'll just show a message
    toast({
      title: "Refund Request",
      description: "Refund requests will be available after database migration. Please contact support directly.",
      variant: "default",
    });
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
            <h3 className="text-lg font-semibold">Judge Information (Required for Online Tournament)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="judgeName">Judge Name *</Label>
                <Input
                  id="judgeName"
                  value={formData.judgeName}
                  onChange={(e) => handleInputChange('judgeName', e.target.value)}
                  placeholder="Judge provided for online tournament"
                  required
                />
              </div>
              <div>
                <Label htmlFor="judgePhone">Judge Phone Number *</Label>
                <Input
                  id="judgePhone"
                  type="tel"
                  value={formData.judgePhone}
                  onChange={(e) => handleInputChange('judgePhone', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>

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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
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
          Registration Fee: ${tournament?.registration_fee} - Complete payment to secure your spot
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
              <p><strong>Judge:</strong> {registration.judge_name}</p>
            </div>
          </div>
        )}
        
        <PaymentButtons 
          amount={tournament?.registration_fee || 0}
          onPayPalPayment={async () => {
            // PayPal payment handler
            console.log('PayPal payment initiated');
          }}
          onVenmoPayment={async () => {
            // Venmo payment handler
            console.log('Venmo payment initiated');
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
    <div className="container mx-auto px-4 py-8">
      {step === 1 && renderRegistrationForm()}
      {step === 3 && renderPaymentStep()}
    </div>
  );
}
