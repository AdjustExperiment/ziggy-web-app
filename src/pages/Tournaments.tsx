
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 font-primary">
              Tournament Directory
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Discover and register for prestigious debate tournaments worldwide. 
              Compete against the best debaters and elevate your skills.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-black/95 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <Input
                placeholder="Search tournaments..."
                className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-40 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">All Formats</SelectItem>
                  <SelectItem value="Policy Debate" className="text-white hover:bg-white/10">Policy Debate</SelectItem>
                  <SelectItem value="Parliamentary" className="text-white hover:bg-white/10">Parliamentary</SelectItem>
                  <SelectItem value="Public Forum" className="text-white hover:bg-white/10">Public Forum</SelectItem>
                  <SelectItem value="British Parliamentary" className="text-white hover:bg-white/10">British Parliamentary</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">All Status</SelectItem>
                  <SelectItem value="Registration Open" className="text-white hover:bg-white/10">Registration Open</SelectItem>
                  <SelectItem value="Registration Closed" className="text-white hover:bg-white/10">Registration Closed</SelectItem>
                  <SelectItem value="Ongoing" className="text-white hover:bg-white/10">Ongoing</SelectItem>
                  <SelectItem value="Planning Phase" className="text-white hover:bg-white/10">Planning Phase</SelectItem>
                  <SelectItem value="Completed" className="text-white hover:bg-white/10">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-white/30 text-white hover:bg-red-500 hover:border-red-500">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Grid */}
      <section className="py-12 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
              <p className="mt-4 text-white/70">Loading tournaments...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No tournaments found</h3>
              <p className="text-white/70">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {filteredTournaments.map((tournament) => (
                <Card key={tournament.id} className="bg-black border-white/10 hover:border-red-500/30 transition-smooth group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge 
                        variant={tournament.registration_open ? 'default' : 'secondary'}
                        className={tournament.registration_open ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70'}
                      >
                        {tournament.status}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm text-white/70">Prize Pool</div>
                        <div className="font-bold text-red-500">
                          {tournament.prize_pool || (tournament.cash_prize_total > 0 ? `$${tournament.cash_prize_total.toLocaleString()}` : 'TBD')}
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl text-white font-primary group-hover:text-red-500 transition-smooth">
                      {tournament.name}
                    </CardTitle>
                    
                    <div className="text-sm text-red-500 font-medium">
                      {tournament.format}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-white/70">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(tournament.start_date), "MMM d")} - {format(new Date(tournament.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-white/70">
                        <Users className="h-4 w-4" />
                        <span>{tournament.current_participants} / {tournament.max_participants} participants</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-white/70">
                        <Trophy className="h-4 w-4" />
                        <span>{tournament.location}</span>
                      </div>
                    </div>

                    {/* Tournament Information Preview */}
                    {tournament.tournament_info && (
                      <div className="bg-white/5 p-3 rounded-lg">
                        <TournamentInfo 
                          tournamentInfo={tournament.tournament_info} 
                          className="text-white/80 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_strong]:text-white [&_a]:text-red-400 [&_a:hover]:text-red-300 line-clamp-3"
                        />
                      </div>
                    )}

                    {/* Prize Items Preview */}
                    {tournament.prize_items.length > 0 && (
                      <div className="bg-gradient-to-r from-red-500/10 to-transparent p-3 rounded-lg">
                        <div className="text-sm text-white/70 mb-1">Additional Prizes:</div>
                        <div className="text-xs text-white/60">
                          {tournament.prize_items.slice(0, 2).join(', ')}
                          {tournament.prize_items.length > 2 && ` +${tournament.prize_items.length - 2} more`}
                        </div>
                      </div>
                    )}

                    {/* Sponsors Preview */}
                    {tournament.sponsors.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto">
                        <span className="text-xs text-white/50 whitespace-nowrap">Sponsored by:</span>
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
                              <span className="text-xs text-white/60">{sponsor.name}</span>
                            </div>
                          ))}
                          {tournament.sponsors.length > 3 && (
                            <span className="text-xs text-white/40">+{tournament.sponsors.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 flex gap-2">
                      <Button 
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
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
                        className="border-white/30 text-white hover:bg-white/10"
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
