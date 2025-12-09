import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Medal, 
  Award, 
  Users, 
  TrendingUp, 
  RotateCcw,
  Download,
  Star,
  ArrowUpDown
} from 'lucide-react';

interface StandingsViewProps {
  tournamentId: string;
  registrations: any[];
}

interface TeamStanding {
  teamId: string;
  teamName: string;
  school: string;
  wins: number;
  losses: number;
  totalSpeaks: number;
  avgSpeaks: number;
  opponentWins: number;
  rank: number;
  isBreaking?: boolean;
}

type SortField = 'rank' | 'wins' | 'totalSpeaks' | 'avgSpeaks' | 'opponentWins';
type SortOrder = 'asc' | 'desc';

export function StandingsView({ tournamentId, registrations }: StandingsViewProps) {
  const { toast } = useToast();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [breakSize, setBreakSize] = useState<number>(8);

  useEffect(() => {
    if (tournamentId && registrations.length > 0) {
      fetchStandings();
    }
  }, [tournamentId, registrations]);

  // Fetch from tournament_standings table
  const fetchStandings = async () => {
    try {
      setLoading(true);

      const { data: dbStandings, error } = await (supabase
        .from('tournament_standings' as any)
        .select(`
          *,
          registration:tournament_registrations(
            id,
            participant_name,
            partner_name,
            school_organization
          )
        `) as any)
        .eq('tournament_id', tournamentId)
        .order('wins', { ascending: false });

      if (error) throw error;

      if (dbStandings && dbStandings.length > 0) {
        // Map DB standings to our interface
        const mapped: TeamStanding[] = dbStandings.map((s: any, index: number) => ({
          teamId: s.registration_id,
          teamName: s.registration?.participant_name + 
            (s.registration?.partner_name ? ` & ${s.registration.partner_name}` : ''),
          school: s.registration?.school_organization || 'Independent',
          wins: s.wins,
          losses: s.losses,
          totalSpeaks: parseFloat(s.speaks_total) || 0,
          avgSpeaks: parseFloat(s.speaks_avg) || 0,
          opponentWins: parseFloat(s.opp_strength) || 0,
          rank: index + 1,
        }));

        // Sort and assign ranks
        sortAndRankStandings(mapped);
        setStandings(mapped);
        setLastUpdated(new Date());
      } else {
        // Fallback: calculate from pairings
        await calculateFromPairings();
      }
    } catch (error: any) {
      console.error('Error fetching standings:', error);
      await calculateFromPairings();
    } finally {
      setLoading(false);
    }
  };

  // Fallback calculation from pairings
  const calculateFromPairings = async () => {
    try {
      const { data: pairings, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_registration:tournament_registrations!aff_registration_id(*),
          neg_registration:tournament_registrations!neg_registration_id(*)
        `)
        .eq('tournament_id', tournamentId);

      if (pairingsError) throw pairingsError;

      // Build standings map
      const statsMap = new Map<string, {
        wins: number;
        losses: number;
        speaks: number;
        rounds: number;
        opponents: string[];
      }>();

      // Initialize all registrations
      registrations.forEach((reg: any) => {
        statsMap.set(reg.id, { wins: 0, losses: 0, speaks: 0, rounds: 0, opponents: [] });
      });

      // Process pairings with results
      pairings?.forEach((pairing: any) => {
        if (!pairing.result?.winner) return;

        const affId = pairing.aff_registration_id;
        const negId = pairing.neg_registration_id;
        const winner = pairing.result.winner;
        const affSpeaks = parseFloat(pairing.result.aff_speaks) || 0;
        const negSpeaks = parseFloat(pairing.result.neg_speaks) || 0;

        // Update AFF team stats
        const affStats = statsMap.get(affId);
        if (affStats) {
          if (winner === 'aff') affStats.wins++;
          else affStats.losses++;
          affStats.speaks += affSpeaks;
          affStats.rounds++;
          affStats.opponents.push(negId);
        }

        // Update NEG team stats
        const negStats = statsMap.get(negId);
        if (negStats) {
          if (winner === 'neg') negStats.wins++;
          else negStats.losses++;
          negStats.speaks += negSpeaks;
          negStats.rounds++;
          negStats.opponents.push(affId);
        }
      });

      // Calculate opponent strength (sum of opponent wins)
      const standingsData: TeamStanding[] = registrations.map((reg: any) => {
        const stats = statsMap.get(reg.id) || { wins: 0, losses: 0, speaks: 0, rounds: 0, opponents: [] };
        const oppWins = stats.opponents.reduce((sum, oppId) => {
          const oppStats = statsMap.get(oppId);
          return sum + (oppStats?.wins || 0);
        }, 0);

        return {
          teamId: reg.id,
          teamName: reg.participant_name + (reg.partner_name ? ` & ${reg.partner_name}` : ''),
          school: reg.school_organization || 'Independent',
          wins: stats.wins,
          losses: stats.losses,
          totalSpeaks: stats.speaks,
          avgSpeaks: stats.rounds > 0 ? stats.speaks / stats.rounds : 0,
          opponentWins: oppWins,
          rank: 0,
        };
      });

      sortAndRankStandings(standingsData);
      setStandings(standingsData);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error calculating standings:', error);
      toast({
        title: "Error",
        description: "Failed to calculate standings",
        variant: "destructive",
      });
    }
  };

  const sortAndRankStandings = (data: TeamStanding[]) => {
    // Sort by wins (desc), then total speaks (desc), then opp wins (desc)
    data.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.totalSpeaks !== b.totalSpeaks) return b.totalSpeaks - a.totalSpeaks;
      return b.opponentWins - a.opponentWins;
    });

    // Assign ranks
    data.forEach((team, index) => {
      team.rank = index + 1;
      team.isBreaking = index < breakSize;
    });
  };

  // Recalculate and sync to database
  const syncStandings = async () => {
    try {
      setSyncing(true);
      
      // Call the database function to recalculate
      const { error } = await (supabase.rpc as any)('recalc_tournament_standings', {
        _tournament_id: tournamentId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Standings recalculated and synced",
      });

      await fetchStandings();
    } catch (error: any) {
      console.error('Error syncing standings:', error);
      toast({
        title: "Error",
        description: "Failed to sync standings",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }

    const sorted = [...standings].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      return (aVal - bVal) * multiplier;
    });

    setStandings(sorted);
  };

  const exportStandings = () => {
    const csv = [
      ['Rank', 'Team', 'School', 'Wins', 'Losses', 'Total Speaks', 'Avg Speaks', 'Opp Strength'].join(','),
      ...standings.map(s => [
        s.rank,
        `"${s.teamName}"`,
        `"${s.school}"`,
        s.wins,
        s.losses,
        s.totalSpeaks.toFixed(1),
        s.avgSpeaks.toFixed(1),
        s.opponentWins
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `standings-${tournamentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="h-5 w-5 flex items-center justify-center text-sm font-medium">{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number): "default" | "secondary" | "outline" => {
    if (rank === 1) return 'default';
    if (rank === 2) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tournament Standings
              </CardTitle>
              <CardDescription>
                Rankings based on wins, speaker points, and opponent strength
                {lastUpdated && (
                  <span className="block text-xs mt-1">
                    Last updated: {lastUpdated.toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportStandings}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={syncStandings}
                disabled={syncing}
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Recalculate'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {standings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Standings Yet</h3>
              <p className="text-muted-foreground">
                Standings will appear once rounds are completed and ballots are submitted.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Teams</p>
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
                          {standings.length > 0 ? 
                            Math.round(standings.reduce((acc, s) => acc + s.avgSpeaks, 0) / standings.length) : 0}
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
                        <p className="text-sm text-muted-foreground">Breaking Teams</p>
                        <p className="text-2xl font-bold text-primary">
                          {breakSize}
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Standings Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('rank')}
                            className="p-0 h-auto font-medium"
                          >
                            Rank
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('wins')}
                            className="p-0 h-auto font-medium"
                          >
                            Record
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('totalSpeaks')}
                            className="p-0 h-auto font-medium"
                          >
                            Total Speaks
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('avgSpeaks')}
                            className="p-0 h-auto font-medium"
                          >
                            Avg Speaks
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('opponentWins')}
                            className="p-0 h-auto font-medium"
                          >
                            Opp Strength
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((team) => (
                        <TableRow 
                          key={team.teamId} 
                          className={team.isBreaking ? 'bg-primary/5 border-l-2 border-l-primary' : ''}
                        >
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {getRankIcon(team.rank)}
                              {team.isBreaking && (
                                <Star className="h-3 w-3 text-primary fill-primary" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{team.teamName}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{team.school}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getRankBadgeVariant(team.rank)}>
                              {team.wins}-{team.losses}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {team.totalSpeaks.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {team.avgSpeaks.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {team.opponentWins}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
