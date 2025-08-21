import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, MapPin, Users, Trophy, Calendar } from 'lucide-react';

interface MyPairing {
  id: string;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  round: {
    name: string;
    round_number: number;
    scheduled_date: string | null;
  };
  aff_registration: {
    participant_name: string;
  };
  neg_registration: {
    participant_name: string;
  };
  opponent_name: string;
  my_side: 'affirmative' | 'negative';
}

interface Tournament {
  id: string;
  name: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function TournamentMyMatch() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [myPairings, setMyPairings] = useState<MyPairing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId && user) {
      fetchMyMatches();
    }
  }, [tournamentId, user]);

  const fetchMyMatches = async () => {
    try {
      setLoading(true);

      // Get my registration for this tournament
      const { data: myRegistration, error: regError } = await supabase
        .from('tournament_registrations')
        .select('id, participant_name')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user?.id)
        .single();

      if (regError) throw regError;

      // Fetch tournament info
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Fetch my pairings where I'm either aff or neg
      const { data: pairingsData, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          round:rounds (
            name,
            round_number,
            scheduled_date
          ),
          aff_registration:tournament_registrations!aff_registration_id (
            participant_name
          ),
          neg_registration:tournament_registrations!neg_registration_id (
            participant_name
          )
        `)
        .eq('tournament_id', tournamentId)
        .or(`aff_registration_id.eq.${myRegistration.id},neg_registration_id.eq.${myRegistration.id}`)
        .order('scheduled_time');

      if (pairingsError) throw pairingsError;

      // Transform the data to include opponent info and my side
      const transformedPairings: MyPairing[] = (pairingsData || []).map((pairing) => {
        const isAff = pairing.aff_registration_id === myRegistration.id;
        const mySide = isAff ? 'affirmative' : 'negative';
        const opponentName = isAff 
          ? pairing.neg_registration.participant_name 
          : pairing.aff_registration.participant_name;

        return {
          ...pairing,
          opponent_name: opponentName,
          my_side: mySide,
        };
      });

      setMyPairings(transformedPairings);
    } catch (error) {
      console.error('Error fetching my matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your matches. Please try again.',
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
      case 'scheduled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'affirmative' ? 'default' : 'secondary';
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
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/my-tournaments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Tournaments
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Matches</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="text-xl">{tournament.name}</span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {tournament.location}
              </span>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/tournaments/${tournament.id}/rounds`}>
              View All Rounds
            </Link>
          </Button>
        </div>
      </div>

      {myPairings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Matches Yet</h2>
            <p className="text-muted-foreground">
              You don't have any matches scheduled for this tournament yet. Check back later or contact the tournament organizers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myPairings.map((pairing) => (
            <Card key={pairing.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {pairing.round.name}
                      <Badge variant={getStatusColor(pairing.status)}>
                        {pairing.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span>Round {pairing.round.round_number}</span>
                      {pairing.round.scheduled_date && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(pairing.round.scheduled_date).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={getSideColor(pairing.my_side)}>
                    {pairing.my_side}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Match Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Match Details</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">My Side</span>
                        <Badge variant={getSideColor(pairing.my_side)}>
                          {pairing.my_side}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Opponent</span>
                        <span className="text-sm font-medium">{pairing.opponent_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Logistics */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Logistics</h4>
                    
                    <div className="space-y-2">
                      {pairing.room && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{pairing.room}</span>
                        </div>
                      )}
                      
                      {pairing.scheduled_time && (
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{new Date(pairing.scheduled_time).toLocaleString()}</span>
                        </div>
                      )}

                      {!pairing.room && !pairing.scheduled_time && (
                        <div className="text-sm text-muted-foreground">
                          Logistics not yet available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Actions</h4>
                    
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        <Users className="h-4 w-4 mr-2" />
                        View Ballot
                      </Button>
                      
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/tournaments/${tournament.id}/rounds`}>
                          <Trophy className="h-4 w-4 mr-2" />
                          Round Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {pairing.status.toLowerCase() === 'scheduled' && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Upcoming Match</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      This match is scheduled and ready. Make sure you're prepared and arrive on time!
                    </p>
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