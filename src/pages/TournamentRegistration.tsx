
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, MapPin, Users, DollarSign, Trophy, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import PaymentButtons from '@/components/PaymentButtons';

interface Tournament {
  id: string;
  name: string;
  description: string;
  format: string;
  debate_style: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_details: string;
  max_participants: number;
  current_participants: number;
  registration_fee: number;
  prize_pool: string;
  sponsors: string[];
  status: string;
  registration_open: boolean;
  registration_deadline: string;
  payment_handler: string;
  paypal_client_id: string;
  additional_info: any;
}

const TournamentRegistration = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    participant_name: '',
    participant_email: '',
    school_organization: '',
    partner_name: '',
    emergency_contact: '',
  });

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        participant_email: user.email || '',
      }));
    }
  }, [user]);

  const fetchTournament = async () => {
    if (!tournamentId) {
      navigate('/tournaments');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      
      const transformedTournament = {
        ...data,
        sponsors: Array.isArray(data.sponsors) 
          ? (data.sponsors as string[]).filter(s => typeof s === 'string')
          : [],
        additional_info: data.additional_info || {}
      };
      
      setTournament(transformedTournament);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Tournament not found",
        variant: "destructive",
      });
      navigate('/tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !tournament.registration_open) return;
    
    setSubmitting(true);
    
    try {
      const { data: registration, error: regError } = await supabase
        .from('tournament_registrations')
        .insert([{
          tournament_id: tournament.id,
          participant_name: formData.participant_name,
          participant_email: formData.participant_email,
          school_organization: formData.school_organization,
          partner_name: formData.partner_name,
          dietary_requirements: null,
          emergency_contact: formData.emergency_contact,
          user_id: user?.id || null,
          amount_paid: tournament.registration_fee,
        }])
        .select()
        .single();

      if (regError) throw regError;

      setRegistrationId(registration.id);

      if (tournament.registration_fee > 0) {
        setShowPayment(true);
      } else {
        await supabase
          .from('tournament_registrations')
          .update({ payment_status: 'completed' })
          .eq('id', registration.id);
        
        toast({
          title: "Registration Successful!",
          description: "You have been registered for the tournament.",
        });
        
        navigate('/tournaments');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!registrationId || !tournament) return;
    
    const confirmPayment = confirm(`Process payment of $${tournament.registration_fee} via PayPal?`);
    
    if (confirmPayment) {
      try {
        await supabase
          .from('tournament_registrations')
          .update({ 
            payment_status: 'completed',
            payment_id: `paypal_${Date.now()}_${registrationId.slice(0, 8)}`
          })
          .eq('id', registrationId);
        
        toast({
          title: "Payment Successful!",
          description: "Your tournament registration is complete.",
        });
        
        navigate('/tournaments');
      } catch (error: any) {
        toast({
          title: "Payment Failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  const handleVenmoPayment = async () => {
    if (!registrationId || !tournament) return;
    
    const confirmPayment = confirm(`Process payment of $${tournament.registration_fee} via Venmo?`);
    
    if (confirmPayment) {
      try {
        await supabase
          .from('tournament_registrations')
          .update({ 
            payment_status: 'completed',
            payment_id: `venmo_${Date.now()}_${registrationId.slice(0, 8)}`
          })
          .eq('id', registrationId);
        
        toast({
          title: "Payment Successful!",
          description: "Your tournament registration is complete.",
        });
        
        navigate('/tournaments');
      } catch (error: any) {
        toast({
          title: "Payment Failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  const exportCalendar = () => {
    if (!tournament) return;
    
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tournament App//Tournament Calendar//EN
BEGIN:VEVENT
UID:tournament-${tournament.id}@tournamentapp.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${tournament.name}
DESCRIPTION:${tournament.description || ''}
LOCATION:${tournament.venue_details || tournament.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournament.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Calendar Exported",
      description: "Tournament added to your calendar",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  const isRegistrationClosed = !tournament.registration_open || 
    tournament.current_participants >= tournament.max_participants ||
    (tournament.registration_deadline && new Date() > new Date(tournament.registration_deadline));

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-black py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Button
            variant="outline"
            onClick={() => navigate('/tournaments')}
            className="mb-6 border-white/30 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
          
          <div className="text-center">
            <Badge 
              variant={tournament.registration_open ? "default" : "secondary"}
              className={`mb-4 ${tournament.registration_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            >
              {tournament.status}
            </Badge>
            
            <h1 className="text-4xl font-bold text-white mb-4 font-primary">
              {tournament.name}
            </h1>
            
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {tournament.description}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tournament Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Tournament Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Tournament Dates</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tournament.start_date), "MMM d")} - {format(new Date(tournament.end_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{tournament.location}</p>
                      {tournament.venue_details && (
                        <p className="text-xs text-muted-foreground">{tournament.venue_details}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Participants</p>
                      <p className="text-sm text-muted-foreground">
                        {tournament.current_participants} / {tournament.max_participants} registered
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Registration Fee</p>
                      <p className="text-sm text-muted-foreground">
                        ${tournament.registration_fee}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="font-medium mb-2">Format & Style</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{tournament.format}</Badge>
                    {tournament.debate_style && (
                      <Badge variant="outline">{tournament.debate_style}</Badge>
                    )}
                  </div>
                </div>
                
                {tournament.prize_pool && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium">Prize Pool</p>
                      <p className="text-2xl font-bold text-primary">{tournament.prize_pool}</p>
                    </div>
                  </>
                )}
                
                {tournament.sponsors && tournament.sponsors.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2">Sponsors</p>
                      <div className="flex flex-wrap gap-2">
                        {tournament.sponsors.map((sponsor, index) => (
                          <Badge key={index} variant="secondary">{sponsor}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Add to Calendar
                </CardTitle>
                <CardDescription>
                  Export tournament dates to your personal calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{tournament.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tournament.start_date), "PPP")} - {format(new Date(tournament.end_date), "PPP")}
                    </p>
                  </div>
                  <Button onClick={exportCalendar} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Calendar</CardTitle>
                <CardDescription>
                  Tournament runs from {format(new Date(tournament.start_date), "PPP")} to {format(new Date(tournament.end_date), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="range"
                  defaultMonth={new Date(tournament.start_date)}
                  selected={{
                    from: new Date(tournament.start_date),
                    to: new Date(tournament.end_date)
                  }}
                  className="rounded-md border w-fit mx-auto"
                  disabled={{ before: new Date() }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Registration Form or Payment */}
          <div className="space-y-6">
            {showPayment && tournament.registration_fee > 0 ? (
              <PaymentButtons
                amount={tournament.registration_fee}
                onPayPalPayment={handlePayPalPayment}
                onVenmoPayment={handleVenmoPayment}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Register for Tournament</CardTitle>
                  <CardDescription>
                    {isRegistrationClosed 
                      ? "Registration is currently closed"
                      : "Fill out the form below to register"
                    }
                  </CardDescription>
                </CardHeader>
                
                {isRegistrationClosed ? (
                  <CardContent>
                    <div className="text-center p-6">
                      <Badge variant="destructive" className="mb-4">Registration Closed</Badge>
                      <p className="text-muted-foreground">
                        {tournament.current_participants >= tournament.max_participants 
                          ? "Tournament is full"
                          : `Registration deadline was ${format(new Date(tournament.registration_deadline), "PPP")}`
                        }
                      </p>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="participant_name">Full Name *</Label>
                        <Input
                          id="participant_name"
                          value={formData.participant_name}
                          onChange={(e) => setFormData({...formData, participant_name: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="participant_email">Email Address *</Label>
                        <Input
                          id="participant_email"
                          type="email"
                          value={formData.participant_email}
                          onChange={(e) => setFormData({...formData, participant_email: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="school_organization">School/Organization</Label>
                        <Input
                          id="school_organization"
                          value={formData.school_organization}
                          onChange={(e) => setFormData({...formData, school_organization: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="partner_name">Partner Name (if applicable)</Label>
                        <Input
                          id="partner_name"
                          value={formData.partner_name}
                          onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                        />
                      </div>
                      
                      
                      <div>
                        <Label htmlFor="emergency_contact">Emergency Contact</Label>
                        <Input
                          id="emergency_contact"
                          value={formData.emergency_contact}
                          onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                          placeholder="Name and phone number"
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span>Registration Fee:</span>
                          <span className="font-bold">${tournament.registration_fee}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tournament.registration_fee > 0 
                            ? "Payment options will be shown after registration" 
                            : "Free registration"
                          }
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={submitting}
                      >
                        {submitting 
                          ? 'Processing...' 
                          : tournament.registration_fee > 0 
                            ? 'Continue to Payment' 
                            : 'Register Now'
                        }
                      </Button>
                      
                      {tournament.registration_deadline && (
                        <p className="text-xs text-muted-foreground text-center">
                          Registration deadline: {format(new Date(tournament.registration_deadline), "PPP")}
                        </p>
                      )}
                    </form>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentRegistration;
