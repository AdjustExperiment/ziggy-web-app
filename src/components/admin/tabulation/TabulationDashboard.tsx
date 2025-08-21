
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Gavel, Users, Trophy, Settings, Play, Lock, RefreshCw, Send, Clipboard } from 'lucide-react';
import { PairingGenerator } from './PairingGenerator';
import { ConstraintsManager } from './ConstraintsManager';
import { BracketsManager } from './BracketsManager';
import { StandingsView } from './StandingsView';
import { AdminPostings } from '../AdminPostings';
import { Registration, JudgeProfile, Round } from '@/types/database';

interface Tournament {
  id: string;
  name: string;
}

interface TabulationDashboardProps {
  tournaments: Tournament[];
  selectedTournament: string;
  onTournamentChange: (tournamentId: string) => void;
}

export function TabulationDashboard({ 
  tournaments, 
  selectedTournament, 
  onTournamentChange 
}: TabulationDashboardProps) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('postings');
  const [ballotLoading, setBallotLoading] = useState(false);

  useEffect(() => {
    fetchJudges();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentData();
    }
  }, [selectedTournament]);

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
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  const toggleRoundLock = async (roundId: string, currentlyLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status: currentlyLocked ? 'upcoming' : 'locked' })
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

  const lockTournamentBallots = async () => {
    if (!selectedTournament) return;
    
    setBallotLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_lock_ballots', {
        _tournament_id: selectedTournament
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Locked ${data || 0} ballots for this tournament`,
      });
    } catch (error: any) {
      console.error('Error locking ballots:', error);
      toast({
        title: "Error", 
        description: "Failed to lock ballots",
        variant: "destructive",
      });
    } finally {
      setBallotLoading(false);
    }
  };

  const syncResultsFromBallots = async () => {
    setBallotLoading(true);
    try {
      const { data, error } = await supabase.rpc('recompute_results_from_ballots');

      if (error) throw error;

      toast({
        title: "Success",
        description: `Synced results from ${data || 0} tournaments with published ballots`,
      });
    } catch (error: any) {
      console.error('Error syncing results:', error);
      toast({
        title: "Error",
        description: "Failed to sync results from ballots", 
        variant: "destructive",
      });
    } finally {
      setBallotLoading(false);
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
          Comprehensive tournament management and workflow automation
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
            onChange={(e) => onTournamentChange(e.target.value)}
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
                    <p className="text-2xl font-bold">{rounds.filter(r => r.status === 'locked').length}</p>
                  </div>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Ballot & Results Management</CardTitle>
              <CardDescription>Admin controls for ballot submission and result syncing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={lockTournamentBallots}
                  disabled={ballotLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Lock All Ballots
                </Button>
                <Button
                  variant="outline" 
                  onClick={syncResultsFromBallots}
                  disabled={ballotLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Results
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Lock ballots to prevent further edits, and sync published ballots to public results tables.
              </p>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="postings" className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                Postings
              </TabsTrigger>
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

            <TabsContent value="postings">
              <AdminPostings
                tournamentId={selectedTournament}
                judges={judges}
                onUpdate={fetchTournamentData}
              />
            </TabsContent>

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
