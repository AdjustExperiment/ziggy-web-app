import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Trophy, Target, TrendingUp, Search, Plus, UserPlus, Settings, Calendar, Medal, Crown, LogOut, Loader2 } from "lucide-react";
import { useTeam } from '@/hooks/useTeam';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Teams = () => {
  const { user, loading: authLoading } = useOptimizedAuth();
  const navigate = useNavigate();
  const {
    myTeam,
    myMembership,
    members,
    events,
    achievements,
    stats,
    loading,
    allTeams,
    isTeamLead,
    createTeam,
    joinTeam,
    leaveTeam,
    createEvent
  } = useTeam();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSchool, setNewTeamSchool] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [selectedTeamToJoin, setSelectedTeamToJoin] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('practice');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Users className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Team Management</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to create or join a debate team, track performance, and coordinate with teammates.
          </p>
          <Button onClick={() => navigate('/login')} className="bg-red-500 hover:bg-red-600 text-white">
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setSubmitting(true);
    await createTeam(newTeamName, newTeamSchool, newTeamDesc);
    setSubmitting(false);
    setCreateDialogOpen(false);
    setNewTeamName('');
    setNewTeamSchool('');
    setNewTeamDesc('');
  };

  const handleJoinTeam = async () => {
    if (!selectedTeamToJoin) return;
    setSubmitting(true);
    await joinTeam(selectedTeamToJoin);
    setSubmitting(false);
    setJoinDialogOpen(false);
    setSelectedTeamToJoin('');
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate) return;
    setSubmitting(true);
    await createEvent({
      title: newEventTitle,
      event_type: newEventType,
      scheduled_date: newEventDate,
      scheduled_time: null,
      location: newEventLocation || null,
      description: null,
      is_virtual: false
    });
    setSubmitting(false);
    setEventDialogOpen(false);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventLocation('');
  };

  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const name = m.profile ? `${m.profile.first_name || ''} ${m.profile.last_name || ''}` : '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || m.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // No team - show create/join options
  if (!myTeam) {
    return (
      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-background to-muted/30 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <Users className="h-16 w-16 mx-auto mb-6 text-red-500" />
            <h1 className="text-4xl font-bold mb-4 font-primary">Join or Create a Team</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Collaborate with fellow debaters, track team performance, and coordinate training schedules.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-500 hover:bg-red-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Team</DialogTitle>
                    <DialogDescription>Set up your debate team and invite members.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Team Name *</Label>
                      <Input 
                        id="team-name" 
                        value={newTeamName} 
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="e.g., Stanford Debate Society"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school">School/Organization</Label>
                      <Input 
                        id="school" 
                        value={newTeamSchool} 
                        onChange={(e) => setNewTeamSchool(e.target.value)}
                        placeholder="e.g., Stanford University"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        value={newTeamDesc} 
                        onChange={(e) => setNewTeamDesc(e.target.value)}
                        placeholder="Tell us about your team..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTeam} disabled={submitting || !newTeamName.trim()}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Existing Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join a Team</DialogTitle>
                    <DialogDescription>Select a team to join.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Team</Label>
                      <Select value={selectedTeamToJoin} onValueChange={setSelectedTeamToJoin}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a team..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} {team.school_organization && `(${team.school_organization})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleJoinTeam} disabled={submitting || !selectedTeamToJoin}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Join Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {allTeams.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Available Teams</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allTeams.slice(0, 6).map((team) => (
                    <Card key={team.id} className="text-left">
                      <CardHeader>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.school_organization && (
                          <CardDescription>{team.school_organization}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{team.description}</p>
                        )}
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedTeamToJoin(team.id);
                            setJoinDialogOpen(true);
                          }}
                        >
                          Join Team
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Has team - show full dashboard
  const teamStats = [
    { label: "Team Members", value: stats.totalMembers.toString(), icon: Users },
    { label: "Tournaments", value: stats.totalTournaments.toString(), icon: Trophy },
    { label: "Total Wins", value: stats.totalWins.toString(), icon: Crown },
    { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, icon: Target }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-background to-muted/30 py-16 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 font-primary">{myTeam.name}</h1>
              {myTeam.school_organization && (
                <p className="text-xl text-muted-foreground">{myTeam.school_organization}</p>
              )}
              <Badge className="mt-2" variant="outline">
                {myMembership?.role || 'Member'}
              </Badge>
            </div>
            <div className="flex gap-4">
              {isTeamLead && (
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Team Settings
                </Button>
              )}
              <Button variant="outline" onClick={leaveTeam} className="text-red-500 hover:text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Leave Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Team Stats */}
      <section className="py-8 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {teamStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="members" className="space-y-8">
            <TabsList>
              <TabsTrigger value="members">Team Members</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No team members found.</p>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMembers.map((member) => {
                    const name = member.profile 
                      ? `${member.profile.first_name || ''} ${member.profile.last_name || ''}`.trim() 
                      : 'Team Member';
                    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase() || 'TM';
                    
                    return (
                      <Card key={member.id} className="hover:border-primary/30 transition-colors">
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-red-500/10 text-red-500 font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{name || 'Team Member'}</CardTitle>
                              <Badge variant="outline" className="mt-1 capitalize">
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground">
                            Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-red-500" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No upcoming events scheduled.</p>
                    ) : (
                      <div className="space-y-4">
                        {events.map((event) => (
                          <div key={event.id} className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{event.title}</h4>
                              <Badge variant="outline" className="capitalize">
                                {event.event_type}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>{format(new Date(event.scheduled_date), 'EEEE, MMM d, yyyy')}</div>
                              {event.location && <div>{event.location}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {isTeamLead && (
                      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Event
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule New Event</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Event Title *</Label>
                              <Input 
                                value={newEventTitle} 
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                placeholder="e.g., Team Practice"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Event Type</Label>
                              <Select value={newEventType} onValueChange={setNewEventType}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="practice">Practice</SelectItem>
                                  <SelectItem value="meeting">Meeting</SelectItem>
                                  <SelectItem value="scrimmage">Scrimmage</SelectItem>
                                  <SelectItem value="tournament">Tournament</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Date *</Label>
                              <Input 
                                type="date" 
                                value={newEventDate} 
                                onChange={(e) => setNewEventDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Location</Label>
                              <Input 
                                value={newEventLocation} 
                                onChange={(e) => setNewEventLocation(e.target.value)}
                                placeholder="e.g., Room 204 or Online"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateEvent} disabled={submitting || !newEventTitle || !newEventDate}>
                              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Create Event
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/tournaments')}>
                        <Trophy className="h-4 w-4 mr-2" />
                        Browse Tournaments
                      </Button>
                      {isTeamLead && (
                        <Button className="w-full justify-start" variant="outline" onClick={() => setEventDialogOpen(true)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Practice
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              {achievements.length === 0 ? (
                <Card className="p-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No achievements yet. Compete in tournaments to earn achievements!</p>
                  <Button className="mt-4" onClick={() => navigate('/tournaments')}>
                    Browse Tournaments
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {achievements.map((achievement) => (
                    <Card key={achievement.id} className="hover:border-primary/30 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
                              {achievement.position === "1st Place" ? (
                                <Crown className="h-6 w-6 text-red-500" />
                              ) : (
                                <Medal className="h-6 w-6 text-red-500" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold">
                                {achievement.tournament?.name || 'Tournament'}
                              </h3>
                              {achievement.achieved_at && (
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(achievement.achieved_at), 'MMMM yyyy')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {achievement.position && (
                              <Badge className="bg-red-500 text-white">
                                {achievement.position}
                              </Badge>
                            )}
                            {achievement.prize_amount && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Prize: ${achievement.prize_amount.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Teams;