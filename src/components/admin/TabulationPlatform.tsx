
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Gavel, Users, Trophy, Settings, Play, Lock, Unlock } from 'lucide-react';
import { PairingGenerator } from './tabulation/PairingGenerator';
import { ConstraintsManager } from './tabulation/ConstraintsManager';
import { BracketsManager } from './tabulation/BracketsManager';
import { StandingsView } from './tabulation/StandingsView';
import { Registration, JudgeProfile, Round } from '@/types/database';

interface Tournament {
  id: string;
  name: string;
  tab_settings: any;
}

export function TabulationPlatform() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pairings');

  useEffect(() => {
    fetchTournaments();
    fetchJudges();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentData();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, tab_settings')
        .order('name');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJudges = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setJudges(data || []);
    } catch (error: any) {
      console.error('Error fetching judges:', error);
    }
  };

  const fetchTournamentData = async () => {
    if (!selectedTournament) return;

    try {
      // Fetch rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('round_number');

      if (roundsError) throw roundsError;
      setRounds(roundsData || []);

      // Fetch registrations
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('participant_name');

      if (registrationsError) throw registrationsError;
      setRegistrations(registrationsData as Registration[] || []);
    } catch (error: any) {
      console.error('Error fetching tournament data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournament data",
        variant: "destructive",
      });
    }
  };

  const toggleRoundLock = async (roundId: string, currentlyLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ locked: !currentlyLocked })
        .eq('id', roundId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Round ${currentlyLocked ? 'unlocked' : 'locked'} successfully`,
      });
      
      fetchTournamentData();
    } catch (error: any) {
      console.error('Error toggling round lock:', error);
      toast({
        title: "Error",
        description: "Failed to toggle round lock",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tabulation Platform</h2>
        <p className="text-muted-foreground">
          Automated pairing generation, constraint management, and bracket creation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Selection</CardTitle>
          <CardDescription>Select a tournament to manage tabulation</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a tournament...</option>
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedTournament && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Teams</p>
                    <p className="text-2xl font-bold">{registrations.length}</p>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Judges</p>
                    <p className="text-2xl font-bold">{judges.length}</p>
                  </div>
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rounds</p>
                    <p className="text-2xl font-bold">{rounds.length}</p>
                  </div>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Locked Rounds</p>
                    <p className="text-2xl font-bold">{rounds.filter(r => r.locked).length}</p>
                  </div>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pairings" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pairings
              </TabsTrigger>
              <TabsTrigger value="constraints" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Constraints
              </TabsTrigger>
              <TabsTrigger value="brackets" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Brackets
              </TabsTrigger>
              <TabsTrigger value="standings" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Standings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pairings">
              <PairingGenerator
                tournamentId={selectedTournament}
                rounds={rounds}
                registrations={registrations}
                judges={judges}
                onRoundsUpdate={fetchTournamentData}
                onToggleRoundLock={toggleRoundLock}
              />
            </TabsContent>

            <TabsContent value="constraints">
              <ConstraintsManager
                tournamentId={selectedTournament}
                registrations={registrations}
                judges={judges}
              />
            </TabsContent>

            <TabsContent value="brackets">
              <BracketsManager
                tournamentId={selectedTournament}
                rounds={rounds}
                registrations={registrations}
                judges={judges}
                onRoundsUpdate={fetchTournamentData}
              />
            </TabsContent>

            <TabsContent value="standings">
              <StandingsView
                tournamentId={selectedTournament}
                registrations={registrations}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
