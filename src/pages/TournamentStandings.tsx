/**
 * Ziggy Online Debate Platform
 * © 2011-2025 Justus Aryani. All Rights Reserved.
 * Proprietary and Confidential.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import {
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { useComputedStandings } from '@/hooks/useComputedStandings';
import { BackButton } from '@/components/ui/back-button';

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string;
}


export default function TournamentStandings() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Map<string, { participant_name: string; partner_name: string | null; school_organization: string | null }>>(new Map());

  // Fetch tournament info
  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchRegistrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const fetchTournament = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, status, start_date')
      .eq('id', tournamentId)
      .single();

    if (data) setTournament(data);
    setLoading(false);
  };

  const fetchRegistrations = async () => {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('id, participant_name, partner_name, school_organization')
      .eq('tournament_id', tournamentId);

    if (data) {
      const regMap = new Map();
      data.forEach(reg => {
        regMap.set(reg.id, {
          participant_name: reg.participant_name,
          partner_name: reg.partner_name,
          school_organization: reg.school_organization
        });
      });
      setRegistrations(regMap);
    }
  };

  // Use the standings hook with auto-refresh
  const {
    standings: rawStandings,
    isLoading: standingsLoading,
    computedAt,
    refetch
  } = useComputedStandings(tournamentId || '', null, {
    staleTime: 30000 // Refetch every 30 seconds
  });

  // Enrich standings with registration data
  const standings = rawStandings.map(standing => ({
    ...standing,
    registration: registrations.get(standing.registration_id)
  }));

  // Rank icons for top 3
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-medium">{rank}</span>;
    }
  };

  // Badge color based on record
  const getRecordColor = (wins: number, losses: number) => {
    if (losses === 0 && wins > 0) return 'bg-green-500/20 text-green-700';
    if (wins > losses) return 'bg-blue-500/20 text-blue-700';
    if (wins === losses) return 'bg-yellow-500/20 text-yellow-700';
    return 'bg-red-500/20 text-red-700';
  };

  if (loading || standingsLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p>Tournament not found</p>
            <Link to="/tournaments">
              <Button className="mt-4">Back to Tournaments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <BackButton fallbackRoute="/tournaments" />
          <h1 className="text-2xl font-bold mt-2">{tournament.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Live Standings
            <Badge variant="outline">{tournament.status}</Badge>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teams</p>
                <p className="text-2xl font-bold">{standings.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Undefeated</p>
                <p className="text-2xl font-bold text-green-600">
                  {standings.filter(s => s.losses === 0 && s.wins > 0).length}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Speaks</p>
                <p className="text-2xl font-bold">
                  {standings.length > 0
                    ? Math.round(standings.reduce((a, s) => a + (s.avg_speaks || 0), 0) / standings.length)
                    : 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {computedAt
                    ? new Date(computedAt).toLocaleTimeString()
                    : 'N/A'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Standings</CardTitle>
          <CardDescription>
            Rankings based on wins, speaker points, and opponent strength
          </CardDescription>
        </CardHeader>
        <CardContent>
          {standings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No standings available yet</p>
              <p className="text-sm">Check back after rounds are completed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="hidden md:table-cell">School</TableHead>
                    <TableHead className="text-center">Record</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Speaks</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((standing, index) => {
                    const teamName = standing.registration?.participant_name +
                      (standing.registration?.partner_name
                        ? ` & ${standing.registration.partner_name}`
                        : '');
                    const school = standing.registration?.school_organization || 'Independent';

                    return (
                      <TableRow key={standing.id || standing.registration_id || index}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getRankIcon(index + 1)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {teamName || 'Unknown Team'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {school}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getRecordColor(standing.wins, standing.losses)}>
                            {standing.wins}-{standing.losses}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell font-mono">
                          {(standing.total_speaks || 0).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell font-mono">
                          {(standing.avg_speaks || 0).toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back link */}
      <div className="text-center">
        <Link to={`/tournaments/${tournamentId}`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournament
          </Button>
        </Link>
      </div>
    </div>
  );
}
