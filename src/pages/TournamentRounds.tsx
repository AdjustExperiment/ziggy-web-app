import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Users, MapPin, Calendar } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

interface Round {
  id: string;
  name: string;
  round_number: number;
  status: string;
  scheduled_date: string | null;
  pairings: {
    id: string;
    room: string | null;
    scheduled_time: string | null;
    status: string;
    aff_registration: {
      participant_name: string;
    };
    neg_registration: {
      participant_name: string;
    };
  }[];
}

interface Tournament {
  id: string;
  name: string;
  location: string;
  status: string;
}

export default function TournamentRounds() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);

      // Fetch tournament info
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name, location, status')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Fetch rounds and pairings
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select(`
          *,
          pairings (
            id,
            room,
            scheduled_time,
            status,
            aff_registration:tournament_registrations!aff_registration_id (
              participant_name
            ),
            neg_registration:tournament_registrations!neg_registration_id (
              participant_name
            )
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number');

      if (roundsError) throw roundsError;
      setRounds(roundsData || []);
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tournament rounds. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'in progress':
        return 'secondary';
      case 'upcoming':
        return 'outline';
      default:
        return 'secondary';
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

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The tournament you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link to="/my-tournaments">Back to My Tournaments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <BackButton>
          Back to My Tournaments
        </BackButton>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {tournament.location}
              </span>
              <Badge variant={getStatusColor(tournament.status)}>
                {tournament.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {rounds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Rounds Yet</h2>
            <p className="text-muted-foreground">
              Rounds and pairings for this tournament haven't been created yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => (
            <Card key={round.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {round.name}
                      <Badge variant={getStatusColor(round.status)}>
                        {round.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      {round.scheduled_date && (
                        <>
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(round.scheduled_date).toLocaleDateString()}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Round {round.round_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {round.pairings.length} match{round.pairings.length !== 1 ? 'es' : ''}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {round.pairings.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No pairings created for this round yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {round.pairings.map((pairing) => (
                      <div
                        key={pairing.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm font-medium">
                              {pairing.aff_registration.participant_name}
                            </div>
                            <div className="text-xs text-muted-foreground">Affirmative</div>
                          </div>
                          <div className="text-muted-foreground">vs</div>
                          <div className="text-center">
                            <div className="text-sm font-medium">
                              {pairing.neg_registration.participant_name}
                            </div>
                            <div className="text-xs text-muted-foreground">Negative</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {pairing.room && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {pairing.room}
                            </div>
                          )}
                          {pairing.scheduled_time && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(pairing.scheduled_time).toLocaleTimeString()}
                            </div>
                          )}
                          <Badge variant={getStatusColor(pairing.status)} className="mt-1">
                            {pairing.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}