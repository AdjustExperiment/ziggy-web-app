
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, Clock, Trophy, Search, Filter, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import TournamentInfo from "@/components/TournamentInfo";

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
  const navigate = useNavigate();

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
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-background py-16">
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
      <section className="py-8 bg-muted/20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tournaments..."
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-40 bg-background border-border text-foreground">
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
                <SelectTrigger className="w-40 bg-background border-border text-foreground">
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
        </div>
      </section>

      {/* Tournament Grid */}
      <section className="py-12 bg-background relative">
        {/* Section gradient blobs */}
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-gradient-radial from-primary/8 via-primary/4 to-transparent rounded-full blur-3xl animate-orb-1 motion-reduce:animate-none" />
        <div className="absolute bottom-10 right-20 w-[350px] h-[350px] bg-gradient-radial from-primary-glow/6 via-primary-glow/3 to-transparent rounded-full blur-2xl animate-orb-2 motion-reduce:animate-none" />
        
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
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {filteredTournaments.map((tournament) => (
                <Card key={tournament.id} className="bg-card border-border hover:border-primary/30 transition-smooth group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge 
                        variant={tournament.registration_open ? 'default' : 'secondary'}
                        className={tournament.registration_open ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      >
                        {tournament.status}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Prize Pool</div>
                        <div className="font-bold text-primary">
                          {tournament.prize_pool || (tournament.cash_prize_total > 0 ? `$${tournament.cash_prize_total.toLocaleString()}` : 'TBD')}
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl text-foreground font-primary group-hover:text-primary transition-smooth">
                      {tournament.name}
                    </CardTitle>
                    
                    <div className="text-sm text-primary font-medium">
                      {tournament.format}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(tournament.start_date), "MMM d")} - {format(new Date(tournament.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{tournament.current_participants} / {tournament.max_participants} participants</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        <span>{tournament.location}</span>
                      </div>
                    </div>

                    {/* Tournament Information Preview */}
                    {tournament.tournament_info && (
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <TournamentInfo 
                          tournamentInfo={tournament.tournament_info} 
                          className="text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a:hover]:text-primary/80 line-clamp-3"
                        />
                      </div>
                    )}

                    {/* Prize Items Preview */}
                    {tournament.prize_items.length > 0 && (
                      <div className="bg-gradient-to-r from-primary/10 to-transparent p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Additional Prizes:</div>
                        <div className="text-xs text-muted-foreground">
                          {tournament.prize_items.slice(0, 2).join(', ')}
                          {tournament.prize_items.length > 2 && ` +${tournament.prize_items.length - 2} more`}
                        </div>
                      </div>
                    )}

                    {/* Sponsors Preview */}
                    {tournament.sponsors.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto">
                        <span className="text-xs text-muted whitespace-nowrap">Sponsored by:</span>
                        <div className="flex items-center gap-2">
                          {tournament.sponsors.slice(0, 3).map((sponsor, index) => (
                            <div key={index} className="flex items-center gap-1 shrink-0">
                              {sponsor.logo_url ? (
                                <img 
                                  src={sponsor.logo_url} 
                                  alt={sponsor.name} 
                                  className="h-4 w-4 object-contain"
                                />
                              ) : null}
                              <span className="text-xs text-muted-foreground">{sponsor.name}</span>
                            </div>
                          ))}
                          {tournament.sponsors.length > 3 && (
                            <span className="text-xs text-muted">+{tournament.sponsors.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 flex gap-2">
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
                        className="border-border text-foreground hover:bg-muted"
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
      <section className="py-16 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 font-primary">
            Host Your Own Tournament
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Ready to organize a debate tournament? Our platform provides all the tools 
            you need for successful tournament management.
          </p>
          
          <Button 
            size="lg" 
            className="bg-white text-black hover:bg-white/90 shadow-glow text-lg px-8 py-6"
          >
            Create Tournament
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Tournaments;
