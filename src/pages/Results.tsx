import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, Calendar, Users, Search, Crown, Star, MapPin, DollarSign, Gift, Building, MessageSquare, TrendingUp, Swords, ArrowRightLeft, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  event_id: string | null;
  event_name: string | null;
}

interface EventGroup {
  event_id: string;
  event_name: string;
  teams: TournamentResult[];
}

interface GroupedTournamentResults {
  tournament_id: string;
  tournament_name: string;
  format: string;
  start_date: string;
  teams: TournamentResult[];
  events: EventGroup[];
  is_multi_format: boolean;
}

interface TopPerformer {
  participant_name: string;
  school: string | null;
  total_wins: number;
  total_losses: number;
  total_speaks: number;
  speaks_avg: number;
  tournaments_count: number;
  total_rounds: number;
  win_rate: number;
}

interface ChampionshipSponsor {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  tier: string;
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
  prize_pool: string | null;
  cash_prize_total: number | null;
  prize_items: string[];
  sponsors: ChampionshipSponsor[];
}

interface CompetitorOption {
  name: string;
  school: string | null;
}

interface CompetitorStats {
  name: string;
  school: string | null;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  avg_speaks: number;
  total_rounds: number;
  tournaments_count: number;
}

interface HeadToHeadMatch {
  id: string;
  tournament_name: string;
  round_name: string;
  date: string;
  winner: string;
  competitor1_side: 'aff' | 'neg';
  competitor1_speaks: number | null;
  competitor2_speaks: number | null;
}

interface HeadToHeadResult {
  competitor1: CompetitorStats;
  competitor2: CompetitorStats;
  matches: HeadToHeadMatch[];
  competitor1_wins: number;
  competitor2_wins: number;
}

const Results = () => {
  const [recentResults, setRecentResults] = useState<TournamentResult[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [timePeriod, setTimePeriod] = useState('all');
  const [formats, setFormats] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedEventByTournament, setSelectedEventByTournament] = useState<Record<string, string>>({});
  
  // Compare tab state
  const [competitor1, setCompetitor1] = useState<string | null>(null);
  const [competitor2, setCompetitor2] = useState<string | null>(null);
  const [headToHead, setHeadToHead] = useState<HeadToHeadResult | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);

  useEffect(() => {
    fetchAllResults();
  }, []);

  const fetchAllResults = async () => {
    try {
      // Fetch recent tournament results from tournament_standings with event info
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
            school_organization,
            event_id,
            event:tournament_events(id, name)
          ),
          tournament:tournaments(
            id,
            name,
            format,
            start_date
          )
        `)
        .order('rank')
        .limit(500);

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
            event_id: (s.registration as any)?.event_id || null,
            event_name: (s.registration as any)?.event?.name || null,
          }));
        
        setRecentResults(formattedResults);
        
        // Extract unique formats
        const uniqueFormats = [...new Set(formattedResults.map(r => r.format).filter(Boolean))];
        setFormats(uniqueFormats);

        // Extract available years from tournament dates
        const years = [...new Set(
          formattedResults
            .map(r => new Date(r.start_date).getFullYear())
            .filter(y => !isNaN(y))
        )].sort((a, b) => b - a); // Most recent first
        setAvailableYears(years);
      }

      // Fetch completed championship tournaments with prize info
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          format,
          start_date,
          end_date,
          location,
          prize_pool,
          cash_prize_total,
          prize_items
        `)
        .eq('status', 'Completed')
        .eq('is_championship', true)
        .order('end_date', { ascending: false })
        .limit(50);

      if (tournamentsError) {
        console.error('Error fetching tournaments:', tournamentsError);
      } else if (tournamentsData && tournamentsData.length > 0) {
        // For each completed championship, fetch winner, runner-up, and sponsors
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

            // Get linked sponsors - fetch separately to avoid type issues
            let sponsors: ChampionshipSponsor[] = [];
            try {
              const sponsorLinksQuery = supabase
                .from('tournament_sponsor_links' as any)
                .select('tier, sponsor_profile_id')
                .eq('tournament_id', tournament.id)
                .eq('status', 'approved')
                .order('display_order');
              const { data: sponsorLinks } = await sponsorLinksQuery;

              if (sponsorLinks && (sponsorLinks as any[]).length > 0) {
                const sponsorIds = (sponsorLinks as any[]).map((l: any) => l.sponsor_profile_id);
                const { data: sponsorProfiles } = await supabase
                  .from('sponsor_profiles')
                  .select('id, name, logo_url, description')
                  .in('id', sponsorIds);
                
                if (sponsorProfiles) {
                  sponsors = (sponsorLinks as any[])
                    .map((link: any) => {
                      const profile = sponsorProfiles.find(p => p.id === link.sponsor_profile_id);
                      if (!profile) return null;
                      return {
                        id: profile.id,
                        name: profile.name,
                        logo_url: profile.logo_url,
                        description: profile.description,
                        tier: link.tier,
                      };
                    })
                    .filter((s: any): s is ChampionshipSponsor => s !== null);
                }
              }
            } catch (err) {
              console.error('Error fetching sponsors:', err);
            }

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
              prize_pool: tournament.prize_pool,
              cash_prize_total: tournament.cash_prize_total,
              prize_items: Array.isArray(tournament.prize_items) ? tournament.prize_items : [],
              sponsors,
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

  // Filter by time period
  const filterByTimePeriod = (date: string) => {
    if (timePeriod === 'all') return true;
    const year = new Date(date).getFullYear();
    return year === parseInt(timePeriod);
  };

  // Calculate top performers from filtered results
  const { topBySpeaks, topByWinRate } = useMemo(() => {
    const filteredByTime = recentResults.filter(r => filterByTimePeriod(r.start_date));
    
    const performerMap = new Map<string, TopPerformer>();
    filteredByTime.forEach(result => {
      const key = result.participant_name;
      const existing = performerMap.get(key);
      const rounds = result.wins + result.losses;
      
      if (existing) {
        existing.total_wins += result.wins;
        existing.total_losses += result.losses;
        existing.total_speaks += result.speaks_total;
        existing.total_rounds += rounds;
        existing.tournaments_count += 1;
        // Recalculate average speaks
        existing.speaks_avg = existing.total_rounds > 0 
          ? existing.total_speaks / existing.total_rounds 
          : 0;
      } else {
        performerMap.set(key, {
          participant_name: result.participant_name,
          school: result.school,
          total_wins: result.wins,
          total_losses: result.losses,
          total_speaks: result.speaks_total,
          speaks_avg: rounds > 0 ? result.speaks_total / rounds : 0,
          tournaments_count: 1,
          total_rounds: rounds,
          win_rate: 0,
        });
      }
    });

    // Calculate win rates
    const performers = Array.from(performerMap.values()).map(p => ({
      ...p,
      win_rate: p.total_wins + p.total_losses > 0 
        ? Math.round((p.total_wins / (p.total_wins + p.total_losses)) * 100) 
        : 0
    }));

    // Top by speaker points (sorted by speaks_avg)
    const topBySpeaks = [...performers]
      .filter(p => p.total_rounds >= 2) // Minimum 2 rounds
      .sort((a, b) => b.speaks_avg - a.speaks_avg)
      .slice(0, 10);

    // Top by win rate (minimum 4 rounds to qualify)
    const topByWinRate = [...performers]
      .filter(p => p.total_rounds >= 4) // Minimum 4 rounds
      .sort((a, b) => {
        if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
        return b.total_wins - a.total_wins; // Tiebreaker: total wins
      })
      .slice(0, 10);

    return { topBySpeaks, topByWinRate };
  }, [recentResults, timePeriod]);

  const getPositionIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <Trophy className="h-5 w-5 text-muted-foreground" />;
  };

  const getPositionCircleStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 shadow-lg shadow-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 shadow-lg shadow-slate-400/30';
    if (rank === 3) return 'bg-gradient-to-br from-amber-400 to-amber-700 text-amber-950 shadow-lg shadow-amber-500/30';
    return 'bg-muted border border-border text-muted-foreground';
  };

  const getPositionBadge = (rank: number) => {
    if (rank === 1) return { text: '🥇 1st Place', variant: 'default' as const, className: 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-yellow-950 border-0' };
    if (rank === 2) return { text: '🥈 2nd Place', variant: 'secondary' as const, className: 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-950 border-0' };
    if (rank === 3) return { text: '🥉 3rd Place', variant: 'secondary' as const, className: 'bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 border-0' };
    if (rank <= 8) return { text: `${rank}th Place`, variant: 'outline' as const, className: 'bg-muted text-muted-foreground' };
    return { text: `${rank}th`, variant: 'outline' as const, className: 'border-border text-muted-foreground' };
  };

  // Filter results based on search, format, and time period
  const filteredResults = recentResults.filter(result => {
    const matchesSearch = searchQuery === '' || 
      result.tournament_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (result.school?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFormat = formatFilter === 'all' || result.format === formatFilter;
    const matchesTime = filterByTimePeriod(result.start_date);
    
    return matchesSearch && matchesFormat && matchesTime;
  });

  // Filter championships by time period
  const filteredChampionships = championships.filter(c => filterByTimePeriod(c.start_date));

  // Group results by tournament and events
  const groupResultsByTournament = (results: TournamentResult[]): GroupedTournamentResults[] => {
    const groupMap = new Map<string, GroupedTournamentResults>();
    
    results.forEach(result => {
      const existing = groupMap.get(result.tournament_id);
      if (existing) {
        existing.teams.push(result);
      } else {
        groupMap.set(result.tournament_id, {
          tournament_id: result.tournament_id,
          tournament_name: result.tournament_name,
          format: result.format,
          start_date: result.start_date,
          teams: [result],
          events: [],
          is_multi_format: false
        });
      }
    });
    
    // Process each tournament group to create event sub-groups
    return Array.from(groupMap.values())
      .map(group => {
        // Group teams by event
        const eventMap = new Map<string, EventGroup>();
        group.teams.forEach(team => {
          const eventKey = team.event_id || 'default';
          const existing = eventMap.get(eventKey);
          if (existing) {
            existing.teams.push(team);
          } else {
            eventMap.set(eventKey, {
              event_id: team.event_id || 'default',
              event_name: team.event_name || group.format || 'Main Event',
              teams: [team]
            });
          }
        });
        
        // Sort teams within each event by rank
        const events = Array.from(eventMap.values())
          .map(event => ({
            ...event,
            teams: event.teams.sort((a, b) => a.rank - b.rank)
          }))
          .sort((a, b) => a.event_name.localeCompare(b.event_name));
        
        return {
          ...group,
          teams: group.teams.sort((a, b) => a.rank - b.rank),
          events,
          is_multi_format: events.length > 1
        };
      })
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  };

  const groupedResults = groupResultsByTournament(filteredResults);

  // Get unique competitors for comparison feature
  const uniqueCompetitors = useMemo<CompetitorOption[]>(() => {
    const competitorMap = new Map<string, CompetitorOption>();
    recentResults.forEach(result => {
      if (!competitorMap.has(result.participant_name)) {
        competitorMap.set(result.participant_name, {
          name: result.participant_name,
          school: result.school
        });
      }
    });
    return Array.from(competitorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [recentResults]);

  // Fetch head-to-head data
  const fetchHeadToHead = async () => {
    if (!competitor1 || !competitor2 || competitor1 === competitor2) return;
    
    setComparisonLoading(true);
    setHeadToHead(null);
    
    try {
      // Get registration IDs for both competitors
      const { data: reg1Data } = await supabase
        .from('tournament_registrations')
        .select('id, tournament_id, tournament:tournaments(name, start_date)')
        .eq('participant_name', competitor1);
      
      const { data: reg2Data } = await supabase
        .from('tournament_registrations')
        .select('id, tournament_id')
        .eq('participant_name', competitor2);
      
      const regIds1 = reg1Data?.map(r => r.id) || [];
      const regIds2 = reg2Data?.map(r => r.id) || [];
      
      if (regIds1.length === 0 || regIds2.length === 0) {
        setComparisonLoading(false);
        return;
      }
      
      // Find pairings where they faced each other
      const { data: matchups } = await supabase
        .from('pairings')
        .select(`
          id,
          result,
          scheduled_time,
          aff_registration_id,
          neg_registration_id,
          round:rounds(name),
          tournament:tournaments(name, start_date)
        `)
        .not('result', 'is', null)
        .or(`aff_registration_id.in.(${regIds1.join(',')}),neg_registration_id.in.(${regIds1.join(',')})`)
        .or(`aff_registration_id.in.(${regIds2.join(',')}),neg_registration_id.in.(${regIds2.join(',')})`);
      
      // Filter to only matchups between the two competitors
      const directMatchups = (matchups || []).filter(m => {
        const isComp1Aff = regIds1.includes(m.aff_registration_id);
        const isComp1Neg = regIds1.includes(m.neg_registration_id);
        const isComp2Aff = regIds2.includes(m.aff_registration_id);
        const isComp2Neg = regIds2.includes(m.neg_registration_id);
        return (isComp1Aff && isComp2Neg) || (isComp1Neg && isComp2Aff);
      });
      
      // Calculate stats from recent results
      const comp1Results = recentResults.filter(r => r.participant_name === competitor1);
      const comp2Results = recentResults.filter(r => r.participant_name === competitor2);
      
      const comp1Stats: CompetitorStats = {
        name: competitor1,
        school: comp1Results[0]?.school || null,
        total_wins: comp1Results.reduce((sum, r) => sum + r.wins, 0),
        total_losses: comp1Results.reduce((sum, r) => sum + r.losses, 0),
        win_rate: 0,
        avg_speaks: comp1Results.length > 0 
          ? comp1Results.reduce((sum, r) => sum + r.speaks_avg, 0) / comp1Results.length 
          : 0,
        total_rounds: comp1Results.reduce((sum, r) => sum + r.wins + r.losses, 0),
        tournaments_count: comp1Results.length
      };
      comp1Stats.win_rate = comp1Stats.total_rounds > 0 
        ? Math.round((comp1Stats.total_wins / comp1Stats.total_rounds) * 100) 
        : 0;
      
      const comp2Stats: CompetitorStats = {
        name: competitor2,
        school: comp2Results[0]?.school || null,
        total_wins: comp2Results.reduce((sum, r) => sum + r.wins, 0),
        total_losses: comp2Results.reduce((sum, r) => sum + r.losses, 0),
        win_rate: 0,
        avg_speaks: comp2Results.length > 0 
          ? comp2Results.reduce((sum, r) => sum + r.speaks_avg, 0) / comp2Results.length 
          : 0,
        total_rounds: comp2Results.reduce((sum, r) => sum + r.wins + r.losses, 0),
        tournaments_count: comp2Results.length
      };
      comp2Stats.win_rate = comp2Stats.total_rounds > 0 
        ? Math.round((comp2Stats.total_wins / comp2Stats.total_rounds) * 100) 
        : 0;
      
      // Process direct matchups
      let comp1Wins = 0;
      let comp2Wins = 0;
      const matches: HeadToHeadMatch[] = directMatchups.map(m => {
        const result = m.result as any;
        const isComp1Aff = regIds1.includes(m.aff_registration_id);
        const winner = result?.winner === 'aff' 
          ? (isComp1Aff ? competitor1 : competitor2)
          : (isComp1Aff ? competitor2 : competitor1);
        
        if (winner === competitor1) comp1Wins++;
        else comp2Wins++;
        
        return {
          id: m.id,
          tournament_name: (m.tournament as any)?.name || 'Unknown',
          round_name: (m.round as any)?.name || 'Unknown Round',
          date: (m.tournament as any)?.start_date || '',
          winner,
          competitor1_side: (isComp1Aff ? 'aff' : 'neg') as 'aff' | 'neg',
          competitor1_speaks: isComp1Aff ? result?.aff_speaks : result?.neg_speaks,
          competitor2_speaks: isComp1Aff ? result?.neg_speaks : result?.aff_speaks,
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHeadToHead({
        competitor1: comp1Stats,
        competitor2: comp2Stats,
        matches,
        competitor1_wins: comp1Wins,
        competitor2_wins: comp2Wins
      });
    } catch (error) {
      console.error('Error fetching head-to-head:', error);
    } finally {
      setComparisonLoading(false);
    }
  };

  const swapCompetitors = () => {
    const temp = competitor1;
    setCompetitor1(competitor2);
    setCompetitor2(temp);
    setHeadToHead(null);
  };

  const getTimePeriodLabel = () => {
    if (timePeriod === 'all') return 'All Time';
    return timePeriod;
  };

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

              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-36">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
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
              <TabsTrigger value="compare" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5">
                <Swords className="h-4 w-4" />
                Compare
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-6">
              {groupedResults.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Results Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || formatFilter !== 'all' || timePeriod !== 'all'
                        ? 'No results match your search criteria.'
                        : 'Tournament results will appear here once competitions conclude.'}
                    </p>
                    <Button variant="outline" asChild>
                      <a href="/tournaments">Browse Upcoming Tournaments</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {groupedResults.map((group) => {
                    const selectedEvent = selectedEventByTournament[group.tournament_id] || group.events[0]?.event_id || 'default';
                    const currentEventTeams = group.is_multi_format 
                      ? group.events.find(e => e.event_id === selectedEvent)?.teams || []
                      : group.teams;
                    
                    return (
                      <Card key={group.tournament_id} className="overflow-hidden">
                        {/* Tournament Header */}
                        <CardHeader className="bg-muted/50 border-b border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl">{group.tournament_name}</CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Badge variant="outline">{group.format}</Badge>
                                <span>•</span>
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(group.start_date).toLocaleDateString()}</span>
                                <span>•</span>
                                <Users className="h-4 w-4" />
                                <span>{group.teams.length} teams</span>
                              </div>
                            </div>
                            <Trophy className="h-8 w-8 text-yellow-500/40" />
                          </div>
                          
                          {/* Event Tabs for Multi-Format Tournaments */}
                          {group.is_multi_format && (
                            <div className="mt-4">
                              <Tabs 
                                value={selectedEvent} 
                                onValueChange={(value) => setSelectedEventByTournament(prev => ({ ...prev, [group.tournament_id]: value }))}
                              >
                                <TabsList className="bg-background/50 h-auto flex-wrap">
                                  {group.events.map((event) => (
                                    <TabsTrigger 
                                      key={event.event_id} 
                                      value={event.event_id}
                                      className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                    >
                                      {event.event_name}
                                      <span className="ml-1.5 text-[10px] opacity-70">({event.teams.length})</span>
                                    </TabsTrigger>
                                  ))}
                                </TabsList>
                              </Tabs>
                            </div>
                          )}
                        </CardHeader>
                        
                        {/* Teams List */}
                        <CardContent className="p-0">
                          <div className="divide-y divide-border">
                            {currentEventTeams.map((result) => {
                              const badge = getPositionBadge(result.rank);
                              return (
                                <div 
                                  key={result.id} 
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getPositionCircleStyle(result.rank)}`}>
                                      {getPositionIcon(result.rank)}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-foreground">
                                        {result.participant_name}
                                        {result.partner_name && ` & ${result.partner_name}`}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {result.school || 'Independent'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 ml-13 sm:ml-0">
                                    <div className="text-right text-sm">
                                      <div className="font-medium text-foreground">{result.wins}W - {result.losses}L</div>
                                      <div className="text-muted-foreground">{result.speaks_avg.toFixed(1)} avg</div>
                                    </div>
                                    <Badge className={badge.className}>
                                      {badge.text}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rankings" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top by Speaker Points */}
                <Card>
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-border">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-amber-500" />
                      Top Speaker Points
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getTimePeriodLabel()} • Ranked by average speaker points
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {topBySpeaks.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No speaker data available for this period.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {topBySpeaks.map((performer, index) => (
                          <div 
                            key={performer.participant_name} 
                            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 shadow-md' : 
                                index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 shadow-md' : 
                                index === 2 ? 'bg-gradient-to-br from-amber-400 to-amber-700 text-amber-950 shadow-md' : 
                                'bg-muted text-muted-foreground'
                              }`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{performer.participant_name}</div>
                                <div className="text-xs text-muted-foreground">{performer.school || 'Independent'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-amber-600 dark:text-amber-400">
                                {performer.speaks_avg.toFixed(1)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {performer.total_rounds} rounds
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top by Win Rate */}
                <Card>
                  <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-border">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Top Win Rate
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getTimePeriodLabel()} • Min 4 rounds • Ranked by win %
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {topByWinRate.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No win data available for this period.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {topByWinRate.map((performer, index) => (
                          <div 
                            key={performer.participant_name} 
                            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-emerald-950 shadow-md' : 
                                index === 1 ? 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-emerald-950 shadow-md' : 
                                index === 2 ? 'bg-gradient-to-br from-emerald-200 to-emerald-400 text-emerald-900 shadow-md' : 
                                'bg-muted text-muted-foreground'
                              }`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{performer.participant_name}</div>
                                <div className="text-xs text-muted-foreground">{performer.school || 'Independent'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                {performer.win_rate}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {performer.total_wins}W-{performer.total_losses}L
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="championships" className="space-y-8">
              {filteredChampionships.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Crown className="h-16 w-16 text-primary/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Championship Tournaments</h3>
                    <p className="text-muted-foreground">
                      {timePeriod !== 'all' 
                        ? `No championship results found for ${timePeriod}.`
                        : 'Championship results will appear here once designated championship tournaments are completed.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredChampionships.map((tournament) => (
                  <Card key={tournament.id} className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all">
                    {/* Championship Header */}
                    <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-b border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/20">
                            <Crown className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(tournament.start_date).toLocaleDateString()}
                                {tournament.end_date && tournament.end_date !== tournament.start_date && 
                                  ` - ${new Date(tournament.end_date).toLocaleDateString()}`}
                              </span>
                              {tournament.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {tournament.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                          Championship
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                      {/* Prize Pool Section */}
                      {(tournament.cash_prize_total || tournament.prize_pool || tournament.prize_items.length > 0) && (
                        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-foreground">Prize Pool</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            {tournament.cash_prize_total && (
                              <Badge variant="outline" className="text-lg px-4 py-2 border-primary/30 bg-primary/5">
                                ${tournament.cash_prize_total.toLocaleString()} Cash
                              </Badge>
                            )}
                            {tournament.prize_pool && (
                              <span className="text-muted-foreground">{tournament.prize_pool}</span>
                            )}
                            {tournament.prize_items.map((item, idx) => (
                              <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                <Gift className="h-3 w-3" />
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sponsors Section */}
                      {tournament.sponsors.length > 0 && (
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-2 mb-3">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold text-foreground">Presented By</span>
                          </div>
                          <div className="flex flex-wrap gap-4">
                            {tournament.sponsors.map((sponsor) => (
                              <div key={sponsor.id} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border">
                                {sponsor.logo_url ? (
                                  <img 
                                    src={sponsor.logo_url} 
                                    alt={sponsor.name} 
                                    className="h-10 w-10 object-contain rounded"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                    <Building className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-foreground text-sm">{sponsor.name}</div>
                                  {sponsor.description && (
                                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                      {sponsor.description}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {sponsor.tier}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Champions Section */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Winner Card - Gold Theme */}
                        <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/20 via-yellow-400/10 to-transparent border-2 border-yellow-500/40 relative overflow-hidden shadow-lg shadow-yellow-500/10">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md">
                                <Crown className="h-5 w-5 text-yellow-950" />
                              </div>
                              <span className="font-bold text-yellow-600 dark:text-yellow-400 uppercase text-sm tracking-wide">🥇 Champion</span>
                            </div>
                            {tournament.winner_name ? (
                              <div>
                                <div className="text-xl font-bold text-foreground">{tournament.winner_name}</div>
                                {tournament.winner_school && (
                                  <div className="text-muted-foreground">{tournament.winner_school}</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">Results pending</div>
                            )}
                          </div>
                        </div>

                        {/* Runner-up Card - Silver Theme */}
                        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-400/20 via-slate-300/10 to-transparent border-2 border-slate-400/40 relative overflow-hidden shadow-lg shadow-slate-400/10">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-slate-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-md">
                                <Medal className="h-5 w-5 text-slate-950" />
                              </div>
                              <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-sm tracking-wide">🥈 Runner-up</span>
                            </div>
                            {tournament.runner_up_name ? (
                              <div>
                                <div className="text-lg font-semibold text-foreground">{tournament.runner_up_name}</div>
                                {tournament.runner_up_school && (
                                  <div className="text-muted-foreground text-sm">{tournament.runner_up_school}</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">Results pending</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {tournament.participant_count} participants
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            {tournament.format}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Compare Tab */}
            <TabsContent value="compare" className="space-y-6">
              {/* Competitor Selectors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-primary" />
                    Compare Competitors
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select two competitors to compare their overall statistics and head-to-head record
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-[1fr_auto_1fr_auto] gap-4 items-end">
                    {/* Competitor 1 Selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Competitor 1</label>
                      <Popover open={open1} onOpenChange={setOpen1}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open1}
                            className="w-full justify-between"
                          >
                            {competitor1 || "Select competitor..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search competitors..." />
                            <CommandList>
                              <CommandEmpty>No competitor found.</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-y-auto">
                                {uniqueCompetitors.map((c) => (
                                  <CommandItem
                                    key={c.name}
                                    value={c.name}
                                    onSelect={(value) => {
                                      setCompetitor1(value === competitor1 ? null : value);
                                      setOpen1(false);
                                      setHeadToHead(null);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        competitor1 === c.name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div>
                                      <div>{c.name}</div>
                                      {c.school && <div className="text-xs text-muted-foreground">{c.school}</div>}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Swap Button */}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={swapCompetitors}
                      disabled={!competitor1 && !competitor2}
                      className="hidden md:flex"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>

                    {/* Competitor 2 Selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Competitor 2</label>
                      <Popover open={open2} onOpenChange={setOpen2}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open2}
                            className="w-full justify-between"
                          >
                            {competitor2 || "Select competitor..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search competitors..." />
                            <CommandList>
                              <CommandEmpty>No competitor found.</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-y-auto">
                                {uniqueCompetitors.map((c) => (
                                  <CommandItem
                                    key={c.name}
                                    value={c.name}
                                    onSelect={(value) => {
                                      setCompetitor2(value === competitor2 ? null : value);
                                      setOpen2(false);
                                      setHeadToHead(null);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        competitor2 === c.name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div>
                                      <div>{c.name}</div>
                                      {c.school && <div className="text-xs text-muted-foreground">{c.school}</div>}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Compare Button */}
                    <Button 
                      onClick={fetchHeadToHead}
                      disabled={!competitor1 || !competitor2 || competitor1 === competitor2 || comparisonLoading}
                    >
                      {comparisonLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Swords className="mr-2 h-4 w-4" />
                          Compare
                        </>
                      )}
                    </Button>
                  </div>

                  {competitor1 === competitor2 && competitor1 && (
                    <p className="text-sm text-destructive">Please select two different competitors</p>
                  )}
                </CardContent>
              </Card>

              {/* Comparison Results */}
              {headToHead && (
                <div className="space-y-6">
                  {/* Stats Cards Side-by-Side */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Competitor 1 Stats */}
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{headToHead.competitor1.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{headToHead.competitor1.school || 'Independent'}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-2xl font-bold text-foreground">
                              {headToHead.competitor1.total_wins}-{headToHead.competitor1.total_losses}
                            </div>
                            <div className="text-xs text-muted-foreground">Win-Loss Record</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-primary">{headToHead.competitor1.win_rate}%</div>
                            <div className="text-xs text-muted-foreground">Win Rate</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-foreground">{headToHead.competitor1.avg_speaks.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">Avg Speaker Points</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-foreground">{headToHead.competitor1.tournaments_count}</div>
                            <div className="text-xs text-muted-foreground">Tournaments</div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Win Rate</span>
                            <span>{headToHead.competitor1.win_rate}%</span>
                          </div>
                          <Progress value={headToHead.competitor1.win_rate} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Competitor 2 Stats */}
                    <Card className="border-l-4 border-l-secondary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{headToHead.competitor2.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{headToHead.competitor2.school || 'Independent'}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-2xl font-bold text-foreground">
                              {headToHead.competitor2.total_wins}-{headToHead.competitor2.total_losses}
                            </div>
                            <div className="text-xs text-muted-foreground">Win-Loss Record</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-secondary">{headToHead.competitor2.win_rate}%</div>
                            <div className="text-xs text-muted-foreground">Win Rate</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-foreground">{headToHead.competitor2.avg_speaks.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">Avg Speaker Points</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-foreground">{headToHead.competitor2.tournaments_count}</div>
                            <div className="text-xs text-muted-foreground">Tournaments</div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Win Rate</span>
                            <span>{headToHead.competitor2.win_rate}%</span>
                          </div>
                          <Progress value={headToHead.competitor2.win_rate} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Head-to-Head Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5" />
                        Head-to-Head Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {headToHead.matches.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="font-semibold text-foreground mb-1">No Direct Matchups Found</h3>
                          <p className="text-sm text-muted-foreground">
                            These competitors have not faced each other in recorded tournaments.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Win Summary */}
                          <div className="flex items-center justify-center gap-8 mb-6 p-4 bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <div className={cn(
                                "text-4xl font-bold",
                                headToHead.competitor1_wins > headToHead.competitor2_wins 
                                  ? "text-primary" 
                                  : "text-muted-foreground"
                              )}>
                                {headToHead.competitor1_wins}
                              </div>
                              <p className="text-sm text-muted-foreground">{headToHead.competitor1.name}</p>
                            </div>
                            <div className="text-2xl text-muted-foreground font-light">vs</div>
                            <div className="text-center">
                              <div className={cn(
                                "text-4xl font-bold",
                                headToHead.competitor2_wins > headToHead.competitor1_wins 
                                  ? "text-secondary" 
                                  : "text-muted-foreground"
                              )}>
                                {headToHead.competitor2_wins}
                              </div>
                              <p className="text-sm text-muted-foreground">{headToHead.competitor2.name}</p>
                            </div>
                          </div>

                          {/* Match History Table */}
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tournament</TableHead>
                                <TableHead>Round</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Winner</TableHead>
                                <TableHead className="text-right">Speaker Points</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {headToHead.matches.map((match) => (
                                <TableRow key={match.id}>
                                  <TableCell className="font-medium">{match.tournament_name}</TableCell>
                                  <TableCell>{match.round_name}</TableCell>
                                  <TableCell>{new Date(match.date).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {match.winner === headToHead.competitor1.name ? (
                                        <Trophy className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Trophy className="h-4 w-4 text-secondary" />
                                      )}
                                      <span className={cn(
                                        "font-medium",
                                        match.winner === headToHead.competitor1.name 
                                          ? "text-primary" 
                                          : "text-secondary"
                                      )}>
                                        {match.winner}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-primary">{match.competitor1_speaks ?? '-'}</span>
                                    <span className="text-muted-foreground mx-2">vs</span>
                                    <span className="text-secondary">{match.competitor2_speaks ?? '-'}</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Empty State */}
              {!headToHead && !comparisonLoading && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Swords className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Compare Head-to-Head</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Select two competitors above to view their overall statistics side-by-side 
                      and see their head-to-head matchup history.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Results;
