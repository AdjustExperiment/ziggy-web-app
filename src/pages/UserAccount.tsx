
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileSetup } from '@/components/auth/ProfileSetup';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CreditCard, MapPin, Clock, User, Phone, Mail } from 'lucide-react';

interface Registration {
  id: string;
  tournament_name: string;
  participant_name: string;
  partner_name?: string;
  payment_status: string;
  amount_paid?: number;
  registration_date: string;
  tournament: {
    name: string;
    start_date: string;
    end_date: string;
    location: string;
    status: string;
  };
}

export default function UserAccount() {
  const { user, profile, loading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      fetchRegistrations();
    }
  }, [user, loading]);

  const fetchRegistrations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          id,
          participant_name,
          partner_name,
          payment_status,
          amount_paid,
          registration_date,
          tournaments!inner (
            name,
            start_date,
            end_date,
            location,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map((reg: any) => ({
        id: reg.id,
        tournament_name: reg.tournaments.name,
        participant_name: reg.participant_name,
        partner_name: reg.partner_name,
        payment_status: reg.payment_status,
        amount_paid: reg.amount_paid,
        registration_date: reg.registration_date,
        tournament: {
          name: reg.tournaments.name,
          start_date: reg.tournaments.start_date,
          end_date: reg.tournaments.end_date,
          location: reg.tournaments.location,
          status: reg.tournaments.status
        }
      })) || [];

      setRegistrations(transformedData);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your registrations.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const isProfileComplete = profile?.first_name && profile?.last_name && profile?.state && profile?.time_zone && profile?.phone;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Account</h1>
            {!isProfileComplete && (
              <Button onClick={() => setShowProfileSetup(true)}>
                Complete Profile
              </Button>
            )}
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isProfileComplete ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Please complete your profile to register for tournaments.
                  </p>
                  <Button onClick={() => setShowProfileSetup(true)}>
                    Complete Profile Setup
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {profile?.first_name} {profile?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {profile?.state}
                      {profile?.region && `, ${profile.region}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.time_zone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.phone}</span>
                  </div>
                </div>
              )}
              
              {isProfileComplete && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowProfileSetup(true)}
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tournament Registrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Tournament Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRegistrations ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading registrations...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    You haven't registered for any tournaments yet.
                  </p>
                  <Button onClick={() => window.location.href = '/tournaments'}>
                    Browse Tournaments
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{registration.tournament.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {registration.participant_name}
                            {registration.partner_name && ` & ${registration.partner_name}`}
                          </p>
                        </div>
                        <Badge
                          variant={
                            registration.payment_status === 'paid'
                              ? 'default'
                              : registration.payment_status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {registration.payment_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(registration.tournament.start_date).toLocaleDateString()} - {' '}
                            {new Date(registration.tournament.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{registration.tournament.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {registration.amount_paid 
                              ? `$${registration.amount_paid}` 
                              : 'Amount TBD'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          Registered: {new Date(registration.registration_date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline">
                          {registration.tournament.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Setup Modal */}
          {showProfileSetup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Profile Setup</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProfileSetup(false)}
                    >
                      ×
                    </Button>
                  </div>
                  <ProfileSetup
                    isModal={true}
                    onComplete={() => {
                      setShowProfileSetup(false);
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
