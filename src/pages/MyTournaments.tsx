import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Calendar, MapPin, Users, Eye, Clock, FileText } from 'lucide-react';
import { Registration } from '@/types/database';

interface TournamentWithRegistration extends Registration {
  tournament: {
    id: string;
    name: string;
    location: string;
    start_date: string;
    end_date: string;
    status: string;
    current_participants: number;
    max_participants: number;
  };
}

export default function MyTournaments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyTournaments();
    }
  }, [user]);

  const fetchMyTournaments = async () => {
    try {
      setLoading(true);
      
      // First, get the registrations
      const { data: registrationData, error: regError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (regError) throw regError;

      if (!registrationData || registrationData.length === 0) {
        setRegistrations([]);
        return;
      }

      // Get tournament IDs
      const tournamentIds = registrationData.map(reg => reg.tournament_id);

      // Then, get the tournament data
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name, location, start_date, end_date, status, current_participants, max_participants')
        .in('id', tournamentIds);

      if (tournamentError) throw tournamentError;

      // Combine the data
      const combinedData = registrationData.map(registration => {
        const tournament = tournamentData?.find(t => t.id === registration.tournament_id);
        return {
          ...registration,
          tournament: tournament || null
        };
      });

      setRegistrations(combinedData);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your tournaments. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'secondary';
      case 'active':
      case 'in progress':
        return 'default';
      case 'registration open':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to view your tournaments.
            </p>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Tournaments</h1>
        <p className="text-muted-foreground">
          View and manage your tournament registrations and pairings.
        </p>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Tournaments Yet</h2>
            <p className="text-muted-foreground mb-4">
              You haven't registered for any tournaments yet.
            </p>
            <Button asChild>
              <Link to="/tournaments">Browse Tournaments</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {registrations.map((registration) => (
            <Card key={registration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {registration.tournament.name}
                    </CardTitle>
                    <CardDescription className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {registration.tournament.location}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(registration.tournament.status)}>
                    {registration.tournament.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(registration.tournament.start_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {registration.tournament.current_participants}/{registration.tournament.max_participants}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Payment Status</span>
                    <Badge variant={getPaymentStatusColor(registration.payment_status)}>
                      {registration.payment_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Participant</span>
                    <span className="text-sm">{registration.participant_name}</span>
                  </div>

                  {registration.partner_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Partner</span>
                      <span className="text-sm">{registration.partner_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1 text-xs sm:text-sm">
                    <Link to={`/tournaments/${registration.tournament.id}`}>
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">View </span>Tournament
                    </Link>
                  </Button>
                    
                    <Button variant="outline" size="sm" asChild className="flex-1 text-xs sm:text-sm">
                      <Link to={`/tournaments/${registration.tournament.id}/rounds`}>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">View </span>Rounds
                      </Link>
                    </Button>
                  </div>

                  <Button variant="outline" size="sm" asChild className="w-full text-xs sm:text-sm">
                    <Link to={`/tournaments/${registration.tournament.id}/postings`}>
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      View Postings
                    </Link>
                  </Button>

                  <Button size="sm" asChild className="w-full text-xs sm:text-sm">
                    <Link to={`/tournaments/${registration.tournament.id}/my-match`}>
                      View My Match
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}