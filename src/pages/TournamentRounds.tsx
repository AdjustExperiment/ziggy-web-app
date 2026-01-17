
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Clock, MapPin, User, Users, FileText } from 'lucide-react';
import { RoundOptOutManager } from '@/components/tournament/RoundOptOutManager';
import { EmptyState } from '@/components/ui/empty-state';

interface Tournament {
  id: string;
  name: string;
  opt_outs_enabled: boolean;
}

interface Round {
  id: string;
  name: string;
  round_number: number;
  status: string;
  scheduled_date: string | null;
}

interface Pairing {
  id: string;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  aff_registration: {
    participant_name: string;
    school_organization: string | null;
  };
  neg_registration: {
    participant_name: string;
    school_organization: string | null;
  };
  judge_profiles: {
    name: string;
  } | null;
}

interface Registration {
  id: string;
  participant_name: string;
  tournament_id: string;
}

export default function TournamentRounds() {
  const { tournamentId } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pairings, setPairings] = useState<{ [roundId: string]: Pairing[] }>({});
  const [userRegistration, setUserRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
      fetchRounds();
      if (user) {
        fetchUserRegistration();
      }
    }
  }, [tournamentId, user]);

  const fetchTournamentData = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, opt_outs_enabled')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (error: any) {
      console.error('Error fetching tournament:', error);
      toast({
        title: "Error",
        description: "Failed to load tournament information",
        variant: "destructive",
      });
    }
  };

  const fetchUserRegistration = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('id, participant_name, tournament_id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserRegistration(data);
    } catch (error: any) {
      console.error('Error fetching user registration:', error);
    }
  };

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number');

      if (roundsError) throw roundsError;
      setRounds(roundsData || []);

      // Fetch pairings for each round
      const pairingsPromises = (roundsData || []).map(async (round) => {
        const { data: pairingsData, error: pairingsError } = await supabase
          .from('pairings')
          .select(`
            *,
            aff_registration:tournament_registrations!aff_registration_id(participant_name, school_organization),
            neg_registration:tournament_registrations!neg_registration_id(participant_name, school_organization),
            judge_profiles(name)
          `)
          .eq('round_id', round.id)
          .eq('released', true);

        if (pairingsError) {
          console.error(`Error fetching pairings for round ${round.id}:`, pairingsError);
          return { roundId: round.id, pairings: [] };
        }

        return { roundId: round.id, pairings: pairingsData || [] };
      });

      const pairingsResults = await Promise.all(pairingsPromises);
      const pairingsMap = pairingsResults.reduce((acc, { roundId, pairings }) => {
        acc[roundId] = pairings;
        return acc;
      }, {} as { [roundId: string]: Pairing[] });

      setPairings(pairingsMap);
    } catch (error: any) {
      console.error('Error fetching rounds:', error);
      toast({
        title: "Error",
        description: "Failed to load tournament rounds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Tournament Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{tournament.name}</h1>
        <p className="text-muted-foreground mt-2">Tournament rounds and pairings</p>
      </div>

      {/* Opt-out manager moved to Participation tab only */}

      <Tabs defaultValue="rounds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rounds">Rounds & Pairings</TabsTrigger>
          {userRegistration && tournament.opt_outs_enabled && (
            <TabsTrigger value="participation">My Participation</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="rounds">
          <div className="space-y-6">
            {rounds.map(round => (
              <Card key={round.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {round.name}
                      </CardTitle>
                      <CardDescription>
                        Round {round.round_number} • Status: {round.status}
                      </CardDescription>
                    </div>
                    <Badge variant={round.status === 'completed' ? 'default' : 'secondary'}>
                      {round.status}
                    </Badge>
                  </div>
                  {round.scheduled_date && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(round.scheduled_date).toLocaleDateString()}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pairings[round.id]?.map(pairing => (
                      <div key={pairing.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">AFF</Badge>
                              <span className="font-medium">
                                {pairing.aff_registration?.participant_name}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {pairing.aff_registration?.school_organization || 'Independent'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">NEG</Badge>
                              <span className="font-medium">
                                {pairing.neg_registration?.participant_name}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {pairing.neg_registration?.school_organization || 'Independent'}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {pairing.scheduled_time && (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3" />
                                {new Date(pairing.scheduled_time).toLocaleString()}
                              </div>
                            )}
                            {pairing.room && (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {pairing.room}
                              </div>
                            )}
                            {pairing.judge_profiles && (
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3" />
                                {pairing.judge_profiles.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <EmptyState
                        icon={FileText}
                        title="No Pairings Released"
                        description="Pairings for this round haven't been released yet. Check back later!"
                        withCard={false}
                        className="py-4"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {rounds.length === 0 && (
              <EmptyState
                icon={Calendar}
                title="No Rounds Yet"
                description="Tournament rounds haven't been created yet. Check back later!"
              />
            )}
          </div>
        </TabsContent>

        {userRegistration && tournament.opt_outs_enabled && (
          <TabsContent value="participation">
            <RoundOptOutManager
              tournamentId={tournamentId!}
              registrationId={userRegistration.id}
              optOutsEnabled={tournament.opt_outs_enabled}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
