/**
 * SpeakerAwardsView.tsx
 *
 * UI component for displaying and managing speaker awards.
 * Shows top speakers with filtering options for divisions and breaking teams.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mic2,
  Trophy,
  Medal,
  Award,
  Download,
  RefreshCw,
  ChevronDown,
  FileText,
  Printer,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  calculateSpeakerAwards,
  downloadSpeakerAwardsCSV,
  type SpeakerStats,
  type SpeakerAwardsResult,
} from '@/lib/tabulation/speakerAwards';

// ============================================================================
// Types
// ============================================================================

interface SpeakerAwardsViewProps {
  tournamentId: string;
  eventId?: string | null;
  breakingTeamIds?: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get rank icon for top 3 speakers
 */
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-sm font-medium tabular-nums">{rank}</span>;
  }
}

/**
 * Get color class for average points badge
 */
function getPointsBadgeColor(avgPoints: number): string {
  if (avgPoints >= 29) return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
  if (avgPoints >= 28) return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
  if (avgPoints >= 27) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
  return 'bg-muted text-muted-foreground border-muted';
}

// ============================================================================
// Component
// ============================================================================

export function SpeakerAwardsView({
  tournamentId,
  eventId,
  breakingTeamIds = [],
}: SpeakerAwardsViewProps) {
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SpeakerAwardsResult | null>(null);
  const [topN, setTopN] = useState(10);
  const [excludeBreaking, setExcludeBreaking] = useState(false);
  const [divisionFilter, setDivisionFilter] = useState<string | null>(null);
  const [dropHighLow, setDropHighLow] = useState(0);

  // Fetch awards
  const fetchAwards = async () => {
    setLoading(true);
    try {
      const data = await calculateSpeakerAwards({
        tournamentId,
        eventId,
        topN,
        excludeBreaking,
        divisionFilter,
        dropHighLow,
      });
      setResult(data);
    } catch (error) {
      console.error('Error fetching speaker awards:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate speaker awards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAwards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, eventId]);

  // Refetch when options change
  useEffect(() => {
    if (!loading) {
      fetchAwards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topN, excludeBreaking, divisionFilter, dropHighLow]);

  // Speakers to display
  const speakers = useMemo(() => {
    return result?.topSpeakers ?? [];
  }, [result]);

  // Summary stats
  const stats = useMemo(() => {
    if (!result) return { totalSpeakers: 0, avgPoints: 0, topScore: 0 };

    const allSpeakers = result.speakers;
    const totalSpeakers = allSpeakers.length;
    const avgPoints =
      totalSpeakers > 0
        ? allSpeakers.reduce((sum, s) => sum + s.avgPoints, 0) / totalSpeakers
        : 0;
    const topScore = allSpeakers.length > 0 ? allSpeakers[0]?.totalPoints ?? 0 : 0;

    return { totalSpeakers, avgPoints, topScore };
  }, [result]);

  // Export handlers
  const handleExportCSV = () => {
    if (result) {
      downloadSpeakerAwardsCSV(result.topSpeakers, `speaker-awards-${tournamentId}.csv`);
      toast({ title: 'Exported', description: 'Speaker awards exported to CSV' });
    }
  };

  const handlePrint = () => {
    if (!result) return;

    const printContent = generatePrintHTML(result.topSpeakers, topN);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Print HTML generator
  const generatePrintHTML = (speakersList: SpeakerStats[], count: number): string => {
    const rows = speakersList
      .slice(0, count)
      .map(
        (s) => `
      <tr>
        <td>${s.rank}</td>
        <td>${escapeHtml(s.speakerName)}</td>
        <td>${escapeHtml(s.teamName)}</td>
        <td>${escapeHtml(s.school)}</td>
        <td>${s.roundsSpoken}</td>
        <td>${s.totalPoints.toFixed(1)}</td>
        <td>${s.avgPoints.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Speaker Awards</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
    h1 { text-align: center; }
    .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    td:first-child { text-align: center; font-weight: 600; }
    @media print { body { padding: 0; } table { font-size: 10pt; } }
  </style>
</head>
<body>
  <h1>Top ${count} Speakers</h1>
  <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Speaker</th>
        <th>Team</th>
        <th>School</th>
        <th>Rounds</th>
        <th>Total</th>
        <th>Avg</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
  };

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // Render loading state
  if (loading && !result) {
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
                <Mic2 className="h-5 w-5" />
                Speaker Awards
                {loading && (
                  <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Individual speaker rankings based on speaker points
                {result?.computedAt && (
                  <span className="block mt-0.5">
                    Last updated: {new Date(result.computedAt).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={speakers.length === 0}>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Awards
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Refresh Button */}
              <Button variant="outline" size="sm" onClick={fetchAwards} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Options Panel */}
          <Card className="border-muted mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Top N */}
                <div className="space-y-2">
                  <Label htmlFor="topN" className="text-xs">
                    Show Top
                  </Label>
                  <Select
                    value={topN.toString()}
                    onValueChange={(v) => setTopN(parseInt(v, 10))}
                  >
                    <SelectTrigger id="topN" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                      <SelectItem value="15">Top 15</SelectItem>
                      <SelectItem value="20">Top 20</SelectItem>
                      <SelectItem value="50">Top 50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Division Filter */}
                {result?.divisions && result.divisions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="division" className="text-xs">
                      Division
                    </Label>
                    <Select
                      value={divisionFilter ?? 'all'}
                      onValueChange={(v) => setDivisionFilter(v === 'all' ? null : v)}
                    >
                      <SelectTrigger id="division" className="h-8">
                        <SelectValue placeholder="All Divisions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Divisions</SelectItem>
                        {result.divisions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Drop High/Low */}
                <div className="space-y-2">
                  <Label htmlFor="dropHighLow" className="text-xs">
                    Drop High/Low
                  </Label>
                  <Select
                    value={dropHighLow.toString()}
                    onValueChange={(v) => setDropHighLow(parseInt(v, 10))}
                  >
                    <SelectTrigger id="dropHighLow" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">Drop 1</SelectItem>
                      <SelectItem value="2">Drop 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Exclude Breaking Teams */}
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="excludeBreaking"
                    checked={excludeBreaking}
                    onCheckedChange={setExcludeBreaking}
                  />
                  <Label htmlFor="excludeBreaking" className="text-xs cursor-pointer">
                    Exclude Breaking Teams
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {speakers.length === 0 ? (
            <Card className="border-muted">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Mic2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium">No Speaker Results Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Speaker awards will appear once rounds are completed and speaker points are
                  recorded. Make sure ballots include individual speaker scores.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Speakers</p>
                        <p className="text-xl font-bold">{stats.totalSpeakers}</p>
                      </div>
                      <Mic2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Speaker Pts</p>
                        <p className="text-xl font-bold">{stats.avgPoints.toFixed(1)}</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Top Score</p>
                        <p className="text-xl font-bold text-primary">
                          {stats.topScore.toFixed(1)}
                        </p>
                      </div>
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Speaker Awards Table */}
              <Card className="border-muted overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 p-2 text-center">Rank</TableHead>
                        <TableHead className="p-2">Speaker</TableHead>
                        <TableHead className="p-2 hidden md:table-cell">Team</TableHead>
                        <TableHead className="p-2 hidden lg:table-cell">School</TableHead>
                        <TableHead className="p-2 text-center">Rounds</TableHead>
                        <TableHead className="p-2 text-center">Total</TableHead>
                        <TableHead className="p-2 text-center">Avg</TableHead>
                        <TableHead className="p-2 text-center hidden sm:table-cell">
                          High
                        </TableHead>
                        <TableHead className="p-2 text-center hidden sm:table-cell">
                          Low
                        </TableHead>
                        {dropHighLow > 0 && (
                          <TableHead className="p-2 text-center">Adjusted</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {speakers.map((speaker) => {
                        const rank = speaker.rank ?? 0;
                        const isTop3 = rank <= 3;

                        return (
                          <TableRow
                            key={speaker.speakerId}
                            className={isTop3 ? 'bg-primary/5' : ''}
                          >
                            {/* Rank */}
                            <TableCell className="p-2">
                              <div className="flex items-center justify-center">
                                {getRankIcon(rank)}
                              </div>
                            </TableCell>

                            {/* Speaker Name */}
                            <TableCell className="p-2">
                              <div className="font-medium text-sm">{speaker.speakerName}</div>
                              <div className="text-xs text-muted-foreground md:hidden">
                                {speaker.teamName}
                              </div>
                            </TableCell>

                            {/* Team */}
                            <TableCell className="p-2 hidden md:table-cell">
                              <span className="text-sm">{speaker.teamName}</span>
                              {speaker.isBreaking && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs bg-primary/10 border-primary/30"
                                >
                                  Breaking
                                </Badge>
                              )}
                            </TableCell>

                            {/* School */}
                            <TableCell className="p-2 hidden lg:table-cell">
                              <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                                {speaker.school}
                              </span>
                            </TableCell>

                            {/* Rounds */}
                            <TableCell className="p-2 text-center">
                              <span className="text-sm font-mono">{speaker.roundsSpoken}</span>
                            </TableCell>

                            {/* Total Points */}
                            <TableCell className="p-2 text-center">
                              <span className="text-sm font-mono font-medium">
                                {speaker.totalPoints.toFixed(1)}
                              </span>
                            </TableCell>

                            {/* Average */}
                            <TableCell className="p-2 text-center">
                              <Badge
                                variant="outline"
                                className={`${getPointsBadgeColor(speaker.avgPoints)} font-mono text-xs border`}
                              >
                                {speaker.avgPoints.toFixed(2)}
                              </Badge>
                            </TableCell>

                            {/* High */}
                            <TableCell className="p-2 text-center hidden sm:table-cell">
                              <span className="text-sm font-mono text-green-600 dark:text-green-400">
                                {speaker.highPoint.toFixed(1)}
                              </span>
                            </TableCell>

                            {/* Low */}
                            <TableCell className="p-2 text-center hidden sm:table-cell">
                              <span className="text-sm font-mono text-red-600 dark:text-red-400">
                                {speaker.lowPoint.toFixed(1)}
                              </span>
                            </TableCell>

                            {/* Adjusted */}
                            {dropHighLow > 0 && (
                              <TableCell className="p-2 text-center">
                                <span className="text-sm font-mono font-medium text-primary">
                                  {speaker.adjustedPoints.toFixed(1)}
                                </span>
                              </TableCell>
                            )}
                          </TableRow>
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
