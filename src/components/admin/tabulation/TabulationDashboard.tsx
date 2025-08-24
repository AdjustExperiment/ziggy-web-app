import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CompetitorDirectory } from './CompetitorDirectory';
import { ParticipationManager } from './ParticipationManager';
import { TabulationRulesManager } from './TabulationRulesManager';
import { JudgePostingsView } from './JudgePostingsView';
import { PairingGenerator } from './PairingGenerator';
import { StandingsView } from './StandingsView';
import { BracketsManager } from './BracketsManager';
import { ConstraintsManager } from './ConstraintsManager';

interface TabulationDashboardProps {
  tournamentId: string;
}

export default function TabulationDashboard({ tournamentId }: TabulationDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('competitors');
  const [rounds, setRounds] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      
      // Fetch rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number');

      if (roundsError) throw roundsError;

      // Fetch registrations
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('participant_name');

      if (registrationsError) throw registrationsError;

      // Fetch judges
      const { data: judgesData, error: judgesError } = await supabase
        .from('judge_profiles')
        .select('*')
        .order('name');

      if (judgesError) throw judgesError;

      setRounds(roundsData || []);
      setRegistrations(registrationsData || []);
      setJudges(judgesData || []);
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

  const handleRoundsUpdate = () => {
    fetchTournamentData();
  };

  const handleToggleRoundLock = async (roundId: string, locked: boolean) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status: locked ? 'locked' : 'upcoming' })
        .eq('id', roundId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Round ${locked ? 'locked' : 'unlocked'} successfully`,
      });

      fetchTournamentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update round status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tabulation Dashboard</h1>
        <p className="text-muted-foreground">
          Manage tournament participants, pairings, and standings.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="pairings">Pairings</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="brackets">Brackets</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="competitors">
          <CompetitorDirectory tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="pairings">
          <PairingGenerator 
            tournamentId={tournamentId}
            rounds={rounds}
            registrations={registrations}
            judges={judges}
            onRoundsUpdate={handleRoundsUpdate}
            onToggleRoundLock={handleToggleRoundLock}
          />
        </TabsContent>

        <TabsContent value="participation">
          <ParticipationManager tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="judges">
          <JudgePostingsView tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="standings">
          <StandingsView 
            tournamentId={tournamentId}
            registrations={registrations}
          />
        </TabsContent>

        <TabsContent value="brackets">
          <BracketsManager 
            tournamentId={tournamentId}
            rounds={rounds}
            registrations={registrations}
          />
        </TabsContent>

        <TabsContent value="constraints">
          <ConstraintsManager 
            tournamentId={tournamentId}
            registrations={registrations}
            judges={judges}
          />
        </TabsContent>

        <TabsContent value="rules">
          <TabulationRulesManager tournamentId={tournamentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}