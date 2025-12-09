import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Download, RefreshCw, Search, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SpreadsheetViewProps {
  tournamentId: string;
  eventId?: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  school: string;
  wins: number;
  losses: number;
  affCount: number;
  negCount: number;
  totalSpeaks: number;
  avgSpeaks: number;
  pullupCount: number;
  isActive: boolean;
  roundResults: RoundResult[];
}

interface RoundResult {
  roundId: string;
  roundNumber: number;
  roundName: string;
  side: 'aff' | 'neg';
  result: 'win' | 'loss' | 'bye' | 'pending';
  speaks: number;
  opponent: string;
}

type SortKey = 'name' | 'school' | 'wins' | 'losses' | 'avgSpeaks' | 'totalSpeaks' | 'affCount' | 'negCount';

export function SpreadsheetView({ tournamentId, eventId }: SpreadsheetViewProps) {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [rounds, setRounds] = useState<{ id: string; name: string; round_number: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('wins');
  const [sortAsc, setSortAsc] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchData();
  }, [tournamentId, eventId]);

  const fetchData = async () => {
    setLoading(true);
    console.log('[SpreadsheetView] Fetching data for tournament:', tournamentId);
    
    try {
      // Fetch rounds (filtered by event if specified)
      let roundsQuery = supabase
        .from('rounds')
        .select('id, name, round_number')
        .eq('tournament_id', tournamentId)
        .order('round_number');

      if (eventId) {
        roundsQuery = roundsQuery.eq('event_id', eventId);
      }

      const { data: roundsData, error: roundsError } = await roundsQuery;

      if (roundsError) {
        console.error('[SpreadsheetView] Error fetching rounds:', roundsError);
        throw roundsError;
      }
      console.log('[SpreadsheetView] Fetched rounds:', roundsData?.length);
      setRounds(roundsData || []);

      // Fetch registrations (filtered by event if specified)
      let regQuery = supabase
        .from('tournament_registrations')
        .select('id, participant_name, school_organization, is_active, aff_count, neg_count, event_id')
        .eq('tournament_id', tournamentId);

      if (eventId) {
        regQuery = regQuery.eq('event_id', eventId);
      }

      const { data: registrations, error: regError } = await regQuery;

      if (regError) {
        console.error('[SpreadsheetView] Error fetching registrations:', regError);
        throw regError;
      }
      console.log('[SpreadsheetView] Fetched registrations:', registrations?.length);

      // Fetch all pairings with results
      const { data: pairings, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          id,
          round_id,
          aff_registration_id,
          neg_registration_id,
          status,
          result,
          flags,
          aff_registration:tournament_registrations!aff_registration_id(participant_name),
          neg_registration:tournament_registrations!neg_registration_id(participant_name)
        `)
        .eq('tournament_id', tournamentId);

      if (pairingsError) {
        console.error('[SpreadsheetView] Error fetching pairings:', pairingsError);
        throw pairingsError;
      }
      console.log('[SpreadsheetView] Fetched pairings:', pairings?.length);

      // Fetch ballots
      const { data: ballots, error: ballotsError } = await supabase
        .from('ballots')
        .select('pairing_id, payload, status')
        .eq('status', 'submitted');

      if (ballotsError) {
        console.error('[SpreadsheetView] Error fetching ballots:', ballotsError);
      }
      console.log('[SpreadsheetView] Fetched ballots:', ballots?.length);

      // Build ballot lookup
      const ballotMap = new Map<string, any>();
      ballots?.forEach(b => ballotMap.set(b.pairing_id, b.payload));

      // Build round lookup
      const roundMap = new Map(roundsData?.map(r => [r.id, r]) || []);

      // Build team stats
      const teamStats = new Map<string, TeamRow>();
      
      registrations?.forEach(reg => {
        teamStats.set(reg.id, {
          id: reg.id,
          name: reg.participant_name,
          school: reg.school_organization || 'Independent',
          wins: 0,
          losses: 0,
          affCount: reg.aff_count || 0,
          negCount: reg.neg_count || 0,
          totalSpeaks: 0,
          avgSpeaks: 0,
          pullupCount: 0,
          isActive: reg.is_active !== false,
          roundResults: []
        });
      });

      // Process pairings
      pairings?.forEach(pairing => {
        const round = roundMap.get(pairing.round_id);
        if (!round) return;

        const ballot = ballotMap.get(pairing.id);
        const isBye = pairing.flags?.includes('bye') || pairing.status === 'bye';
        const isPullup = pairing.flags?.includes('pullup');

        // Process aff team
        const affTeam = teamStats.get(pairing.aff_registration_id);
        if (affTeam) {
          if (isPullup) affTeam.pullupCount++;
          
          const affResult: RoundResult = {
            roundId: pairing.round_id,
            roundNumber: round.round_number,
            roundName: round.name,
            side: 'aff',
            result: 'pending',
            speaks: 0,
            opponent: pairing.neg_registration?.participant_name || 'BYE'
          };

          if (isBye) {
            affResult.result = 'bye';
            affTeam.wins++; // Byes typically count as wins
          } else if (ballot) {
            const winner = ballot.winner;
            affResult.result = winner === 'aff' ? 'win' : 'loss';
            affResult.speaks = parseFloat(ballot.aff_speaks) || 0;
            affTeam.totalSpeaks += affResult.speaks;
            if (winner === 'aff') affTeam.wins++;
            else affTeam.losses++;
          }

          affTeam.roundResults.push(affResult);
        }

        // Process neg team (skip if bye)
        if (!isBye) {
          const negTeam = teamStats.get(pairing.neg_registration_id);
          if (negTeam) {
            const negResult: RoundResult = {
              roundId: pairing.round_id,
              roundNumber: round.round_number,
              roundName: round.name,
              side: 'neg',
              result: 'pending',
              speaks: 0,
              opponent: pairing.aff_registration?.participant_name || ''
            };

            if (ballot) {
              const winner = ballot.winner;
              negResult.result = winner === 'neg' ? 'win' : 'loss';
              negResult.speaks = parseFloat(ballot.neg_speaks) || 0;
              negTeam.totalSpeaks += negResult.speaks;
              if (winner === 'neg') negTeam.wins++;
              else negTeam.losses++;
            }

            negTeam.roundResults.push(negResult);
          }
        }
      });

      // Calculate averages
      teamStats.forEach(team => {
        const roundsWithSpeaks = team.roundResults.filter(r => r.speaks > 0).length;
        team.avgSpeaks = roundsWithSpeaks > 0 ? team.totalSpeaks / roundsWithSpeaks : 0;
      });

      setTeams(Array.from(teamStats.values()));
      console.log('[SpreadsheetView] Processed teams:', teamStats.size);
    } catch (error: any) {
      console.error('[SpreadsheetView] Error:', error);
      toast({
        title: "Error",
        description: "Failed to load spreadsheet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort teams
  const displayTeams = useMemo(() => {
    let filtered = teams.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.school.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && t.isActive) ||
        (statusFilter === 'inactive' && !t.isActive);
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [teams, searchTerm, statusFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Rank', 'Team', 'School', 'W', 'L', 'Aff', 'Neg', 'Total Spks', 'Avg Spks', 'Pullups', 'Status'];
    rounds.forEach(r => headers.push(`R${r.round_number}`));

    const rows = displayTeams.map((team, idx) => {
      const row = [
        idx + 1,
        team.name,
        team.school,
        team.wins,
        team.losses,
        team.affCount,
        team.negCount,
        team.totalSpeaks.toFixed(1),
        team.avgSpeaks.toFixed(2),
        team.pullupCount,
        team.isActive ? 'Active' : 'Inactive'
      ];

      rounds.forEach(r => {
        const result = team.roundResults.find(rr => rr.roundId === r.id);
        if (result) {
          row.push(`${result.result === 'win' ? 'W' : result.result === 'loss' ? 'L' : result.result === 'bye' ? 'BYE' : '-'} ${result.speaks > 0 ? `(${result.speaks})` : ''}`);
        } else {
          row.push('-');
        }
      });

      return row;
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament_spreadsheet_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "Spreadsheet exported to CSV" });
  };

  const exportToJSON = () => {
    const data = displayTeams.map(t => ({
      ...t,
      roundResults: t.roundResults.map(r => ({
        round: r.roundName,
        side: r.side,
        result: r.result,
        speaks: r.speaks,
        opponent: r.opponent
      }))
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "Data exported to JSON" });
  };

  const SortHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
      onClick={() => handleSort(sortKeyVal)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === sortKeyVal && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </div>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Spreadsheet View</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToJSON}>
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Complete tournament statistics in spreadsheet format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams or schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <SortHeader label="Team" sortKeyVal="name" />
                  <SortHeader label="School" sortKeyVal="school" />
                  <SortHeader label="W" sortKeyVal="wins" />
                  <SortHeader label="L" sortKeyVal="losses" />
                  <SortHeader label="Aff" sortKeyVal="affCount" />
                  <SortHeader label="Neg" sortKeyVal="negCount" />
                  <SortHeader label="Tot Spks" sortKeyVal="totalSpeaks" />
                  <SortHeader label="Avg Spks" sortKeyVal="avgSpeaks" />
                  <TableHead>Pullups</TableHead>
                  <TableHead>Status</TableHead>
                  {rounds.map(r => (
                    <TableHead key={r.id} className="text-center whitespace-nowrap">
                      R{r.round_number}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTeams.map((team, idx) => (
                  <TableRow key={team.id} className={!team.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-muted-foreground">{team.school}</TableCell>
                    <TableCell className="text-center font-semibold text-green-600">{team.wins}</TableCell>
                    <TableCell className="text-center font-semibold text-red-600">{team.losses}</TableCell>
                    <TableCell className="text-center">{team.affCount}</TableCell>
                    <TableCell className="text-center">{team.negCount}</TableCell>
                    <TableCell className="text-center">{team.totalSpeaks.toFixed(1)}</TableCell>
                    <TableCell className="text-center">{team.avgSpeaks.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{team.pullupCount}</TableCell>
                    <TableCell>
                      <Badge variant={team.isActive ? 'default' : 'secondary'} className="text-xs">
                        {team.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {rounds.map(r => {
                      const result = team.roundResults.find(rr => rr.roundId === r.id);
                      return (
                        <TableCell key={r.id} className="text-center text-xs whitespace-nowrap">
                          {result ? (
                            <div className="flex flex-col items-center">
                              <Badge 
                                variant={result.result === 'win' ? 'default' : result.result === 'loss' ? 'destructive' : 'secondary'}
                                className="text-[10px] px-1"
                              >
                                {result.result === 'win' ? 'W' : result.result === 'loss' ? 'L' : result.result === 'bye' ? 'BYE' : '-'}
                              </Badge>
                              {result.speaks > 0 && (
                                <span className="text-muted-foreground">{result.speaks}</span>
                              )}
                              <span className="text-muted-foreground text-[9px] truncate max-w-[60px]" title={result.opponent}>
                                {result.side.toUpperCase()} vs {result.opponent.split(' ')[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && displayTeams.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No teams found matching your criteria
          </div>
        )}
      </CardContent>
    </Card>
  );
}
