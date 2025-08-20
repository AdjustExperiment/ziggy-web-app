import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Calendar, Users, Search, Filter, Crown, Star } from "lucide-react";

const recentResults = [
  {
    tournament: "National Debate Championship 2024",
    position: 1,
    format: "Policy Debate",
    date: "March 17, 2024",
    participants: 128,
    points: 1000,
    prize: "$15,000"
  },
  {
    tournament: "Regional Parliamentary Tournament", 
    position: 3,
    format: "Parliamentary",
    date: "April 9, 2024",
    participants: 64,
    points: 750,
    prize: "$5,000"
  },
  {
    tournament: "High School Invitational",
    position: 2,
    format: "Public Forum", 
    date: "May 4, 2024",
    participants: 96,
    points: 850,
    prize: "$8,000"
  }
];

const topPerformers = [
  {
    rank: 1,
    name: "Sarah Chen",
    school: "Harvard University",
    points: 2450,
    tournaments: 8,
    winRate: 92
  },
  {
    rank: 2,
    name: "Michael Rodriguez",
    school: "Stanford University", 
    points: 2380,
    tournaments: 7,
    winRate: 89
  },
  {
    rank: 3,
    name: "Emma Thompson",
    school: "Yale University",
    points: 2320,
    tournaments: 9,
    winRate: 87
  },
  {
    rank: 4,
    name: "David Kim",
    school: "MIT",
    points: 2290,
    tournaments: 6,
    winRate: 91
  },
  {
    rank: 5,
    name: "Jessica Wang",
    school: "Princeton University",
    points: 2250,
    tournaments: 8,
    winRate: 85
  }
];

const tournamentHistory = [
  {
    name: "World Universities Debating Championship",
    winner: "Oxford A Team",
    runnerUp: "Cambridge A Team",
    date: "December 2023",
    location: "Bangkok, Thailand",
    participants: 400
  },
  {
    name: "North American Championships",
    winner: "Harvard Crimson",
    runnerUp: "Yale Bulldogs", 
    date: "November 2023",
    location: "Toronto, Canada",
    participants: 200
  },
  {
    name: "European Debate League Final",
    winner: "LSE Lions",
    runnerUp: "Edinburgh Eagles",
    date: "October 2023", 
    location: "London, UK",
    participants: 150
  }
];

const Results = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 font-primary">
              Tournament Results
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Comprehensive results from debate tournaments worldwide. Track winners, 
              rankings, and championship outcomes.
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
                placeholder="Search results..."
                className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
              />
            </div>
            
            <div className="flex gap-4">
              <Select>
                <SelectTrigger className="w-40 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">All Formats</SelectItem>
                  <SelectItem value="policy" className="text-white hover:bg-white/10">Policy Debate</SelectItem>
                  <SelectItem value="parliamentary" className="text-white hover:bg-white/10">Parliamentary</SelectItem>
                  <SelectItem value="public-forum" className="text-white hover:bg-white/10">Public Forum</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-40 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="2024" className="text-white hover:bg-white/10">2024</SelectItem>
                  <SelectItem value="2023" className="text-white hover:bg-white/10">2023</SelectItem>
                  <SelectItem value="2022" className="text-white hover:bg-white/10">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Tabs */}
      <section className="py-12 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="recent" className="space-y-8">
            <TabsList className="bg-black border border-white/10">
              <TabsTrigger value="recent" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70">
                Recent Results
              </TabsTrigger>
              <TabsTrigger value="rankings" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70">
                Rankings
              </TabsTrigger>
              <TabsTrigger value="championships" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70">
                Championships
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-6">
              <div className="grid gap-6">
                {recentResults.map((result, index) => (
                  <Card key={index} className="bg-black border-white/10 hover:border-red-500/30 transition-smooth">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20">
                            {result.position === 1 ? (
                              <Crown className="h-6 w-6 text-red-500" />
                            ) : result.position === 2 ? (
                              <Medal className="h-6 w-6 text-red-500" />
                            ) : (
                              <Award className="h-6 w-6 text-red-500" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-bold text-white">{result.tournament}</h3>
                            <div className="flex items-center gap-4 text-sm text-white/70">
                              <span>{result.format}</span>
                              <span>•</span>
                              <span>{result.date}</span>
                              <span>•</span>
                              <span>{result.participants} participants</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            variant={result.position === 1 ? 'default' : 'secondary'}
                            className={result.position === 1 ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70'}
                          >
                            {result.position === 1 ? '1st Place' : result.position === 2 ? '2nd Place' : `${result.position}rd Place`}
                          </Badge>
                          <div className="text-sm text-white/70 mt-1">
                            {result.points} points • {result.prize}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rankings" className="space-y-6">
              <Card className="bg-black border-white/10">
                <CardHeader>
                  <CardTitle className="text-white font-primary flex items-center gap-2">
                    <Star className="h-5 w-5 text-red-500" />
                    Top Performers - Current Season
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.map((performer) => (
                      <div key={performer.rank} className="flex items-center justify-between p-4 rounded-lg bg-black/50 border border-white/5 hover:border-red-500/20 transition-smooth">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            performer.rank === 1 ? 'bg-red-500 text-white' : 
                            performer.rank === 2 ? 'bg-red-400 text-white' : 
                            performer.rank === 3 ? 'bg-red-300 text-black' : 'bg-white/10 text-white'
                          }`}>
                            {performer.rank}
                          </div>
                          
                          <div>
                            <div className="font-bold text-white">{performer.name}</div>
                            <div className="text-sm text-white/70">{performer.school}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-white">{performer.points}</div>
                            <div className="text-white/70">Points</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-white">{performer.tournaments}</div>
                            <div className="text-white/70">Tournaments</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-red-500">{performer.winRate}%</div>
                            <div className="text-white/70">Win Rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="championships" className="space-y-6">
              <div className="grid gap-6">
                {tournamentHistory.map((tournament, index) => (
                  <Card key={index} className="bg-black border-white/10 hover:border-red-500/30 transition-smooth">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white font-primary">{tournament.name}</CardTitle>
                        <Badge className="bg-red-500 text-white">Championship</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Crown className="h-5 w-5 text-red-500" />
                              <div>
                                <div className="font-bold text-white">Winner</div>
                                <div className="text-white/70">{tournament.winner}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Medal className="h-5 w-5 text-red-400" />
                              <div>
                                <div className="font-bold text-white">Runner-up</div>
                                <div className="text-white/70">{tournament.runnerUp}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-white/70">
                            <Calendar className="h-4 w-4" />
                            <span>{tournament.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/70">
                            <Trophy className="h-4 w-4" />
                            <span>{tournament.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/70">
                            <Users className="h-4 w-4" />
                            <span>{tournament.participants} participants</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Results;