import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, Clock, Trophy, Search, Filter, ExternalLink, Grid3X3, List } from "lucide-react";
import { format } from "date-fns";
import TournamentInfo from "@/components/TournamentInfo";
import { FluidBlobBackground } from "@/components/FluidBlobBackground";

interface Sponsor {
  name: string;
  link?: string;
  logo_url?: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  tournament_info: string;
  format: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants: number;
  current_participants: number;
  registration_fee: number;
  prize_pool: string;
  cash_prize_total: number;
  prize_items: string[];
  sponsors: Sponsor[];
  status: string;
  registration_open: boolean;
}

const Tournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('tournament-view-mode') as 'grid' | 'list') || 'grid';
  });
  const navigate = useNavigate();

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('tournament-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      const transformedData = data?.map(tournament => ({
        ...tournament,
        sponsors: Array.isArray(tournament.sponsors) 
          ? tournament.sponsors.map((sponsor: any) => 
              typeof sponsor === 'string' ? { name: sponsor } : sponsor
            )
          : [],
        prize_items: Array.isArray(tournament.prize_items) ? tournament.prize_items : [],
        tournament_info: tournament.tournament_info || '',
        cash_prize_total: tournament.cash_prize_total || 0
      })) || [];
      
      setTournaments(transformedData);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = formatFilter === "all" || tournament.format === formatFilter;
    const matchesStatus = statusFilter === "all" || tournament.status === statusFilter;
    
    return matchesSearch && matchesFormat && matchesStatus;
  });

  const handleRegister = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}/register`);
  };

  return (
    <div className="min-h-screen relative">
      <FluidBlobBackground intensity="medium" variant="primary" />
      
      {/* Header */}
      <section className="bg-background py-16 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 font-primary">
              Tournament Directory
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover and register for prestigious debate tournaments worldwide. 
              Compete against the best debaters and elevate your skills.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-background/80 backdrop-blur-sm border-b border-border/50 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tournaments..."
                  className="pl-10 bg-background/70 backdrop-blur-sm border-border text-foreground placeholder:text-muted-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-4">
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="w-40 bg-background/70 backdrop-blur-sm border-border text-foreground">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">All Formats</SelectItem>
                    <SelectItem value="Policy Debate" className="text-foreground hover:bg-muted">Policy Debate</SelectItem>
                    <SelectItem value="Parliamentary" className="text-foreground hover:bg-muted">Parliamentary</SelectItem>
                    <SelectItem value="Public Forum" className="text-foreground hover:bg-muted">Public Forum</SelectItem>
                    <SelectItem value="British Parliamentary" className="text-foreground hover:bg-muted">British Parliamentary</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-background/70 backdrop-blur-sm border-border text-foreground">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">All Status</SelectItem>
                    <SelectItem value="Registration Open" className="text-foreground hover:bg-muted">Registration Open</SelectItem>
                    <SelectItem value="Registration Closed" className="text-foreground hover:bg-muted">Registration Closed</SelectItem>
                    <SelectItem value="Ongoing" className="text-foreground hover:bg-muted">Ongoing</SelectItem>
                    <SelectItem value="Planning Phase" className="text-foreground hover:bg-muted">Planning Phase</SelectItem>
                    <SelectItem value="Completed" className="text-foreground hover:bg-muted">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="border-border text-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-muted/50 backdrop-blur-sm rounded-lg p-1 border border-border/50">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Grid/List */}
      <section className="py-12 bg-background relative z-10">        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading tournaments...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No tournaments found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-1 lg:grid-cols-1'}`}>
              {filteredTournaments.map((tournament) => (
                <Card key={tournament.id} className={`bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:bg-card/90 transition-smooth group ${viewMode === 'list' ? 'md:flex md:flex-row' : ''}`}>
                  <CardHeader className={`${viewMode === 'list' ? 'md:flex-none md:w-1/3' : ''} pb-4`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge 
                          variant={
                            tournament.status === 'Registration Open' ? 'default' :
                            tournament.status === 'Ongoing' ? 'default' :
                            tournament.status === 'Completed' ? 'secondary' :
                            tournament.status === 'Registration Closed' ? 'destructive' :
                            'outline'
                          }
                          className={
                            tournament.status === 'Registration Open' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' :
                            tournament.status === 'Ongoing' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' :
                            tournament.status === 'Completed' ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600' :
                            tournament.status === 'Registration Closed' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' :
                            tournament.status === 'Planning Phase' ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' :
                            'bg-muted text-muted-foreground'
                          }
                        >
                          {tournament.status}
                        </Badge>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            {format(new Date(tournament.start_date), "MMM d")} - {format(new Date(tournament.end_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-muted-foreground">Prize Pool</div>
                        <div className="font-bold text-primary text-sm">
                          {tournament.prize_pool || (tournament.cash_prize_total > 0 ? `$${tournament.cash_prize_total.toLocaleString()}` : 'TBD')}
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl text-foreground font-primary group-hover:text-primary transition-smooth mb-2 leading-tight">
                      {tournament.name}
                    </CardTitle>
                    
                    <div className="text-sm text-primary font-medium">
                      {tournament.format}
                    </div>
                  </CardHeader>
                  
                  <CardContent className={`space-y-4 ${viewMode === 'list' ? 'md:flex-1' : ''} pt-0`}>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{tournament.current_participants} / {tournament.max_participants} participants</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 flex-shrink-0" />
                        <span>{tournament.location}</span>
                      </div>
                    </div>

                    {/* Tournament Information Preview */}
                    {tournament.tournament_info && (
                      <div className="bg-muted/20 p-3 rounded-lg border border-border/20">
                        <TournamentInfo 
                          tournamentInfo={tournament.tournament_info} 
                          className="text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a:hover]:text-primary/80 line-clamp-3 overflow-hidden"
                        />
                      </div>
                    )}

                    {/* Prize Items Preview */}
                    {tournament.prize_items.length > 0 && (
                      <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Additional Prizes:</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {tournament.prize_items.slice(0, 2).join(', ')}
                          {tournament.prize_items.length > 2 && ` +${tournament.prize_items.length - 2} more`}
                        </div>
                      </div>
                    )}

                    {/* Sponsors Preview */}
                    {tournament.sponsors.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground font-medium">Sponsored by:</span>
                        <div className="flex flex-wrap gap-2">
                          {tournament.sponsors.map((sponsor, index) => (
                            <div key={index} className="flex items-center gap-1 bg-muted/30 rounded-full px-2 py-1 border border-border/20">
                              {sponsor.logo_url ? (
                                <img 
                                  src={sponsor.logo_url} 
                                  alt={sponsor.name} 
                                  className="h-3 w-3 object-contain"
                                />
                              ) : null}
                              <span className="text-xs text-muted-foreground">{sponsor.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-2 flex gap-2 border-t border-border/20">
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => handleRegister(tournament.id)}
                        disabled={!tournament.registration_open || tournament.current_participants >= tournament.max_participants}
                      >
                        {tournament.registration_open && tournament.current_participants < tournament.max_participants 
                          ? `Register ($${tournament.registration_fee})` 
                          : tournament.current_participants >= tournament.max_participants 
                          ? 'Full' 
                          : 'View Details'
                        }
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="border-border text-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => handleRegister(tournament.id)}
                      >
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background relative z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-4 font-primary">
              Host Your Own Tournament
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ready to organize a debate tournament? Our platform provides all the tools 
              you need for successful tournament management.
            </p>
            
            <Button 
              size="lg" 
              variant="hero"
              className="text-lg px-8 py-6"
            >
              Create Tournament
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Tournaments;