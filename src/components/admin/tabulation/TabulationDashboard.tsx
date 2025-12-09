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
  const [activeTab, setActiveTab] = useState('draw');
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
          Manage tournament draw, results, and standings.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 lg:grid-cols-8">
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="adjudicators">Adjudicators</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="draw">
          <PairingGenerator 
            tournamentId={tournamentId}
            rounds={rounds}
            registrations={registrations}
            judges={judges}
            onRoundsUpdate={handleRoundsUpdate}
            onToggleRoundLock={handleToggleRoundLock}
          />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorDirectory tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="participation">
          <ParticipationManager tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="adjudicators">
          <JudgePostingsView tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="results">
          <StandingsView 
            tournamentId={tournamentId}
            registrations={registrations}
          />
        </TabsContent>

        <TabsContent value="breaks">
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

        <TabsContent value="config">
          <TabulationRulesManager tournamentId={tournamentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
