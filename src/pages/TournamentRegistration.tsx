import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PaymentButtons from '@/components/PaymentButtons';
import { toast } from '@/components/ui/use-toast';
import { Calendar, MapPin, Users, DollarSign, Trophy, Clock } from 'lucide-react';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

const TournamentRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    team_name: '',
    partner_name: '',
    partner_email: '',
    dietary_restrictions: '',
    emergency_contact: '',
    emergency_phone: '',
    school_affiliation: '',
    experience_level: '',
    additional_notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchTournament();
      if (user) {
        checkRegistrationStatus();
      }
    }
  }, [id, user]);

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
      toast({
        title: "Error",
        description: "Failed to fetch tournament details",
        variant: "destructive",
      });
      navigate('/tournaments');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', id)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setIsRegistered(true);
        setFormData({
          team_name: data.team_name || '',
          partner_name: data.partner_name || '',
          partner_email: data.partner_email || '',
          dietary_restrictions: data.dietary_restrictions || '',
          emergency_contact: data.emergency_contact || '',
          emergency_phone: data.emergency_phone || '',
          school_affiliation: data.school_affiliation || '',
          experience_level: data.experience_level || '',
          additional_notes: data.additional_notes || ''
        });
      }
    } catch (error) {
      // User is not registered, which is fine
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register for tournaments",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!tournament?.registration_open) {
      toast({
        title: "Registration Closed",
        description: "Registration for this tournament is currently closed",
        variant: "destructive",
      });
      return;
    }

    setRegistering(true);

    try {
      const registrationData = {
        tournament_id: id,
        user_id: user.id,
        ...formData,
        registration_status: 'pending',
        payment_status: 'pending'
      };

      if (isRegistered) {
        const { error } = await supabase
          .from('tournament_registrations')
          .update(registrationData)
          .eq('tournament_id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Registration updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('tournament_registrations')
          .insert(registrationData);

        if (error) throw error;

        setIsRegistered(true);
        toast({
          title: "Success",
          description: "Registration submitted successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register for tournament",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Tournament Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The tournament you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/tournaments')}>
              Browse Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Tournament Information */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                <Badge 
                  variant={tournament.registration_open ? "default" : "secondary"}
                  className={tournament.registration_open ? "bg-green-500" : ""}
                >
                  {tournament.status}
                </Badge>
              </div>
              <CardDescription>{tournament.format}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tournament.start_date), "PPP")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tournament.end_date), "PPP")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{tournament.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="text-sm text-muted-foreground">
                      {tournament.current_participants}/{tournament.max_participants}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Registration Fee</p>
                    <p className="text-sm text-muted-foreground">${tournament.registration_fee}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Prize Pool</p>
                    <p className="text-sm text-muted-foreground">{tournament.prize_pool || 'TBD'}</p>
                  </div>
                </div>
              </div>
              
              {tournament.venue_details && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Venue Details</h4>
                    <p className="text-sm text-muted-foreground">{tournament.venue_details}</p>
                  </div>
                </>
              )}
              
              {tournament.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{tournament.description}</p>
                  </div>
                </>
              )}
              
              {tournament.tournament_info && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Tournament Information</h4>
                    <div 
                      className="text-sm text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(tournament.tournament_info) 
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {isRegistered ? 'Update Registration' : 'Register for Tournament'}
              </CardTitle>
              <CardDescription>
                {isRegistered 
                  ? 'Update your registration details below'
                  : 'Fill out the form below to register for this tournament'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!tournament.registration_open ? (
                <div className="text-center p-6">
                  <p className="text-muted-foreground mb-4">
                    Registration is currently closed for this tournament.
                  </p>
                  <Badge variant="secondary">Registration Closed</Badge>
                </div>
              ) : (
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div>
                    <Label htmlFor="team_name">Team Name *</Label>
                    <Input
                      id="team_name"
                      value={formData.team_name}
                      onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partner_name">Partner Name</Label>
                      <Input
                        id="partner_name"
                        value={formData.partner_name}
                        onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="partner_email">Partner Email</Label>
                      <Input
                        id="partner_email"
                        type="email"
                        value={formData.partner_email}
                        onChange={(e) => setFormData({...formData, partner_email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="school_affiliation">School/Organization</Label>
                    <Input
                      id="school_affiliation"
                      value={formData.school_affiliation}
                      onChange={(e) => setFormData({...formData, school_affiliation: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Input
                      id="experience_level"
                      value={formData.experience_level}
                      onChange={(e) => setFormData({...formData, experience_level: e.target.value})}
                      placeholder="e.g., Novice, Varsity, Open"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact">Emergency Contact</Label>
                      <Input
                        id="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emergency_phone">Emergency Phone</Label>
                      <Input
                        id="emergency_phone"
                        value={formData.emergency_phone}
                        onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                    <Textarea
                      id="dietary_restrictions"
                      value={formData.dietary_restrictions}
                      onChange={(e) => setFormData({...formData, dietary_restrictions: e.target.value})}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="additional_notes">Additional Notes</Label>
                    <Textarea
                      id="additional_notes"
                      value={formData.additional_notes}
                      onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registering}
                  >
                    {registering 
                      ? 'Processing...' 
                      : isRegistered 
                        ? 'Update Registration' 
                        : 'Submit Registration'
                    }
                  </Button>
                </form>
              )}
              
              {isRegistered && tournament.registration_fee > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="font-medium mb-4">Payment</h4>
                    <PaymentButtons
                      tournament={tournament}
                      amount={tournament.registration_fee}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TournamentRegistration;
