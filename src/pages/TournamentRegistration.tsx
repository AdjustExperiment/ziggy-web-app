
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { PaymentButtons } from '@/components/PaymentButtons';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, DollarSign, User, Mail, Phone, Building } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description: string;
  format: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_fee: number;
  max_participants: number;
  current_participants: number;
  registration_open: boolean;
  registration_deadline: string;
  tournament_info: string;
  additional_info: any;
}

export default function TournamentRegistration() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    participant_name: '',
    participant_email: '',
    partner_name: '',
    club_organization: '', // Changed from school_organization
    emergency_contact: '',
    dietary_requirements: '',
    additional_info: ''
  });

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      // Pre-fill form with user data if available
      setFormData(prev => ({
        ...prev,
        participant_email: user.email || ''
      }));
    }
  }, [user]);

  const fetchTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (error: any) {
      console.error('Error fetching tournament:', error);
      toast({
        title: "Error",
        description: "Failed to load tournament details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;

    setSubmitting(true);
    try {
      const registrationData = {
        tournament_id: tournament.id,
        user_id: user?.id || null,
        participant_name: formData.participant_name,
        participant_email: formData.participant_email,
        partner_name: formData.partner_name || null,
        school_organization: formData.club_organization || null, // Keep DB column name but use club data
        emergency_contact: formData.emergency_contact || null,
        dietary_requirements: formData.dietary_requirements || null,
        additional_info: formData.additional_info ? { notes: formData.additional_info } : {},
        payment_status: 'pending'
      };

      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert([registrationData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Registration Submitted",
        description: "Your registration has been submitted. Please complete payment to confirm your spot.",
      });

      // You could redirect to a payment page here
      console.log('Registration created:', data);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit registration",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return <Navigate to="/tournaments" replace />;
  }

  if (!tournament.registration_open) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Registration Closed</CardTitle>
            <CardDescription>
              Registration for this tournament is currently closed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isRegistrationFull = tournament.current_participants >= tournament.max_participants;
  const registrationDeadlinePassed = tournament.registration_deadline && 
    new Date(tournament.registration_deadline) < new Date();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tournament Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{tournament.name}</CardTitle>
                  <CardDescription className="text-base mb-4">
                    {tournament.description}
                  </CardDescription>
                </div>
                <Badge variant={tournament.registration_open ? 'default' : 'secondary'}>
                  {tournament.registration_open ? 'Registration Open' : 'Registration Closed'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Dates</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">{tournament.location}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Participants</div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.current_participants} / {tournament.max_participants}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Registration Fee</div>
                    <div className="text-sm text-muted-foreground">${tournament.registration_fee}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Registration</CardTitle>
                <CardDescription>
                  Fill out the form below to register for this tournament
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isRegistrationFull ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Tournament Full</h3>
                    <p className="text-muted-foreground">
                      This tournament has reached its maximum capacity.
                    </p>
                  </div>
                ) : registrationDeadlinePassed ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Registration Deadline Passed</h3>
                    <p className="text-muted-foreground">
                      The registration deadline for this tournament has passed.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="participant_name" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Participant Name *
                        </Label>
                        <Input
                          id="participant_name"
                          value={formData.participant_name}
                          onChange={(e) => setFormData({...formData, participant_name: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="participant_email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </Label>
                        <Input
                          id="participant_email"
                          type="email"
                          value={formData.participant_email}
                          onChange={(e) => setFormData({...formData, participant_email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="partner_name">Partner Name (if applicable)</Label>
                      <Input
                        id="partner_name"
                        value={formData.partner_name}
                        onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                        placeholder="Leave blank if competing individually"
                      />
                    </div>

                    <div>
                      <Label htmlFor="club_organization" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Club/Organization
                      </Label>
                      <Input
                        id="club_organization"
                        value={formData.club_organization}
                        onChange={(e) => setFormData({...formData, club_organization: e.target.value})}
                        placeholder="Your club or organization name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Emergency Contact
                      </Label>
                      <Input
                        id="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                        placeholder="Name and phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dietary_requirements">Dietary Requirements</Label>
                      <Textarea
                        id="dietary_requirements"
                        value={formData.dietary_requirements}
                        onChange={(e) => setFormData({...formData, dietary_requirements: e.target.value})}
                        placeholder="Any dietary restrictions or requirements"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="additional_info">Additional Information</Label>
                      <Textarea
                        id="additional_info"
                        value={formData.additional_info}
                        onChange={(e) => setFormData({...formData, additional_info: e.target.value})}
                        placeholder="Any additional information or special requests"
                        rows={3}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Registration'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Tournament Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Format</h4>
                      <Badge variant="outline">{tournament.format}</Badge>
                    </div>
                    
                    {tournament.tournament_info && (
                      <div>
                        <h4 className="font-semibold mb-2">Information</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {tournament.tournament_info}
                        </p>
                      </div>
                    )}
                    
                    {tournament.registration_deadline && (
                      <div>
                        <h4 className="font-semibold mb-2">Registration Deadline</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tournament.registration_deadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Registration Fee:</span>
                      <span className="font-semibold text-lg">${tournament.registration_fee}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Payment is required to complete your registration. You can pay after submitting your registration form.
                    </div>

                    <PaymentButtons
                      amount={tournament.registration_fee}
                      tournamentId={tournament.id}
                      tournamentName={tournament.name}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
