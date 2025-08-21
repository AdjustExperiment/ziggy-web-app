import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SpectateRequestManager } from '@/components/SpectateRequestManager';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  MapPin, 
  Calendar, 
  Trophy, 
  Eye,
  FileText
} from 'lucide-react';

interface PairingWithDetails {
  id: string;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  released: boolean;
  round: {
    id: string;
    name: string;
    round_number: number;
    scheduled_date: string | null;
  };
  aff_registration: {
    id: string;
    participant_name: string;
    partner_name: string | null;
    user_id: string;
  };
  neg_registration: {
    id: string;
    participant_name: string;
    partner_name: string | null;
    user_id: string;
  };
  judge_profile: {
    id: string;
    name: string;
    experience_level: string;
  } | null;
}

interface Tournament {
  id: string;
  name: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  format: string;
}

interface Round {
  id: string;
  name: string;
  round_number: number;
  scheduled_date: string | null;
  status: string;
}

export default function TournamentPostings() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pairings, setPairings] = useState<PairingWithDetails[]>([]);
  const [allPairings, setAllPairings] = useState<PairingWithDetails[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [userRegistrationId, setUserRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId && user) {
      fetchTournamentData();
    }
  }, [tournamentId, user]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);

      // Fetch tournament info
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Check if user is registered for this tournament
      const { data: userRegistration } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user?.id)
        .single();

      setUserRegistrationId(userRegistration?.id || null);

      // Fetch rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number');

      if (roundsError) throw roundsError;
      setRounds(roundsData || []);

      // Fetch user's pairings with all details
      if (userRegistration) {
        const { data: userPairingsData, error: userPairingsError } = await supabase
          .from('pairings')
          .select(`
            *,
            round:rounds (
              id,
              name,
              round_number,
              scheduled_date
            ),
            aff_registration:tournament_registrations!aff_registration_id (
              id,
              participant_name,
              partner_name,
              user_id
            ),
            neg_registration:tournament_registrations!neg_registration_id (
              id,
              participant_name,
              partner_name,
              user_id
            ),
            judge_profile:judge_profiles (
              id,
              name,
              experience_level
            )
          `)
          .eq('tournament_id', tournamentId)
          .or(`aff_registration_id.eq.${userRegistration.id},neg_registration_id.eq.${userRegistration.id}`)
          .eq('released', true)
          .order('round_id')
          .order('room');

        if (userPairingsError) throw userPairingsError;
        setPairings(userPairingsData || []);
      }

      // Fetch all pairings for spectate functionality
      const { data: allPairingsData, error: allPairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          round:rounds (
            id,
            name,
            round_number,
            scheduled_date
          ),
          aff_registration:tournament_registrations!aff_registration_id (
            id,
            participant_name,
            partner_name,
            user_id
          ),
          neg_registration:tournament_registrations!neg_registration_id (
            id,
            participant_name,
            partner_name,
            user_id
          ),
          judge_profile:judge_profiles (
            id,
            name,
            experience_level
          )
        `)
        .eq('tournament_id', tournamentId)
        .eq('released', true)
        .order('round_id')
        .order('room');

      if (allPairingsError) throw allPairingsError;
      setAllPairings(allPairingsData || []);

    } catch (error) {
      console.error('Error fetching tournament data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tournament postings. Please try again.',
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

  const getJudgeExperienceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert':
        return 'default';
      case 'experienced':
        return 'secondary';
      case 'novice':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const isMyPairing = (pairing: PairingWithDetails) => {
    return userRegistrationId && (
      pairing.aff_registration.id === userRegistrationId ||
      pairing.neg_registration.id === userRegistrationId
    );
  };

  const filteredPairings = selectedRound === 'all' 
    ? pairings 
    : pairings.filter(p => p.round.id === selectedRound);

  const groupedPairings = rounds.map(round => ({
    round,
    pairings: pairings.filter(p => p.round.id === round.id)
  })).filter(group => group.pairings.length > 0);

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
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tournament Postings</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-muted-foreground">
              <span className="text-xl font-medium">{tournament.name}</span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {tournament.location}
              </span>
              <Badge variant="outline">{tournament.format}</Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            {userRegistrationId && (
              <Button variant="outline" asChild>
                <Link to={`/tournaments/${tournament.id}/my-match`}>
                  <Eye className="h-4 w-4 mr-2" />
                  My Matches
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to={`/tournaments/${tournament.id}/rounds`}>
                View All Rounds
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-pairings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-pairings" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Pairings
          </TabsTrigger>
          <TabsTrigger value="spectate" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Spectate Rounds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-pairings" className="space-y-6">
          {/* Round Filter */}
          {rounds.length > 1 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedRound === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRound('all')}
                >
                  All Rounds
                </Button>
                {rounds.map(round => (
                  <Button
                    key={round.id}
                    variant={selectedRound === round.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRound(round.id)}
                  >
                    {round.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Pairings Display */}
          {!userRegistrationId ? (
            <Card>
              <CardContent className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Not Registered</h2>
                <p className="text-muted-foreground mb-4">
                  You are not registered for this tournament. Register to see your pairings.
                </p>
                <Button asChild>
                  <Link to={`/tournaments/${tournament.id}/register`}>
                    Register for Tournament
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : filteredPairings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Pairings Released</h2>
                <p className="text-muted-foreground">
                  No pairings have been released for this tournament yet. Check back later or contact the tournament organizers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {selectedRound === 'all' ? (
                // Group by rounds when showing all
                groupedPairings.map(({ round, pairings: roundPairings }) => (
                  <div key={round.id} className="space-y-4">
                    <div className="flex items-center gap-3 border-b pb-3">
                      <h2 className="text-2xl font-semibold">{round.name}</h2>
                      <Badge variant="secondary">Round {round.round_number}</Badge>
                      {round.scheduled_date && (
                        <span className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(round.scheduled_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {roundPairings.map((pairing) => (
                        <PairingCard 
                          key={pairing.id}
                          pairing={pairing}
                          isMyPairing={isMyPairing(pairing)}
                          userRegistrationId={userRegistrationId}
                          getStatusColor={getStatusColor}
                          getJudgeExperienceColor={getJudgeExperienceColor}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Show single round pairings
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredPairings.map((pairing) => (
                    <PairingCard 
                      key={pairing.id}
                      pairing={pairing}
                      isMyPairing={isMyPairing(pairing)}
                      userRegistrationId={userRegistrationId}
                      getStatusColor={getStatusColor}
                      getJudgeExperienceColor={getJudgeExperienceColor}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="spectate" className="space-y-6">
          <SpectateRequestManager 
            tournamentId={tournamentId!} 
            pairings={allPairings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PairingCardProps {
  pairing: PairingWithDetails;
  isMyPairing: boolean;
  userRegistrationId: string | null;
  getStatusColor: (status: string) => string;
  getJudgeExperienceColor: (level: string) => string;
}

function PairingCard({ pairing, isMyPairing, userRegistrationId, getStatusColor, getJudgeExperienceColor }: PairingCardProps) {
  return (
    <Card className={`hover:shadow-lg transition-all ${isMyPairing ? 'ring-2 ring-primary shadow-md' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {pairing.room || 'TBD'}
            {isMyPairing && (
              <Badge variant="default" className="text-xs">MY MATCH</Badge>
            )}
          </CardTitle>
          <Badge variant={getStatusColor(pairing.status) as any} className="text-xs">
            {pairing.status}
          </Badge>
        </div>
        {pairing.scheduled_time && (
          <CardDescription className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(pairing.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Debaters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase">Affirmative</span>
              {pairing.aff_registration.id === userRegistrationId && (
                <Badge variant="outline" className="text-xs">You</Badge>
              )}
            </div>
            <p className="font-medium text-sm">{pairing.aff_registration.participant_name}</p>
            {pairing.aff_registration.partner_name && (
              <p className="text-sm text-muted-foreground">{pairing.aff_registration.partner_name}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase">Negative</span>
              {pairing.neg_registration.id === userRegistrationId && (
                <Badge variant="outline" className="text-xs">You</Badge>
              )}
            </div>
            <p className="font-medium text-sm">{pairing.neg_registration.participant_name}</p>
            {pairing.neg_registration.partner_name && (
              <p className="text-sm text-muted-foreground">{pairing.neg_registration.partner_name}</p>
            )}
          </div>
        </div>

        {/* Judge */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Judge</span>
            {pairing.judge_profile && (
              <Badge variant={getJudgeExperienceColor(pairing.judge_profile.experience_level) as any} className="text-xs">
                {pairing.judge_profile.experience_level}
              </Badge>
            )}
          </div>
          <p className="font-medium text-sm mt-1">
            {pairing.judge_profile?.name || 'TBD'}
          </p>
        </div>

        {/* View Details Button */}
        {isMyPairing && (
          <div className="pt-2 border-t">
            <Button asChild size="sm" className="w-full">
              <Link to={`/pairings/${pairing.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details & Chat
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}