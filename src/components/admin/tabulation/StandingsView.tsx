/**
 * StandingsView.tsx
 *
 * NOTE: This component is ~635 lines and contains the main StandingsView component,
 * a sub-component (ExpandableStandingRow), and several helper functions.
 * In a future refactor, consider extracting:
 * - ExpandableStandingRow into its own file
 * - Helper functions (getRecordBadgeColor, getTeamDisplayName, getResultDisplay) into a utils file
 * - Export functionality into a custom hook
 */
import React, { useState, useMemo, Fragment } from 'react';
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
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileJson,
  FileText,
  Printer,
} from 'lucide-react';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useComputedStandings, useRecomputeStandings } from '@/hooks/useComputedStandings';
import {
  downloadStandingsCSV,
  downloadStandingsJSON,
  downloadStandingsExcel,
  printStandings,
} from '@/lib/tabulation/importExportService';
import type { StandingWithTeam, RoundResult } from '@/types/tabulation';

interface StandingsViewProps {
  tournamentId: string;
  registrations: any[];
  eventId?: string | null;
}

type SortField = 'rank' | 'wins' | 'totalSpeaks' | 'avgSpeaks' | 'opponentWins';
type SortOrder = 'asc' | 'desc';

/**
 * Get color class for win bracket badges
 */
function getRecordBadgeColor(wins: number, losses: number): string {
  if (losses === 0 && wins > 0) return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
  if (wins > losses) return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
  if (wins === losses) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
}

/**
 * Get the display name for a team
 */
function getTeamDisplayName(standing: StandingWithTeam): string {
  const reg = standing.registration;
  if (reg.partner_name) {
    return `${reg.participant_name} & ${reg.partner_name}`;
  }
  return reg.participant_name;
}

/**
 * Get the result display text
 */
function getResultDisplay(result: string): { text: string; color: string } {
  switch (result) {
    case 'win':
      return { text: 'W', color: 'text-green-600 dark:text-green-400' };
    case 'loss':
      return { text: 'L', color: 'text-red-600 dark:text-red-400' };
    case 'bye':
      return { text: 'BYE', color: 'text-muted-foreground' };
    case 'forfeit_win':
      return { text: 'FW', color: 'text-green-600/70 dark:text-green-400/70' };
    case 'forfeit_loss':
      return { text: 'FL', color: 'text-red-600/70 dark:text-red-400/70' };
    default:
      return { text: result, color: 'text-muted-foreground' };
  }
}

interface ExpandableStandingRowProps {
  standing: StandingWithTeam;
  rank: number;
  isBreaking: boolean;
  expanded: boolean;
  onToggle: () => void;
  teamName: string;
}

function ExpandableStandingRow({
  standing,
  rank,
  isBreaking,
  expanded,
  onToggle,
  teamName,
}: ExpandableStandingRowProps) {
  const getRankIcon = (r: number) => {
    switch (r) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium tabular-nums">{r}</span>;
    }
  };

  const roundResults = standing.round_results || [];
  const hasRoundData = roundResults.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <>
      <TableRow
        onClick={hasRoundData ? onToggle : undefined}
        onKeyDown={hasRoundData ? handleKeyDown : undefined}
        role={hasRoundData ? 'button' : undefined}
        tabIndex={hasRoundData ? 0 : undefined}
        aria-expanded={hasRoundData ? expanded : undefined}
        aria-label={hasRoundData ? `${teamName} - click to ${expanded ? 'collapse' : 'expand'} round details` : undefined}
        className={`
          ${hasRoundData ? 'cursor-pointer' : ''}
          ${isBreaking ? 'bg-primary/5' : ''}
          hover:bg-muted/50 transition-colors
        `}
      >
        {/* Expand Chevron */}
        <TableCell className="w-8 p-2">
          {hasRoundData ? (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : null}
        </TableCell>

        {/* Rank */}
        <TableCell className="w-12 p-2">
          <div className="flex items-center justify-center gap-1">
            {getRankIcon(rank)}
            {isBreaking && (
              <Star className="h-3 w-3 text-primary fill-primary" />
            )}
          </div>
        </TableCell>

        {/* Team Name */}
        <TableCell className="p-2">
          <div className="font-medium text-sm">{getTeamDisplayName(standing)}</div>
        </TableCell>

        {/* School */}
        <TableCell className="p-2 hidden md:table-cell">
          <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
            {standing.registration.school_organization || 'Independent'}
          </span>
        </TableCell>

        {/* Record */}
        <TableCell className="p-2 text-center">
          <Badge
            variant="outline"
            className={`${getRecordBadgeColor(standing.wins, standing.losses)} font-mono text-xs border`}
          >
            {standing.wins}-{standing.losses}
          </Badge>
        </TableCell>

        {/* Total Speaks */}
        <TableCell className="p-2 text-center font-mono text-sm hidden sm:table-cell">
          {standing.total_speaks.toFixed(1)}
        </TableCell>

        {/* Avg Speaks */}
        <TableCell className="p-2 text-center font-mono text-sm">
          {standing.avg_speaks.toFixed(2)}
        </TableCell>

        {/* Opp Strength */}
        <TableCell className="p-2 text-center font-mono text-sm hidden lg:table-cell">
          {standing.opp_wins}
        </TableCell>
      </TableRow>

      {/* Expanded Row - Round Breakdown */}
      {expanded && hasRoundData && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={8} className="p-0">
            <div className="bg-muted/30 p-4 border-y border-muted">
              <div className="text-xs font-medium text-muted-foreground mb-3">
                Round-by-Round Breakdown
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {roundResults
                  .sort((a, b) => a.round_number - b.round_number)
                  .map((result: RoundResult) => {
                    const { text, color } = getResultDisplay(result.result);
                    return (
                      <div
                        key={result.id}
                        className="flex flex-col p-2 bg-background rounded-md border border-border/50"
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          R{result.round_number}
                          {result.side && (
                            <span className="ml-1 uppercase">
                              ({result.side})
                            </span>
                          )}
                        </div>
                        <div className={`text-sm font-semibold ${color}`}>
                          {text}
                        </div>
                        {result.total_speaks !== null && result.total_speaks !== undefined && (
                          <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {result.total_speaks.toFixed(1)} pts
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function StandingsView({ tournamentId, registrations, eventId }: StandingsViewProps) {
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [breakSize, setBreakSize] = useState<number>(8);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Use React Query hook for standings
  const {
    standings: computedStandings,
    isLoading,
    isFetching,
    computedAt,
    refetch,
  } = useComputedStandings(tournamentId, eventId, {
    enabled: !!tournamentId && registrations.length > 0,
    forceCompute: false,
  });

  // Recompute mutation
  const { recompute, isRecomputing } = useRecomputeStandings({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Standings recalculated successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to recalculate standings',
        variant: 'destructive',
      });
    },
  });

  // Transform computed standings to include team info
  const standings = useMemo<StandingWithTeam[]>(() => {
    if (!computedStandings || computedStandings.length === 0) {
      return [];
    }
    // The hook already returns StandingWithTeam from the service
    return computedStandings as StandingWithTeam[];
  }, [computedStandings]);

  // Sort standings
  const sortedStandings = useMemo(() => {
    const sorted = [...standings];

    sorted.sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case 'rank':
          aVal = a.prelim_rank ?? a.overall_rank ?? 999;
          bVal = b.prelim_rank ?? b.overall_rank ?? 999;
          break;
        case 'wins':
          aVal = a.wins;
          bVal = b.wins;
          break;
        case 'totalSpeaks':
          aVal = a.total_speaks;
          bVal = b.total_speaks;
          break;
        case 'avgSpeaks':
          aVal = a.avg_speaks;
          bVal = b.avg_speaks;
          break;
        case 'opponentWins':
          aVal = a.opp_wins;
          bVal = b.opp_wins;
          break;
        default:
          return 0;
      }

      const multiplier = sortOrder === 'asc' ? 1 : -1;
      return (aVal - bVal) * multiplier;
    });

    return sorted;
  }, [standings, sortField, sortOrder]);

  // Summary stats
  const stats = useMemo(() => {
    const totalTeams = standings.length;
    const undefeated = standings.filter((s) => s.losses === 0 && s.wins > 0).length;
    const avgSpeaks =
      totalTeams > 0
        ? Math.round(standings.reduce((acc, s) => acc + s.avg_speaks, 0) / totalTeams)
        : 0;
    const breaking = Math.min(breakSize, totalTeams);

    return { totalTeams, undefeated, avgSpeaks, breaking };
  }, [standings, breakSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const handleRecalculate = async () => {
    try {
      await recompute({
        tournamentId,
        eventId: eventId || undefined,
      });
    } catch {
      // Error handled in onError callback
    }
  };

  const toggleRowExpand = (teamId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  // Export handlers
  const handleExportCSV = () => {
    downloadStandingsCSV(standings, `standings-${tournamentId}.csv`);
    toast({ title: 'Exported', description: 'Standings exported to CSV' });
  };

  const handleExportJSON = () => {
    downloadStandingsJSON(standings, undefined, `standings-${tournamentId}.json`);
    toast({ title: 'Exported', description: 'Standings exported to JSON' });
  };

  const handleExportExcel = () => {
    downloadStandingsExcel(
      standings,
      { includeRoundBreakdown: true },
      `standings-${tournamentId}.xlsx`
    );
    toast({ title: 'Exported', description: 'Standings exported to Excel' });
  };

  const handlePrint = () => {
    printStandings(standings, { showSpeakerPoints: true });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Tournament Standings
                {isFetching && (
                  <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Rankings based on wins, speaker points, and opponent strength
                {computedAt && (
                  <span className="block mt-0.5">
                    Last updated: {new Date(computedAt).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={standings.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Standings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Recalculate Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={isRecomputing}
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${isRecomputing ? 'animate-spin' : ''}`} />
                {isRecomputing ? 'Syncing...' : 'Recalculate'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {standings.length === 0 ? (
            <ErrorDisplay
              errorCode="ERR_NO_BALLOTS"
              message="No Standings Yet"
              details="Standings will appear once rounds are completed and ballots are submitted. Use the Recalculate button after ballots are entered."
              retryAction={handleRecalculate}
              variant="empty"
            />
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Teams</p>
                        <p className="text-xl font-bold">{stats.totalTeams}</p>
                      </div>
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Undefeated</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {stats.undefeated}
                        </p>
                      </div>
                      <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Speaks</p>
                        <p className="text-xl font-bold">{stats.avgSpeaks}</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Breaking</p>
                        <p className="text-xl font-bold text-primary">{stats.breaking}</p>
                      </div>
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Standings Table */}
              <Card className="border-muted overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-8 p-2"></TableHead>
                        <TableHead className="w-12 p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('rank')}
                            className="p-0 h-auto font-medium text-xs"
                            aria-sort={sortField === 'rank' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                          >
                            Rank
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                        <TableHead className="p-2 text-xs">Team</TableHead>
                        <TableHead className="p-2 text-xs hidden md:table-cell">School</TableHead>
                        <TableHead className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('wins')}
                            className="p-0 h-auto font-medium text-xs"
                            aria-sort={sortField === 'wins' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                          >
                            Record
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                        <TableHead className="p-2 text-center hidden sm:table-cell">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('totalSpeaks')}
                            className="p-0 h-auto font-medium text-xs"
                            aria-sort={sortField === 'totalSpeaks' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                          >
                            Speaks
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                        <TableHead className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('avgSpeaks')}
                            className="p-0 h-auto font-medium text-xs"
                            aria-sort={sortField === 'avgSpeaks' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                          >
                            Avg
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                        <TableHead className="p-2 text-center hidden lg:table-cell">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('opponentWins')}
                            className="p-0 h-auto font-medium text-xs"
                            aria-sort={sortField === 'opponentWins' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                          >
                            Opp W
                            <ArrowUpDown className="h-3 w-3 ml-1" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedStandings.map((standing, index) => {
                        const rank = standing.prelim_rank ?? standing.overall_rank ?? index + 1;
                        const isBreaking = rank <= breakSize;
                        const isLastBreaking = rank === breakSize;
                        const teamName = getTeamDisplayName(standing);

                        return (
                          <Fragment key={standing.registration_id}>
                            <ExpandableStandingRow
                              standing={standing}
                              rank={rank}
                              isBreaking={isBreaking}
                              expanded={expandedRows.has(standing.registration_id)}
                              onToggle={() => toggleRowExpand(standing.registration_id)}
                              teamName={teamName}
                            />
                            {/* Break line indicator */}
                            {isLastBreaking && index < sortedStandings.length - 1 && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={8} className="h-1 p-0">
                                  <div className="h-0.5 bg-primary/40 mx-2" />
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
