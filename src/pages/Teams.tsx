import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Trophy, Target, TrendingUp, Search, Plus, UserPlus, Settings, Calendar, Medal, Crown } from "lucide-react";

const teamMembers = [
  {
    name: "Sarah Chen",
    role: "Lead Debater",
    winRate: 92,
    tournaments: 12,
    speciality: "Policy Debate",
    points: 1450,
    status: "active"
  },
  {
    name: "Michael Rodriguez",
    role: "Research Lead", 
    winRate: 87,
    tournaments: 8,
    speciality: "Parliamentary", 
    points: 1280,
    status: "active"
  },
  {
    name: "Emma Thompson",
    role: "Strategy Coordinator",
    winRate: 89,
    tournaments: 10,
    speciality: "Public Forum",
    points: 1320,
    status: "active"
  },
  {
    name: "David Kim",
    role: "Assistant Coach",
    winRate: 94,
    tournaments: 15,
    speciality: "Cross-Ex",
    points: 1580,
    status: "mentor"
  }
];

const upcomingEvents = [
  {
    title: "Team Practice Session",
    date: "Today, 3:00 PM",
    type: "practice",
    location: "Room 204"
  },
  {
    title: "Regional Qualifier",
    date: "March 25, 2024",
    type: "tournament", 
    location: "Stanford University"
  },
  {
    title: "Strategy Review Meeting",
    date: "March 22, 2024",
    type: "meeting",
    location: "Online"
  }
];

const teamStats = [
  {
    label: "Team Win Rate",
    value: "89.5%",
    change: "+5.2%",
    icon: Trophy
  },
  {
    label: "Tournaments Won",
    value: "23",
    change: "+3",
    icon: Crown
  },
  {
    label: "Active Members",
    value: "12",
    change: "+2",
    icon: Users
  },
  {
    label: "Practice Hours",
    value: "156",
    change: "+24",
    icon: Target
  }
];

const recentAchievements = [
  {
    tournament: "National Championship",
    position: "1st Place",
    date: "March 2024",
    members: ["Sarah Chen", "Michael Rodriguez"],
    prize: "$15,000"
  },
  {
    tournament: "Regional Parliamentary",
    position: "2nd Place", 
    date: "February 2024",
    members: ["Emma Thompson", "David Kim"],
    prize: "$8,000"
  }
];

const Teams = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4 font-primary">
                Team Management
              </h1>
              <p className="text-xl text-white/70 max-w-3xl">
                Manage your debate team, track member performance, and coordinate 
                training schedules for competitive success.
              </p>
            </div>
            <div className="flex gap-4">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Settings className="h-4 w-4 mr-2" />
                Team Settings
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Team Stats */}
      <section className="py-8 bg-black border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {teamStats.map((stat, index) => (
              <Card key={index} className="bg-black border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">{stat.change}</span>
                    <span className="text-white/70 ml-1">this month</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="members" className="space-y-8">
            <TabsList className="bg-black border border-white/10">
              <TabsTrigger value="members" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70">
                Team Members
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70">
                Schedule
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70">
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                  <Input
                    placeholder="Search members..."
                    className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Select>
                    <SelectTrigger className="w-40 bg-black border-white/20 text-white">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-white/10">All Roles</SelectItem>
                      <SelectItem value="debater" className="text-white hover:bg-white/10">Debater</SelectItem>
                      <SelectItem value="coach" className="text-white hover:bg-white/10">Coach</SelectItem>
                      <SelectItem value="researcher" className="text-white hover:bg-white/10">Researcher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Team Members Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((member, index) => (
                  <Card key={index} className="bg-black border-white/10 hover:border-red-500/30 transition-smooth">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 bg-red-500/10 border border-red-500/20">
                          <AvatarFallback className="text-red-500 font-bold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-white">{member.name}</CardTitle>
                          <div className="text-sm text-white/70">{member.role}</div>
                          <Badge 
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                            className={member.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                          >
                            {member.status === 'active' ? 'Active' : 'Mentor'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Win Rate</span>
                          <span className="text-red-500 font-bold">{member.winRate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Tournaments</span>
                          <span className="text-white">{member.tournaments}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Speciality</span>
                          <span className="text-white">{member.speciality}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Points</span>
                          <span className="text-white font-bold">{member.points}</span>
                        </div>
                        <Button variant="outline" className="w-full mt-4 border-white/30 text-white hover:bg-red-500 hover:border-red-500">
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Events */}
                <Card className="bg-black border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white font-primary flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-red-500" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingEvents.map((event, index) => (
                        <div key={index} className="p-4 rounded-lg bg-black/50 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-white">{event.title}</h4>
                            <Badge 
                              variant="outline"
                              className={`${
                                event.type === 'tournament' ? 'border-red-500/30 text-red-500' :
                                event.type === 'practice' ? 'border-green-500/30 text-green-500' :
                                'border-blue-500/30 text-blue-500'
                              }`}
                            >
                              {event.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-white/70">
                            <div>{event.date}</div>
                            <div>{event.location}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-black border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white font-primary">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full justify-start bg-red-500/10 hover:bg-red-500 text-white hover:text-white border border-red-500/20">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Practice
                      </Button>
                      <Button className="w-full justify-start bg-green-500/10 hover:bg-green-500 text-white hover:text-white border border-green-500/20">
                        <Users className="h-4 w-4 mr-2" />
                        Team Meeting
                      </Button>
                      <Button className="w-full justify-start bg-blue-500/10 hover:bg-blue-500 text-white hover:text-white border border-blue-500/20">
                        <Trophy className="h-4 w-4 mr-2" />
                        Register Tournament
                      </Button>
                      <Button className="w-full justify-start bg-purple-500/10 hover:bg-purple-500 text-white hover:text-white border border-purple-500/20">
                        <Target className="h-4 w-4 mr-2" />
                        Strategy Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <div className="space-y-6">
                {recentAchievements.map((achievement, index) => (
                  <Card key={index} className="bg-black border-white/10 hover:border-red-500/30 transition-smooth">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20">
                            {achievement.position === "1st Place" ? (
                              <Crown className="h-6 w-6 text-red-500" />
                            ) : (
                              <Medal className="h-6 w-6 text-red-500" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-bold text-white">{achievement.tournament}</h3>
                            <div className="text-sm text-white/70">{achievement.date}</div>
                            <div className="text-sm text-red-500">
                              Team: {achievement.members.join(', ')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            className={achievement.position === "1st Place" ? 'bg-red-500 text-white' : 'bg-red-400 text-white'}
                          >
                            {achievement.position}
                          </Badge>
                          <div className="text-sm text-white/70 mt-1">Prize: {achievement.prize}</div>
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

export default Teams;