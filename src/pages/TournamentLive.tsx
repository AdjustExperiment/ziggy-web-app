import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Users, Loader2, AlertCircle, Bell, Lock } from 'lucide-react';
import { format } from 'date-fns';
import TournamentHeader from '@/components/tournament/TournamentHeader';
import RoundSelector from '@/components/tournament/RoundSelector';
import RoundPairingsTable from '@/components/tournament/RoundPairingsTable';
import RoundEmptyState from '@/components/tournament/RoundEmptyState';
import TournamentSidebar from '@/components/tournament/TournamentSidebar';
import { useTournamentRealtime } from '@/hooks/useTournamentRealtime';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  is_online: boolean;
  tournament_type: string | null;
  allow_judge_volunteering: boolean;
  auto_approve_judge_volunteers: boolean;
}

interface TournamentEvent {
  id: string;
  name: string;
  short_code: string;
  format_id: string | null;
  debate_formats?: {
    name: string;
  } | null;
}

interface Round {
  id: string;
  name: string;
  round_number: number;
  status: string;
  scheduled_date: string | null;
  event_id: string | null;
}

interface Registration {
  id: string;
  participant_name: string;
  partner_name: string | null;
  school_organization: string | null;
  participant_email: string;
  user_id: string;
}

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  alumni: boolean;
  user_id: string | null;
}

interface Pairing {
  id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  judge_id: string | null;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  result: any;
  released: boolean;
  event_id: string | null;
}

export default function TournamentLive() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useOptimizedAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User's role in this tournament
  const [userRegistrationId, setUserRegistrationId] = useState<string | null>(null);
  const [userJudgeProfileId, setUserJudgeProfileId] = useState<string | null>(null);
  const [isObserver, setIsObserver] = useState(false);

  // Fetch tournament data
  useEffect(() => {
    const fetchTournamentData = async () => {
      if (!tournamentId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch tournament
        const { data: tournamentData, error: tournamentError } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single();

        if (tournamentError) throw tournamentError;
        setTournament(tournamentData);

        // Fetch events
        const { data: eventsData } = await supabase
          .from('tournament_events')
          .select('*, debate_formats(name)')
          .eq('tournament_id', tournamentId)
          .eq('is_active', true);
        
        setEvents(eventsData || []);
        if (eventsData && eventsData.length > 0 && !selectedEventId) {
          setSelectedEventId(eventsData[0].id);
        }

        // Fetch rounds
        const { data: roundsData } = await supabase
          .from('rounds')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('round_number', { ascending: true });
        
        setRounds(roundsData || []);
        
        // Select latest active round or first round
        if (roundsData && roundsData.length > 0 && !selectedRoundId) {
          const activeRound = roundsData.find(r => r.status === 'in_progress') || roundsData[roundsData.length - 1];
          setSelectedRoundId(activeRound.id);
        }

        // Fetch registrations
        const { data: regsData } = await supabase
          .from('tournament_registrations')
          .select('id, participant_name, partner_name, school_organization, participant_email, user_id')
          .eq('tournament_id', tournamentId);
        
        setRegistrations(regsData || []);

        // Check if user is registered
        if (user && regsData) {
          const userReg = regsData.find(r => r.user_id === user.id);
          if (userReg) {
            setUserRegistrationId(userReg.id);
          }
        }

        // Fetch judges
        const { data: judgesData } = await supabase
          .from('judge_profiles')
          .select('id, name, email, alumni, user_id');
        
        setJudges(judgesData || []);

        // Check if user is a judge
        if (user && judgesData) {
          const userJudge = judgesData.find(j => j.user_id === user.id);
          if (userJudge) {
            setUserJudgeProfileId(userJudge.id);
          }
        }

        // Check if user is an observer
        if (user) {
          const { data: observerData } = await supabase
            .from('tournament_observers')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('user_id', user.id)
            .maybeSingle();
          
          setIsObserver(!!observerData);
        }

        // Fetch sponsors
        const { data: sponsorLinks } = await supabase
          .from('tournament_sponsor_links')
          .select('*, sponsor_profiles(*)')
          .eq('tournament_id', tournamentId);
        
        if (sponsorLinks) {
          setSponsors(sponsorLinks.map(link => ({
            id: (link.sponsor_profiles as any)?.id,
            company_name: (link.sponsor_profiles as any)?.company_name || (link.sponsor_profiles as any)?.organization_name,
            logo_url: (link.sponsor_profiles as any)?.logo_url,
            tier: link.tier
          })).filter(s => s.id));
        }

      } catch (err: any) {
        console.error('Error fetching tournament:', err);
        setError(err.message || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournamentId, user]);

  // Fetch pairings when round changes - admins see all, others see released only
  const fetchPairings = useCallback(async () => {
    if (!selectedRoundId) return;

    if (import.meta.env.DEV) {
      console.log('[TournamentLive] Fetching pairings for round:', selectedRoundId, { isAdmin });
    }

    let query = supabase
      .from('pairings')
      .select('*')
      .eq('round_id', selectedRoundId)
      .order('room_rank', { ascending: true });

    // Non-admins only see released pairings
    if (!isAdmin) {
      query = query.eq('released', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pairings:', error);
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[TournamentLive] Fetched pairings:', data?.length, 
        'released:', data?.filter(p => p.released).length,
        'unreleased:', data?.filter(p => !p.released).length
      );
    }

    setPairings(data || []);
  }, [selectedRoundId, isAdmin]);

  useEffect(() => {
    fetchPairings();
  }, [fetchPairings]);

  // Real-time subscriptions - replace polling
  useTournamentRealtime({
    tournamentId: tournamentId || null,
    onRoundUpdate: () => fetchPairings(),
    onPairingUpdate: () => fetchPairings(),
    showNotifications: true
  });

  // Push notifications
  const { requestPermission, isEnabled: pushEnabled } = usePushNotifications({
    tournamentId,
    registrationId: userRegistrationId,
    judgeProfileId: userJudgeProfileId
  });

  // Derived state for empty states
  const hasUnreleasedPairings = useMemo(() => {
    return pairings.some(p => !p.released);
  }, [pairings]);

  const releasedPairings = useMemo(() => {
    return pairings.filter(p => p.released);
  }, [pairings]);

  // Filter rounds by selected event
  const filteredRounds = useMemo(() => {
    if (!selectedEventId || events.length <= 1) return rounds;
    return rounds.filter(r => r.event_id === selectedEventId || !r.event_id);
  }, [rounds, selectedEventId, events]);

  // Enrich pairings with team and judge data
  const enrichedPairings = useMemo(() => {
    return pairings.map(p => ({
      ...p,
      aff_team: registrations.find(r => r.id === p.aff_registration_id),
      neg_team: registrations.find(r => r.id === p.neg_registration_id),
      judge: judges.find(j => j.id === p.judge_id) || null
    }));
  }, [pairings, registrations, judges]);

  // Determine user's role
  const userRole = useMemo(() => {
    if (isAdmin) return 'admin';
    if (userJudgeProfileId) return 'judge';
    if (userRegistrationId) return 'competitor';
    if (isObserver) return 'observer';
    return 'spectator';
  }, [isAdmin, userJudgeProfileId, userRegistrationId, isObserver]);

  const selectedRound = rounds.find(r => r.id === selectedRoundId);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-8 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="flex items-center gap-4 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <h2 className="font-semibold text-lg">Failed to load tournament</h2>
              <p className="text-muted-foreground">{error || 'Tournament not found'}</p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)} className="ml-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Tournament Header with Toggleable Panels */}
      <TournamentHeader 
        tournament={tournament} 
        sponsors={sponsors}
        formatName={selectedEvent?.debate_formats?.name}
      />

      {/* Event Tabs (if multi-format) */}
      {events.length > 1 && (
        <Tabs value={selectedEventId || ''} onValueChange={setSelectedEventId}>
          <TabsList>
            {events.map((event) => (
              <TabsTrigger key={event.id} value={event.id}>
                {event.short_code || event.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Round Selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rounds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoundSelector
            rounds={filteredRounds}
            selectedRoundId={selectedRoundId}
            onSelectRound={setSelectedRoundId}
          />
        </CardContent>
      </Card>

      {/* Selected Round Details */}
      {selectedRound && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{selectedRound.name}</CardTitle>
              <div className="flex items-center gap-2">
                {selectedRound.scheduled_date && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedRound.scheduled_date), 'MMM d, yyyy')}
                  </Badge>
                )}
                <Badge 
                  className={
                    selectedRound.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : selectedRound.status === 'in_progress'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {selectedRound.status === 'completed' ? 'Completed' : 
                   selectedRound.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {enrichedPairings.length} pairings
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {enrichedPairings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pairings have been released for this round yet.</p>
              </div>
            ) : (
              <RoundPairingsTable
                pairings={enrichedPairings}
                roundId={selectedRoundId!}
                tournamentId={tournament.id}
                userRole={userRole}
                userRegistrationId={userRegistrationId}
                userJudgeProfileId={userJudgeProfileId}
                allowJudgeVolunteering={tournament.allow_judge_volunteering}
                onRefresh={() => {
                  // Trigger refetch
                  setSelectedRoundId(prev => prev);
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* No rounds message */}
      {filteredRounds.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Rounds Available</h3>
            <p className="text-muted-foreground">
              Rounds haven't been created for this tournament yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
