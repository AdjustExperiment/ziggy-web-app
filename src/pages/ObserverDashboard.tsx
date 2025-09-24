import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/ui/back-button';
import { Eye, Search, Calendar, Users, Clock, MapPin, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

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

export default function ObserverDashboard() {
  const { user } = useOptimizedAuth();
  const [matches, setMatches] = useState<ApprovedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    fetchApprovedMatches();

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

      const formattedMatches: ApprovedMatch[] = (data || []).map(pairing => ({
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
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match =>
    match.tournament_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.aff_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.neg_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.round_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <BackButton fallbackRoute="/dashboard">
        Back to Dashboard
      </BackButton>

      <div className="flex items-center gap-4">
        <Eye className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Observer Dashboard</h1>
          <p className="text-muted-foreground">
            View matches you've been approved to spectate
          </p>
        </div>
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
          {filteredMatches.length} approved match{filteredMatches.length !== 1 ? 'es' : ''}
        </Badge>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading approved matches...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No matches found' : 'No approved matches yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Request to spectate matches from tournament pages to see them here'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
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
                    <a href={`/pairings/${match.id}`} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Match Details
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}