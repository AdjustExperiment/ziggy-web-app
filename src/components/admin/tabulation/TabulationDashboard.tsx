import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Info } from 'lucide-react';
import { CompetitorDirectory } from './CompetitorDirectory';
import { ParticipationManager } from './ParticipationManager';
import { TabulationRulesManager } from './TabulationRulesManager';
import { JudgePostingsView } from './JudgePostingsView';
import { PairingGenerator } from './PairingGenerator';
import { StandingsView } from './StandingsView';
import { BracketsManager } from './BracketsManager';
import { ConstraintsManager } from './ConstraintsManager';
import { BreakManagerWrapper } from './BreakManagerWrapper';
import { ResolutionsManager } from './ResolutionsManager';
import { CheckInManager } from './CheckInManager';
import { SpreadsheetView } from './SpreadsheetView';

interface TabulationDashboardProps {
  tournamentId: string;
}

export default function TabulationDashboard({ tournamentId }: TabulationDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('draw');
  const [rounds, setRounds] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchErrors, setFetchErrors] = useState<string[]>([]);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    const errors: string[] = [];
    console.log('[TabulationDashboard] Starting data fetch for tournament:', tournamentId);
    
    try {
      setLoading(true);
      setFetchErrors([]);
      
      // Fetch tournament
      console.log('[TabulationDashboard] Fetching tournament...');
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*, debate_formats:format(*)')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) {
        console.error('[TabulationDashboard] Tournament fetch error:', tournamentError);
        errors.push(`Tournament: ${tournamentError.message}`);
      } else {
        console.log('[TabulationDashboard] Tournament fetched:', tournamentData?.name);
        setTournament(tournamentData);
      }

      // Fetch rounds
      console.log('[TabulationDashboard] Fetching rounds...');
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number');

      if (roundsError) {
        console.error('[TabulationDashboard] Rounds fetch error:', roundsError);
        errors.push(`Rounds: ${roundsError.message}`);
      } else {
        console.log('[TabulationDashboard] Rounds fetched:', roundsData?.length);
        setRounds(roundsData || []);
      }

      // Fetch registrations
      console.log('[TabulationDashboard] Fetching registrations...');
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('participant_name');

      if (registrationsError) {
        console.error('[TabulationDashboard] Registrations fetch error:', registrationsError);
        errors.push(`Registrations: ${registrationsError.message}`);
      } else {
        console.log('[TabulationDashboard] Registrations fetched:', registrationsData?.length);
        setRegistrations(registrationsData || []);
      }

      // Fetch judges (tournament-specific via pairing_judge_assignments or global)
      console.log('[TabulationDashboard] Fetching judges...');
      const { data: judgesData, error: judgesError } = await supabase
        .from('judge_profiles')
        .select('*')
        .order('name');

      if (judgesError) {
        console.error('[TabulationDashboard] Judges fetch error:', judgesError);
        errors.push(`Judges: ${judgesError.message}`);
      } else {
        console.log('[TabulationDashboard] Judges fetched:', judgesData?.length);
        setJudges(judgesData || []);
      }

      if (errors.length > 0) {
        setFetchErrors(errors);
        toast({
          title: "Partial Data Load",
          description: `Some data failed to load: ${errors.join(', ')}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[TabulationDashboard] Unexpected error:', error);
      errors.push(`Unexpected: ${error.message}`);
      setFetchErrors(errors);
      toast({
        title: "Error",
        description: "Failed to fetch tournament data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('[TabulationDashboard] Fetch complete. Errors:', errors.length);
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
      console.error('[TabulationDashboard] Toggle round lock error:', error);
      toast({
        title: "Error",
        description: "Failed to update round status",
        variant: "destructive",
      });
    }
  };

  const showResolutions = tournament?.resolutions_enabled;
  const showCheckIn = tournament?.check_in_enabled;
  const isPlanningPhase = tournament?.status === 'Planning Phase';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tabulation Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tournament draw, results, and standings.
          </p>
        </div>
        {tournament && (
          <Badge variant={isPlanningPhase ? 'secondary' : 'default'}>
            {tournament.status}
          </Badge>
        )}
      </div>

      {/* Planning Phase Warning */}
      {isPlanningPhase && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Tournament in Planning Phase</AlertTitle>
          <AlertDescription>
            This tournament is still in the planning phase. Most tabulation features are available 
            for setup, but pairings should only be generated after registration opens and competitors 
            are registered.
          </AlertDescription>
        </Alert>
      )}

      {/* Fetch Errors */}
      {fetchErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data Loading Issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {fetchErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{registrations.length}</div>
            <p className="text-sm text-muted-foreground">Competitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{rounds.length}</div>
            <p className="text-sm text-muted-foreground">Rounds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{judges.length}</div>
            <p className="text-sm text-muted-foreground">Judges</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {rounds.filter(r => r.status === 'completed').length}/{rounds.length}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="spreadsheet">Spreadsheet</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
          {showCheckIn && <TabsTrigger value="checkin">Check-In</TabsTrigger>}
          <TabsTrigger value="adjudicators">Adjudicators</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          {showResolutions && <TabsTrigger value="resolutions">Resolutions</TabsTrigger>}
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

        <TabsContent value="spreadsheet">
          <SpreadsheetView tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value="participation">
          <ParticipationManager tournamentId={tournamentId} />
        </TabsContent>

        {showCheckIn && (
          <TabsContent value="checkin">
            <CheckInManager tournamentId={tournamentId} />
          </TabsContent>
        )}

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
          <BreakManagerWrapper 
            tournamentId={tournamentId}
            registrations={registrations}
          />
        </TabsContent>

        {showResolutions && (
          <TabsContent value="resolutions">
            <ResolutionsManager 
              tournamentId={tournamentId}
              rounds={rounds}
            />
          </TabsContent>
        )}

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