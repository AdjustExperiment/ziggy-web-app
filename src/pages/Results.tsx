import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Calendar, Users, Search, Crown, Star, MapPin } from "lucide-react";

interface TournamentResult {
  id: string;
  tournament_name: string;
  tournament_id: string;
  format: string;
  start_date: string;
  participant_name: string;
  partner_name: string | null;
  school: string | null;
  rank: number;
  wins: number;
  losses: number;
  speaks_total: number;
  speaks_avg: number;
}

interface TopPerformer {
  participant_name: string;
  school: string | null;
  total_wins: number;
  total_losses: number;
  total_speaks: number;
  tournaments_count: number;
  win_rate: number;
}

interface Championship {
  id: string;
  name: string;
  format: string;
  start_date: string;
  end_date: string;
  location: string | null;
  winner_name: string | null;
  winner_school: string | null;
  runner_up_name: string | null;
  runner_up_school: string | null;
  participant_count: number;
}

const Results = () => {
  const [recentResults, setRecentResults] = useState<TournamentResult[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [formats, setFormats] = useState<string[]>([]);

  useEffect(() => {
    fetchAllResults();
  }, []);

  const fetchAllResults = async () => {
    try {
      // Fetch recent tournament results from tournament_standings
      const { data: standingsData, error: standingsError } = await supabase
        .from('tournament_standings')
        .select(`
          id,
          rank,
          wins,
          losses,
          speaks_total,
          speaks_avg,
          registration:tournament_registrations(
            participant_name,
            partner_name,
            school_organization
          ),
          tournament:tournaments(
            id,
            name,
            format,
            start_date
          )
        `)
        .order('rank')
        .limit(100);

      if (standingsError) {
        console.error('Error fetching standings:', standingsError);
      } else if (standingsData) {
        const formattedResults: TournamentResult[] = standingsData
          .filter(s => s.tournament && s.registration)
          .map(s => ({
            id: s.id,
            tournament_name: (s.tournament as any)?.name || 'Unknown Tournament',
            tournament_id: (s.tournament as any)?.id || '',
            format: (s.tournament as any)?.format || 'Unknown',
            start_date: (s.tournament as any)?.start_date || '',
            participant_name: (s.registration as any)?.participant_name || 'Unknown',
            partner_name: (s.registration as any)?.partner_name,
            school: (s.registration as any)?.school_organization,
            rank: s.rank,
            wins: s.wins,
            losses: s.losses,
            speaks_total: s.speaks_total || 0,
            speaks_avg: s.speaks_avg || 0,
          }));
        
        setRecentResults(formattedResults);
        
        // Extract unique formats
        const uniqueFormats = [...new Set(formattedResults.map(r => r.format).filter(Boolean))];
        setFormats(uniqueFormats);

        // Calculate top performers by aggregating standings
        const performerMap = new Map<string, TopPerformer>();
        formattedResults.forEach(result => {
          const key = result.participant_name;
          const existing = performerMap.get(key);
          if (existing) {
            existing.total_wins += result.wins;
            existing.total_losses += result.losses;
            existing.total_speaks += result.speaks_total;
            existing.tournaments_count += 1;
          } else {
            performerMap.set(key, {
              participant_name: result.participant_name,
              school: result.school,
              total_wins: result.wins,
              total_losses: result.losses,
              total_speaks: result.speaks_total,
              tournaments_count: 1,
              win_rate: 0,
            });
          }
        });

        // Calculate win rates and sort
        const performers = Array.from(performerMap.values())
          .map(p => ({
            ...p,
            win_rate: p.total_wins + p.total_losses > 0 
              ? Math.round((p.total_wins / (p.total_wins + p.total_losses)) * 100) 
              : 0
          }))
          .sort((a, b) => {
            // Sort by wins first, then by win rate
            if (b.total_wins !== a.total_wins) return b.total_wins - a.total_wins;
            return b.win_rate - a.win_rate;
          })
          .slice(0, 10);

        setTopPerformers(performers);
      }

      // Fetch completed tournaments for championships
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          format,
          start_date,
          end_date,
          location
        `)
        .eq('status', 'Completed')
        .order('end_date', { ascending: false })
        .limit(20);

      if (tournamentsError) {
        console.error('Error fetching tournaments:', tournamentsError);
      } else if (tournamentsData && tournamentsData.length > 0) {
        // For each completed tournament, fetch winner and runner-up
        const championshipResults: Championship[] = await Promise.all(
          tournamentsData.map(async (tournament) => {
            // Get top 2 standings for this tournament
            const { data: topStandings } = await supabase
              .from('tournament_standings')
              .select(`
                rank,
                registration:tournament_registrations(
                  participant_name,
                  partner_name,
                  school_organization
                )
              `)
              .eq('tournament_id', tournament.id)
              .lte('rank', 2)
              .order('rank');

            // Get participant count
            const { count } = await supabase
              .from('tournament_registrations')
              .select('*', { count: 'exact', head: true })
              .eq('tournament_id', tournament.id);

            const winner = topStandings?.find(s => s.rank === 1);
            const runnerUp = topStandings?.find(s => s.rank === 2);

            return {
              id: tournament.id,
              name: tournament.name,
              format: tournament.format || 'Unknown',
              start_date: tournament.start_date,
              end_date: tournament.end_date,
              location: tournament.location,
              winner_name: winner ? formatTeamName(winner.registration as any) : null,
              winner_school: (winner?.registration as any)?.school_organization || null,
              runner_up_name: runnerUp ? formatTeamName(runnerUp.registration as any) : null,
              runner_up_school: (runnerUp?.registration as any)?.school_organization || null,
              participant_count: count || 0,
            };
          })
        );

        setChampionships(championshipResults);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTeamName = (registration: { participant_name: string; partner_name?: string } | null) => {
    if (!registration) return null;
    if (registration.partner_name) {
      return `${registration.participant_name} & ${registration.partner_name}`;
    }
    return registration.participant_name;
  };

  const getPositionIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-primary" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-primary/80" />;
    if (rank === 3) return <Award className="h-6 w-6 text-primary/60" />;
    return <Trophy className="h-6 w-6 text-muted-foreground" />;
  };

  const getPositionBadge = (rank: number) => {
    if (rank === 1) return { text: '1st Place', variant: 'default' as const, className: 'bg-primary text-primary-foreground' };
    if (rank === 2) return { text: '2nd Place', variant: 'secondary' as const, className: 'bg-primary/80 text-primary-foreground' };
    if (rank === 3) return { text: '3rd Place', variant: 'secondary' as const, className: 'bg-primary/60 text-primary-foreground' };
    return { text: `${rank}th Place`, variant: 'outline' as const, className: 'border-border text-muted-foreground' };
  };

  // Filter results based on search and format
  const filteredResults = recentResults.filter(result => {
    const matchesSearch = searchQuery === '' || 
      result.tournament_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (result.school?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFormat = formatFilter === 'all' || result.format === formatFilter;
    
    return matchesSearch && matchesFormat;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-card py-16 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 font-primary">
              Tournament Results
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive results from debate tournaments worldwide. Track winners, 
              rankings, and championship outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-card/50 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search results..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  {formats.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Tabs */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="recent" className="space-y-8">
            <TabsList className="bg-muted">
              <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Recent Results
              </TabsTrigger>
              <TabsTrigger value="rankings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Rankings
              </TabsTrigger>
              <TabsTrigger value="championships" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Championships
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-6">
              <div className="grid gap-4">
                {filteredResults.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Results Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        {searchQuery || formatFilter !== 'all' 
                          ? 'No results match your search criteria.'
                          : 'Tournament results will appear here once competitions conclude.'}
                      </p>
                      <Button variant="outline" asChild>
                        <a href="/tournaments">Browse Upcoming Tournaments</a>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredResults.map((result) => {
                    const badge = getPositionBadge(result.rank);
                    return (
                      <Card key={result.id} className="hover:border-primary/30 transition-all">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20">
                                {getPositionIcon(result.rank)}
                              </div>
                              
                              <div>
                                <h3 className="text-lg font-bold text-foreground">
                                  {result.participant_name}
                                  {result.partner_name && ` & ${result.partner_name}`}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-medium">{result.tournament_name}</span>
                                  <span>•</span>
                                  <span>{result.format}</span>
                                  <span>•</span>
                                  <span>{new Date(result.start_date).toLocaleDateString()}</span>
                                  {result.school && (
                                    <>
                                      <span>•</span>
                                      <span>{result.school}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-medium text-foreground">
                                  {result.wins}W - {result.losses}L
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {result.speaks_avg.toFixed(1)} avg speaks
                                </div>
                              </div>
                              <Badge className={badge.className}>
                                {badge.text}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="rankings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Top Performers - All Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topPerformers.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Rankings Coming Soon</h3>
                      <p className="text-muted-foreground">Top performers will be listed once tournament data is available.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topPerformers.map((performer, index) => (
                        <div 
                          key={performer.participant_name} 
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/20 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-primary text-primary-foreground' : 
                              index === 1 ? 'bg-primary/80 text-primary-foreground' : 
                              index === 2 ? 'bg-primary/60 text-primary-foreground' : 
                              'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>
                            
                            <div>
                              <div className="font-bold text-foreground">{performer.participant_name}</div>
                              <div className="text-sm text-muted-foreground">{performer.school || 'Independent'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-foreground">{performer.total_wins}</div>
                              <div className="text-muted-foreground">Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-foreground">{performer.tournaments_count}</div>
                              <div className="text-muted-foreground">Tournaments</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-primary">{performer.win_rate}%</div>
                              <div className="text-muted-foreground">Win Rate</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="championships" className="space-y-6">
              <div className="grid gap-6">
                {championships.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Completed Tournaments</h3>
                      <p className="text-muted-foreground">Championship results will appear here once tournaments are completed.</p>
                    </CardContent>
                  </Card>
                ) : (
                  championships.map((tournament) => (
                    <Card key={tournament.id} className="hover:border-primary/30 transition-all">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{tournament.name}</CardTitle>
                          <Badge className="bg-primary text-primary-foreground">Championship</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            {tournament.winner_name ? (
                              <div className="flex items-center gap-3">
                                <Crown className="h-5 w-5 text-primary" />
                                <div>
                                  <div className="font-bold text-foreground">Winner</div>
                                  <div className="text-muted-foreground">
                                    {tournament.winner_name}
                                    {tournament.winner_school && ` (${tournament.winner_school})`}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <Crown className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <div className="font-bold text-foreground">Winner</div>
                                  <div className="text-muted-foreground">Results pending</div>
                                </div>
                              </div>
                            )}
                            
                            {tournament.runner_up_name && (
                              <div className="flex items-center gap-3">
                                <Medal className="h-5 w-5 text-primary/80" />
                                <div>
                                  <div className="font-bold text-foreground">Runner-up</div>
                                  <div className="text-muted-foreground">
                                    {tournament.runner_up_name}
                                    {tournament.runner_up_school && ` (${tournament.runner_up_school})`}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(tournament.start_date).toLocaleDateString()}
                                {tournament.end_date && tournament.end_date !== tournament.start_date && 
                                  ` - ${new Date(tournament.end_date).toLocaleDateString()}`}
                              </span>
                            </div>
                            {tournament.location && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{tournament.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{tournament.participant_count} participants</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Trophy className="h-4 w-4" />
                              <span>{tournament.format}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Results;
