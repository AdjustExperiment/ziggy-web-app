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

interface TournamentEvent {
  id: string;
  name: string;
  short_code: string;
  format_id: string | null;
  debate_formats?: {
    id: string;
    name: string;
    key: string;
  } | null;
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
  
  // Multi-format support
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    const errors: string[] = [];
    console.log('[TabulationDashboard] Starting batched data fetch for tournament:', tournamentId);
    
    try {
      setLoading(true);
      setFetchErrors([]);
      
      // Batch all queries in parallel for better performance
      const [
        tournamentResult,
        eventsResult,
        roundsResult,
        registrationsResult,
        judgesResult
      ] = await Promise.all([
        supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
        supabase.from('tournament_events').select('*, debate_formats(*)').eq('tournament_id', tournamentId).eq('is_active', true).order('name'),
        supabase.from('rounds').select('*').eq('tournament_id', tournamentId).order('round_number'),
        supabase.from('tournament_registrations').select('*').eq('tournament_id', tournamentId).order('participant_name'),
        supabase.from('judge_profiles').select('id, name, email, experience_level, specializations, status').order('name').limit(200) // Limit judges for performance
      ]);

      // Process tournament
      if (tournamentResult.error) {
        console.error('[TabulationDashboard] Tournament fetch error:', tournamentResult.error);
        errors.push(`Tournament: ${tournamentResult.error.message}`);
      } else {
        setTournament(tournamentResult.data);
      }

      // Process events
      if (eventsResult.error) {
        console.error('[TabulationDashboard] Events fetch error:', eventsResult.error);
      } else {
        setEvents(eventsResult.data || []);
      }

      // Process rounds
      if (roundsResult.error) {
        console.error('[TabulationDashboard] Rounds fetch error:', roundsResult.error);
        errors.push(`Rounds: ${roundsResult.error.message}`);
      } else {
        setRounds(roundsResult.data || []);
      }

      // Process registrations
      if (registrationsResult.error) {
        console.error('[TabulationDashboard] Registrations fetch error:', registrationsResult.error);
        errors.push(`Registrations: ${registrationsResult.error.message}`);
      } else {
        setRegistrations(registrationsResult.data || []);
      }

      // Process judges
      if (judgesResult.error) {
        console.error('[TabulationDashboard] Judges fetch error:', judgesResult.error);
        errors.push(`Judges: ${judgesResult.error.message}`);
      } else {
        setJudges(judgesResult.data || []);
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
      console.log('[TabulationDashboard] Batched fetch complete. Errors:', errors.length);
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

  // Filter data by selected event
  const filteredRounds = selectedEventId 
    ? rounds.filter(r => r.event_id === selectedEventId)
    : rounds;
  
  const filteredRegistrations = selectedEventId
    ? registrations.filter(r => r.event_id === selectedEventId)
    : registrations;

  // Get the selected event's format key for judge filtering
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedFormatKey = selectedEvent?.debate_formats?.key || null;

  const showResolutions = tournament?.resolutions_enabled;
  const showCheckIn = tournament?.check_in_enabled;
  const isPlanningPhase = tournament?.status === 'Planning Phase';
  const hasMultipleEvents = events.length > 1;

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

      {/* Event/Format Selector (for multi-format tournaments) */}
      {hasMultipleEvents && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2">Event:</span>
          <Badge 
            variant={!selectedEventId ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => setSelectedEventId(null)}
          >
            All Events
          </Badge>
          {events.map(event => (
            <Badge 
              key={event.id}
              variant={selectedEventId === event.id ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/80"
              onClick={() => setSelectedEventId(event.id)}
            >
              {event.short_code}
            </Badge>
          ))}
        </div>
      )}

      {/* Selected Event Info */}
      {selectedEventId && selectedEvent && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Viewing: {selectedEvent.name}</AlertTitle>
          <AlertDescription>
            Showing data filtered to {selectedEvent.short_code} format only. 
            {selectedEvent.debate_formats?.name && ` (${selectedEvent.debate_formats.name})`}
          </AlertDescription>
        </Alert>
      )}

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
            <div className="text-2xl font-bold">{filteredRegistrations.length}</div>
            <p className="text-sm text-muted-foreground">
              Competitors {selectedEventId && `(${selectedEvent?.short_code})`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{filteredRounds.length}</div>
            <p className="text-sm text-muted-foreground">
              Rounds {selectedEventId && `(${selectedEvent?.short_code})`}
            </p>
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
              {filteredRounds.filter(r => r.status === 'completed').length}/{filteredRounds.length}
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
            rounds={filteredRounds}
            registrations={filteredRegistrations}
            judges={judges}
            onRoundsUpdate={handleRoundsUpdate}
            onToggleRoundLock={handleToggleRoundLock}
            eventId={selectedEventId}
            formatKey={selectedFormatKey}
          />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorDirectory 
            tournamentId={tournamentId} 
            eventId={selectedEventId}
          />
        </TabsContent>

        <TabsContent value="spreadsheet">
          <SpreadsheetView 
            tournamentId={tournamentId} 
            eventId={selectedEventId}
          />
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
            registrations={filteredRegistrations}
            eventId={selectedEventId}
          />
        </TabsContent>

        <TabsContent value="breaks">
          <BreakManagerWrapper 
            tournamentId={tournamentId}
            registrations={filteredRegistrations}
          />
        </TabsContent>

        {showResolutions && (
          <TabsContent value="resolutions">
            <ResolutionsManager 
              tournamentId={tournamentId}
              rounds={filteredRounds}
            />
          </TabsContent>
        )}

        <TabsContent value="constraints">
          <ConstraintsManager 
            tournamentId={tournamentId}
            registrations={filteredRegistrations}
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