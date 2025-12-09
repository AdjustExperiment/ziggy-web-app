import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/ui/back-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, Search, Calendar, Users, Clock, MapPin, ExternalLink, Shield, HelpCircle, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ApprovedMatch {
  id: string;
  tournament_name: string;
  round_name: string;
  aff_team: string;
  neg_team: string;
  scheduled_time?: string;
  room?: string;
  status: string;
  created_at: string;
}

interface AdminAssignedTournament {
  id: string;
  tournament_id: string;
  tournament_name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

export default function ObserverDashboard() {
  const { user } = useOptimizedAuth();
  const [matches, setMatches] = useState<ApprovedMatch[]>([]);
  const [adminAssignedTournaments, setAdminAssignedTournaments] = useState<AdminAssignedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasObserverRole, setHasObserverRole] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchData();

    // Set up real-time subscription for approved spectate requests
    const channel = supabase
      .channel('observer-matches')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'spectate_requests',
          filter: 'status=eq.approved'
        }, 
        () => {
          fetchApprovedMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchData = async () => {
    await Promise.all([
      fetchApprovedMatches(),
      fetchAdminAssignedTournaments(),
      checkObserverRole()
    ]);
    setLoading(false);
  };

  const checkObserverRole = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'observer')
        .maybeSingle();
      
      setHasObserverRole(!!data);
    } catch (error) {
      console.error('Error checking observer role:', error);
    }
  };

  const fetchAdminAssignedTournaments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tournament_observers')
        .select(`
          id,
          tournament_id,
          tournaments!inner (
            name,
            start_date,
            end_date,
            status
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formatted: AdminAssignedTournament[] = (data || []).map((obs: any) => ({
        id: obs.id,
        tournament_id: obs.tournament_id,
        tournament_name: obs.tournaments.name,
        start_date: obs.tournaments.start_date,
        end_date: obs.tournaments.end_date,
        status: obs.tournaments.status
      }));

      setAdminAssignedTournaments(formatted);
    } catch (error) {
      console.error('Error fetching admin-assigned tournaments:', error);
    }
  };

  const fetchApprovedMatches = async () => {
    if (!user) return;

    try {
      // First get spectate requests for this user
      const { data: spectateData, error: spectateError } = await supabase
        .from('spectate_requests')
        .select('pairing_id')
        .eq('status', 'approved')
        .eq('requester_user_id', user.id);

      if (spectateError) throw spectateError;

      if (!spectateData || spectateData.length === 0) {
        setMatches([]);
        return;
      }

      const pairingIds = spectateData.map(sr => sr.pairing_id);

      // Then get pairing details for those IDs
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          id,
          scheduled_time,
          room,
          status,
          tournaments!inner (
            name
          ),
          rounds!inner (
            name
          ),
          aff_registration:tournament_registrations!aff_registration_id (
            participant_name,
            school_organization
          ),
          neg_registration:tournament_registrations!neg_registration_id (
            participant_name,
            school_organization
          )
        `)
        .in('id', pairingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMatches: ApprovedMatch[] = (data || []).map((pairing: any) => ({
        id: pairing.id,
        tournament_name: pairing.tournaments.name,
        round_name: pairing.rounds.name,
        aff_team: `${pairing.aff_registration.participant_name}${
          pairing.aff_registration.school_organization 
            ? ` (${pairing.aff_registration.school_organization})` 
            : ''
        }`,
        neg_team: `${pairing.neg_registration.participant_name}${
          pairing.neg_registration.school_organization 
            ? ` (${pairing.neg_registration.school_organization})` 
            : ''
        }`,
        scheduled_time: pairing.scheduled_time,
        room: pairing.room,
        status: pairing.status,
        created_at: new Date().toISOString()
      }));

      setMatches(formattedMatches);
    } catch (error) {
      console.error('Error fetching approved matches:', error);
    }
  };

  const filteredMatches = matches.filter(match =>
    match.tournament_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.aff_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.neg_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.round_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTournaments = adminAssignedTournaments.filter(t =>
    t.tournament_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasNoObservations = matches.length === 0 && adminAssignedTournaments.length === 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <BackButton fallbackRoute="/dashboard">
        Back to Dashboard
      </BackButton>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Eye className="h-8 w-8 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Observer Dashboard</h1>
              {hasObserverRole && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Observer
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              View matches and tournaments you've been approved to observe
            </p>
          </div>
        </div>
        
        <Button variant="outline" size="sm" asChild>
          <Link to="/contact?subject=Observer%20Role%20Question">
            <HelpCircle className="h-4 w-4 mr-2" />
            Contact Admin
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tournaments, teams, or rounds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {filteredMatches.length + filteredTournaments.length} observation{(filteredMatches.length + filteredTournaments.length) !== 1 ? 's' : ''}
        </Badge>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading observations...</p>
        </div>
      ) : hasNoObservations ? (
        <Card>
          <CardContent className="text-center py-8">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No observations yet
            </h3>
            <p className="text-muted-foreground mb-4">
              You're not currently assigned to observe any tournaments or matches.
              Request to spectate matches from tournament pages or contact an admin.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline">
                <Link to="/tournaments">Browse Tournaments</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact?subject=Observer%20Access%20Request">
                  Request Observer Access
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Admin-Assigned Tournaments Section */}
          {filteredTournaments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Admin-Assigned Tournaments</h2>
                <Badge variant="outline">{filteredTournaments.length}</Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTournaments.map((tournament) => (
                  <Card key={tournament.id} className="hover:shadow-lg transition-shadow border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{tournament.tournament_name}</CardTitle>
                        <Badge variant="secondary" className="shrink-0">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Admin Assigned
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant={tournament.status === 'active' ? 'default' : 'outline'}>
                          {tournament.status}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(tournament.start_date || tournament.end_date) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {tournament.start_date && format(new Date(tournament.start_date), 'MMM d, yyyy')}
                          {tournament.end_date && ` - ${format(new Date(tournament.end_date), 'MMM d, yyyy')}`}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link to={`/tournaments/${tournament.tournament_id}/postings`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Postings
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Per-Pairing Spectate Requests Section */}
          {filteredMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Approved Match Observations</h2>
                <Badge variant="outline">{filteredMatches.length}</Badge>
              </div>

              <div className="grid gap-4">
                {filteredMatches.map((match) => (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{match.tournament_name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {match.round_name}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={
                            match.status === 'completed' ? 'default' : 
                            match.status === 'in_progress' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {match.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Affirmative Team</p>
                          <p className="text-sm">{match.aff_team}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Negative Team</p>
                          <p className="text-sm">{match.neg_team}</p>
                        </div>
                      </div>

                      {(match.scheduled_time || match.room) && (
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {match.scheduled_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(match.scheduled_time), 'PPp')}
                            </div>
                          )}
                          {match.room && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {match.room}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/pairings/${match.id}`} className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            View Match Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}