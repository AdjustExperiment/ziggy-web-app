
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, Search, Trophy, Users, MessageCircle, UserPlus, Loader2 } from 'lucide-react';

interface Registration {
  id: string;
  participant_name: string;
  participant_email: string;
  school_organization: string | null;
  partner_name: string | null;
  payment_status: string;
  emergency_contact: string | null;
}

interface CompetitorStats {
  totalSpeaks: number;
  hiLo: number;
  wins: number;
  losses: number;
  affRounds: number;
  negRounds: number;
  opponents: string[];
}

interface UserOption {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface CompetitorDirectoryProps {
  tournamentId: string;
  eventId?: string | null;
}

export function CompetitorDirectory({ tournamentId, eventId }: CompetitorDirectoryProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [competitorStats, setCompetitorStats] = useState<Map<string, CompetitorStats>>(new Map());
  const [loading, setLoading] = useState(false);
  
  // Add competitor dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [newCompetitor, setNewCompetitor] = useState({
    participant_name: '',
    participant_email: '',
    school_organization: '',
    partner_name: '',
    payment_status: 'manual'
  });
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  const filteredRegistrations = registrations.filter(reg =>
    reg.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reg.school_organization && reg.school_organization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter(user => {
    const searchLower = userSearch.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    if (tournamentId) {
      fetchRegistrations();
      fetchCompetitorStats();
    }
  }, [tournamentId, eventId]);

  useEffect(() => {
    if (addDialogOpen && users.length === 0) {
      fetchUsers();
    }
  }, [addDialogOpen]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (error) throw error;

      // Fetch profiles to get names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const usersWithNames = (data.users || []).map((u: any) => {
        const profile = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null
        };
      });

      setUsers(usersWithNames);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      let query = supabase
        .from('tournament_registrations')
        .select('id, participant_name, participant_email, school_organization, partner_name, payment_status, emergency_contact, event_id')
        .eq('tournament_id', tournamentId);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive",
      });
    }
  };

  const fetchCompetitorStats = async () => {
    setLoading(true);
    try {
      const stats = new Map<string, CompetitorStats>();
      registrations.forEach(reg => {
        stats.set(reg.id, {
          totalSpeaks: 0,
          hiLo: 0,
          wins: 0,
          losses: 0,
          affRounds: 0,
          negRounds: 0,
          opponents: []
        });
      });
      setCompetitorStats(stats);
    } catch (error: any) {
      console.error('Error fetching competitor stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch competitor statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || '';
      setNewCompetitor(prev => ({
        ...prev,
        participant_name: fullName,
        participant_email: user.email
      }));
    }
  };

  const handleAddCompetitor = async () => {
    if (!selectedUserId || !newCompetitor.participant_name || !newCompetitor.participant_email) {
      toast({
        title: "Validation Error",
        description: "Please select a user and fill in required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate registration
    const existingReg = registrations.find(r => 
      r.participant_email.toLowerCase() === newCompetitor.participant_email.toLowerCase()
    );
    if (existingReg) {
      toast({
        title: "Duplicate Registration",
        description: "This user is already registered for this tournament",
        variant: "destructive",
      });
      return;
    }

    setAddingCompetitor(true);
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          event_id: eventId || null,
          user_id: selectedUserId,
          participant_name: newCompetitor.participant_name,
          participant_email: newCompetitor.participant_email,
          school_organization: newCompetitor.school_organization || null,
          partner_name: newCompetitor.partner_name || null,
          payment_status: newCompetitor.payment_status
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${newCompetitor.participant_name} added to tournament`,
      });

      // Reset form and close dialog
      setSelectedUserId('');
      setNewCompetitor({
        participant_name: '',
        participant_email: '',
        school_organization: '',
        partner_name: '',
        payment_status: 'manual'
      });
      setAddDialogOpen(false);
      fetchRegistrations();
    } catch (error: any) {
      console.error('Error adding competitor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add competitor",
        variant: "destructive",
      });
    } finally {
      setAddingCompetitor(false);
    }
  };

  const sendNotification = async (registration: Registration, message: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-registration-email', {
        body: {
          to: registration.participant_email,
          subject: 'Tournament Notification',
          templateKey: 'custom_notification',
          templateData: {
            participant_name: registration.participant_name,
            message: message,
            tournament_id: tournamentId
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Notification sent to ${registration.participant_name}`,
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Competitor Directory
              </CardTitle>
              <CardDescription>
                View competitor information, contact details, and performance statistics
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Competitor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Competitor to Tournament</DialogTitle>
                  <DialogDescription>
                    Select an existing user account to add as a competitor
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Search Users</Label>
                    <Input
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select User</Label>
                    {usersLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <Select value={selectedUserId} onValueChange={handleSelectUser}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {filteredUsers.slice(0, 50).map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : user.email
                              } ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Participant Name *</Label>
                    <Input
                      value={newCompetitor.participant_name}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, participant_name: e.target.value }))}
                      placeholder="Full name for postings"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newCompetitor.participant_email}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, participant_email: e.target.value }))}
                      placeholder="Contact email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>School/Organization</Label>
                    <Input
                      value={newCompetitor.school_organization}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, school_organization: e.target.value }))}
                      placeholder="School or club name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Partner Name (for team events)</Label>
                    <Input
                      value={newCompetitor.partner_name}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, partner_name: e.target.value }))}
                      placeholder="Partner's name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select 
                      value={newCompetitor.payment_status} 
                      onValueChange={(value) => setNewCompetitor(prev => ({ ...prev, payment_status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual (Admin Added)</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="waived">Waived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleAddCompetitor} 
                    className="w-full" 
                    disabled={addingCompetitor || !selectedUserId}
                  >
                    {addingCompetitor && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Competitor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitors or schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={fetchCompetitorStats}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Refresh Stats
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredRegistrations.map(registration => {
              const stats = competitorStats.get(registration.id);
              return (
                <Card key={registration.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{registration.participant_name}</h3>
                        {registration.partner_name && (
                          <p className="text-sm text-muted-foreground">
                            Partner: {registration.partner_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {registration.school_organization || 'Independent'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={registration.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {registration.payment_status}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Contact Info</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{registration.participant_email}</span>
                          </div>
                          {registration.emergency_contact && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{registration.emergency_contact}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            const message = prompt('Enter notification message:');
                            if (message) sendNotification(registration, message);
                          }}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Notify
                        </Button>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Tournament Stats</h4>
                        {stats ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Speaks: <strong>{stats.totalSpeaks}</strong></div>
                            <div>Hi/Lo: <strong>{stats.hiLo}</strong></div>
                            <div>Record: <strong>{stats.wins}-{stats.losses}</strong></div>
                            <div>Sides: <strong>{stats.affRounds}A/{stats.negRounds}N</strong></div>
                            <div className="col-span-2">
                              <strong>Opponents:</strong>
                              <div className="text-xs text-muted-foreground mt-1">
                                {stats.opponents.length > 0 
                                  ? stats.opponents.join(', ')
                                  : 'No rounds yet'
                                }
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Loading stats...</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No competitors found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
