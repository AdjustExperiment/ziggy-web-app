
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calendar, MapPin, Users, Trophy, Clock, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PaymentButtons from '@/components/PaymentButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfileSetup } from '@/components/auth/ProfileSetup';

interface Tournament {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_details: string;
  registration_fee: number;
  format: string;
  debate_style: string;
  registration_deadline: string;
  registration_open: boolean;
  max_participants: number;
  current_participants: number;
  tournament_info: string;
  additional_info: any;
  status: string;
}

const TournamentRegistration = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
    participant_name: '',
    participant_email: '',
    partner_name: '',
    school_organization: '',
    dietary_requirements: '',
    emergency_contact: '',
    additional_info: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to={`/login?redirect=/tournament/${id}/register`} replace />;
  }

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  useEffect(() => {
    if (profile && user) {
      // Check if profile is complete
      const isComplete = profile.first_name && profile.last_name && profile.state && profile.time_zone && profile.phone;
      setProfileIncomplete(!isComplete);
      
      // Auto-fill form with profile data
      setFormData(prev => ({
        ...prev,
        participant_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        participant_email: user.email || '',
      }));
    }
  }, [profile, user]);

  const fetchTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tournament details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !user) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert([{
          tournament_id: tournament.id,
          participant_name: formData.participant_name,
          participant_email: formData.participant_email,
          partner_name: formData.partner_name || null,
          school_organization: formData.school_organization || null,
          dietary_requirements: formData.dietary_requirements || null,
          emergency_contact: formData.emergency_contact || null,
          additional_info: formData.additional_info,
          payment_status: 'pending',
          amount_paid: tournament.registration_fee,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setRegistrationId(data.id);
      setShowPayment(true);
      
      toast({
        title: 'Registration Submitted',
        description: 'Please complete your payment to confirm your registration.',
      });
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalPayment = async () => {
    // PayPal integration would go here
    toast({
      title: 'PayPal Payment',
      description: 'PayPal integration coming soon!',
    });
  };

  const handleVenmoPayment = async () => {
    // Venmo integration would go here
    toast({
      title: 'Venmo Payment',
      description: 'Venmo integration coming soon!',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
            <p className="text-muted-foreground">The tournament you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRegistrationClosed = !tournament.registration_open || 
    (tournament.registration_deadline && new Date(tournament.registration_deadline) < new Date()) ||
    tournament.current_participants >= tournament.max_participants;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Completion Dialog */}
        <Dialog open={profileIncomplete} onOpenChange={() => {}}>
          <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Complete Your Profile</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please complete your profile information before registering for tournaments.
                </AlertDescription>
              </Alert>
            </div>
            <ProfileSetup 
              isModal 
              onComplete={() => {
                setProfileIncomplete(false);
                window.location.reload();
              }} 
            />
          </DialogContent>
        </Dialog>

        {/* Tournament Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">{tournament.name}</h1>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{tournament.location}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{tournament.current_participants}/{tournament.max_participants} registered</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">${tournament.registration_fee}</span>
            </div>
          </div>

          {tournament.description && (
            <p className="text-muted-foreground mb-4">{tournament.description}</p>
          )}
        </div>

        {isRegistrationClosed ? (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Registration for this tournament is currently closed.
            </AlertDescription>
          </Alert>
        ) : showPayment ? (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your registration has been submitted. Please complete your payment to confirm your spot.
              </AlertDescription>
            </Alert>
            
            <PaymentButtons
              amount={tournament.registration_fee}
              onPayPalPayment={handlePayPalPayment}
              onVenmoPayment={handleVenmoPayment}
            />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Registration Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Registration</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="participant_name">Participant Name *</Label>
                        <Input
                          id="participant_name"
                          value={formData.participant_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, participant_name: e.target.value }))}
                          required
                          disabled={!profile?.first_name || !profile?.last_name}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="participant_email">Email Address *</Label>
                        <Input
                          id="participant_email"
                          type="email"
                          value={formData.participant_email}
                          onChange={(e) => setFormData(prev => ({ ...prev, participant_email: e.target.value }))}
                          required
                          disabled
                        />
                      </div>
                    </div>

                    {tournament.format?.toLowerCase().includes('team') && (
                      <div>
                        <Label htmlFor="partner_name">Partner Name</Label>
                        <Input
                          id="partner_name"
                          value={formData.partner_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, partner_name: e.target.value }))}
                          placeholder="Required for team formats"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="school_organization">School/Organization</Label>
                      <Input
                        id="school_organization"
                        value={formData.school_organization}
                        onChange={(e) => setFormData(prev => ({ ...prev, school_organization: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dietary_requirements">Dietary Requirements</Label>
                      <Textarea
                        id="dietary_requirements"
                        value={formData.dietary_requirements}
                        onChange={(e) => setFormData(prev => ({ ...prev, dietary_requirements: e.target.value }))}
                        placeholder="Any dietary restrictions or allergies we should know about?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact">Emergency Contact</Label>
                      <Input
                        id="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                        placeholder="Name and phone number"
                      />
                    </div>

                    <Button type="submit" disabled={submitting || profileIncomplete} className="w-full">
                      {submitting ? 'Submitting...' : 'Register for Tournament'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Tournament Details Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Tournament Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Format</Label>
                    <p className="font-medium">{tournament.format}</p>
                  </div>
                  
                  {tournament.debate_style && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Debate Style</Label>
                      <p className="font-medium">{tournament.debate_style}</p>
                    </div>
                  )}
                  
                  {tournament.venue_details && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Venue</Label>
                      <p className="font-medium">{tournament.venue_details}</p>
                    </div>
                  )}
                  
                  {tournament.registration_deadline && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Registration Deadline</Label>
                      <p className="font-medium">
                        {new Date(tournament.registration_deadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {tournament.tournament_info && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{tournament.tournament_info}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentRegistration;
