import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, Clock, Trophy, Search, Filter } from "lucide-react";

const tournaments = [
  {
    id: 1,
    name: "National Debate Championship 2024",
    format: "Policy Debate",
    date: "March 15-17, 2024",
    location: "Harvard University",
    participants: 128,
    status: "Registration Open",
    prize: "$50,000"
  },
  {
    id: 2,
    name: "Regional Parliamentary Tournament",
    format: "Parliamentary",
    date: "April 8-9, 2024", 
    location: "Stanford University",
    participants: 64,
    status: "Registration Closed",
    prize: "$25,000"
  },
  {
    id: 3,
    name: "High School Invitational",
    format: "Public Forum",
    date: "May 2-4, 2024",
    location: "Yale University", 
    participants: 96,
    status: "Upcoming",
    prize: "$15,000"
  },
  {
    id: 4,
    name: "Collegiate World Series",
    format: "British Parliamentary",
    date: "June 20-23, 2024",
    location: "Oxford University",
    participants: 200,
    status: "Planning Phase",
    prize: "$100,000"
  }
];

const Tournaments = () => {
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
              />
            </div>
            
            <div className="flex gap-4">
              <Select>
                <SelectTrigger className="w-40 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="policy" className="text-white hover:bg-white/10">Policy Debate</SelectItem>
                  <SelectItem value="parliamentary" className="text-white hover:bg-white/10">Parliamentary</SelectItem>
                  <SelectItem value="public-forum" className="text-white hover:bg-white/10">Public Forum</SelectItem>
                  <SelectItem value="british-parliamentary" className="text-white hover:bg-white/10">British Parliamentary</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-40 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="open" className="text-white hover:bg-white/10">Registration Open</SelectItem>
                  <SelectItem value="closed" className="text-white hover:bg-white/10">Registration Closed</SelectItem>
                  <SelectItem value="upcoming" className="text-white hover:bg-white/10">Upcoming</SelectItem>
                  <SelectItem value="planning" className="text-white hover:bg-white/10">Planning Phase</SelectItem>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="bg-black border-white/10 hover:border-red-500/30 transition-smooth group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge 
                      variant={tournament.status === 'Registration Open' ? 'default' : 'secondary'}
                      className={tournament.status === 'Registration Open' ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70'}
                    >
                      {tournament.status}
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm text-white/70">Prize Pool</div>
                      <div className="font-bold text-red-500">{tournament.prize}</div>
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl text-white font-primary group-hover:text-red-500 transition-smooth">
                    {tournament.name}
                  </CardTitle>
                  
                  <div className="text-sm text-red-500 font-medium">
                    {tournament.format}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar className="h-4 w-4" />
                      <span>{tournament.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/70">
                      <Users className="h-4 w-4" />
                      <span>{tournament.participants} participants</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/70">
                      <Trophy className="h-4 w-4" />
                      <span>{tournament.location}</span>
                    </div>
                    
                    <div className="pt-4 flex gap-2">
                      <Button 
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        disabled={tournament.status === 'Registration Closed'}
                      >
                        {tournament.status === 'Registration Open' ? 'Register Now' : 'View Details'}
                      </Button>
                      
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        Learn More
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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