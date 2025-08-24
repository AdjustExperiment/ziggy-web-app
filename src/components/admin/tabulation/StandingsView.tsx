import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Medal, Award, Users, TrendingUp, RotateCcw } from 'lucide-react';
import { calculateStandings } from '@/utils/pairingAlgorithms';

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
}

export function StandingsView({ tournamentId, registrations }: StandingsViewProps) {
  const { toast } = useToast();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (tournamentId && registrations.length > 0) {
      calculateCurrentStandings();
    }
  }, [tournamentId, registrations]);

  const calculateCurrentStandings = async () => {
    try {
      setLoading(true);

      // Fetch all pairings and ballots for this tournament
      const { data: pairings, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          ballots(*),
          aff_registration:tournament_registrations!aff_registration_id(*),
          neg_registration:tournament_registrations!neg_registration_id(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at');

      if (pairingsError) throw pairingsError;

      // Calculate standings using simple logic for now
      const standingsData: TeamStanding[] = registrations.map((reg, index) => {
        // Count wins/losses from pairings with results
        let wins = 0;
        let losses = 0;
        let speaks = 0;
        
        pairings?.forEach((pairing: any) => {
          if (!pairing.result?.winner) return;
          
          if (pairing.aff_registration_id === reg.id) {
            if (pairing.result.winner === 'aff') wins++;
            else losses++;
            speaks += parseFloat(pairing.result.aff_speaks || 0);
          } else if (pairing.neg_registration_id === reg.id) {
            if (pairing.result.winner === 'neg') wins++;
            else losses++;
            speaks += parseFloat(pairing.result.neg_speaks || 0);
          }
        });
        
        return {
          teamId: reg.id,
          teamName: reg.participant_name + (reg.partner_name ? ` & ${reg.partner_name}` : ''),
          school: reg.school_organization || 'Independent',
          wins,
          losses,
          totalSpeaks: speaks,
          avgSpeaks: speaks / Math.max(wins + losses, 1),
          opponentWins: 0, // Simplified for now
          rank: index + 1
        };
      });

      // Sort by wins (descending), then total speaks (descending), then opponent wins (descending)
      standingsData.sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.totalSpeaks !== b.totalSpeaks) return b.totalSpeaks - a.totalSpeaks;
        return b.opponentWins - a.opponentWins;
      });

      // Update ranks
      standingsData.forEach((team, index) => {
        team.rank = index + 1;
      });

      setStandings(standingsData);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error calculating standings:', error);
      toast({
        title: "Error",
        description: "Failed to calculate standings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="h-5 w-5 flex items-center justify-center text-sm font-medium">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank === 2) return 'secondary';
    if (rank === 3) return 'outline';
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
                Current rankings based on wins, speaker points, and opponent strength
                {lastUpdated && (
                  <span className="block text-xs mt-1">
                    Last updated: {lastUpdated.toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={calculateCurrentStandings}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
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
                        <p className="text-sm text-muted-foreground">Perfect Records</p>
                        <p className="text-2xl font-bold text-yellow-500">
                          {standings.filter(s => s.losses === 0 && s.wins >= 3).length}
                        </p>
                      </div>
                      <Medal className="h-8 w-8 text-yellow-500" />
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
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead className="text-center">Record</TableHead>
                        <TableHead className="text-center">Total Speaks</TableHead>
                        <TableHead className="text-center">Avg Speaks</TableHead>
                        <TableHead className="text-center">Opp Wins</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((team) => (
                        <TableRow key={team.teamId} className={team.rank <= 3 ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getRankIcon(team.rank)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{team.teamName}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{team.school}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getRankColor(team.rank)}>
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