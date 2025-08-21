
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Plus, UserPlus, Users, Mail, Phone } from 'lucide-react';

interface JudgeProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  club: string;
  experience: string;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
}

interface TournamentJudge {
  id: string;
  tournament_id: string;
  judge_id: string;
  available: boolean;
  notes: string;
  judge_profiles: JudgeProfile;
}

export function JudgesManager() {
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [tournamentJudges, setTournamentJudges] = useState<TournamentJudge[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreateJudgeDialogOpen, setIsCreateJudgeDialogOpen] = useState(false);
  const [isAddToTournamentDialogOpen, setIsAddToTournamentDialogOpen] = useState(false);
  const [judgeFormData, setJudgeFormData] = useState({
    name: '',
    email: '',
    phone: '',
    club: '',
    experience: ''
  });

  useEffect(() => {
    fetchTournaments();
    fetchJudges();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentJudges();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    }
  };

  const fetchJudges = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setJudges(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch judges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentJudges = async () => {
    if (!selectedTournament) return;
    
    try {
      const { data, error } = await supabase
        .from('tournament_judges')
        .select(`
          *,
          judge_profiles (*)
        `)
        .eq('tournament_id', selectedTournament);

      if (error) throw error;
      setTournamentJudges(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch tournament judges",
        variant: "destructive",
      });
    }
  };

  const createJudge = async () => {
    try {
      const { error } = await supabase
        .from('judge_profiles')
        .insert([judgeFormData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Judge created successfully",
      });

      setIsCreateJudgeDialogOpen(false);
      resetJudgeForm();
      fetchJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create judge",
        variant: "destructive",
      });
    }
  };

  const addJudgeToTournament = async (judgeId: string) => {
    if (!selectedTournament) return;

    try {
      const { error } = await supabase
        .from('tournament_judges')
        .insert([{
          tournament_id: selectedTournament,
          judge_id: judgeId,
          available: true
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Judge added to tournament successfully",
      });

      fetchTournamentJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add judge to tournament",
        variant: "destructive",
      });
    }
  };

  const toggleJudgeAvailability = async (tournamentJudgeId: string, available: boolean) => {
    try {
      const { error } = await supabase
        .from('tournament_judges')
        .update({ available })
        .eq('id', tournamentJudgeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Judge availability updated successfully`,
      });

      fetchTournamentJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update judge availability",
        variant: "destructive",
      });
    }
  };

  const resetJudgeForm = () => {
    setJudgeFormData({
      name: '',
      email: '',
      phone: '',
      club: '',
      experience: ''
    });
  };

  const availableJudges = judges.filter(judge => 
    !tournamentJudges.some(tj => tj.judge_id === judge.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Judges Management</h3>
          <p className="text-muted-foreground">Create and manage judges for tournaments</p>
        </div>
        
        <Dialog open={isCreateJudgeDialogOpen} onOpenChange={setIsCreateJudgeDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Judge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Judge</DialogTitle>
              <DialogDescription>
                Add a new judge to the system
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={judgeFormData.name}
                  onChange={(e) => setJudgeFormData({...judgeFormData, name: e.target.value})}
                  placeholder="Enter judge's full name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={judgeFormData.email}
                    onChange={(e) => setJudgeFormData({...judgeFormData, email: e.target.value})}
                    placeholder="judge@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={judgeFormData.phone}
                    onChange={(e) => setJudgeFormData({...judgeFormData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="club">Club/Organization</Label>
                <Input
                  id="club"
                  value={judgeFormData.club}
                  onChange={(e) => setJudgeFormData({...judgeFormData, club: e.target.value})}
                  placeholder="Judge's club or organization"
                />
              </div>
              
              <div>
                <Label htmlFor="experience">Experience</Label>
                <Textarea
                  id="experience"
                  value={judgeFormData.experience}
                  onChange={(e) => setJudgeFormData({...judgeFormData, experience: e.target.value})}
                  placeholder="Describe the judge's experience and qualifications"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateJudgeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createJudge}>
                Create Judge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Judges ({judges.length})</CardTitle>
          <CardDescription>System-wide judge profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Club/Organization</TableHead>
                <TableHead>Experience</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {judges.map((judge) => (
                <TableRow key={judge.id}>
                  <TableCell className="font-medium">{judge.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {judge.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {judge.email}
                        </div>
                      )}
                      {judge.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {judge.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{judge.club || 'Not specified'}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={judge.experience}>
                      {judge.experience || 'Not specified'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Judge Pool</CardTitle>
          <CardDescription>Manage judges for specific tournaments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Tournament</Label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map(tournament => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTournament && (
            <>
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Tournament Judges ({tournamentJudges.length})</h4>
                
                <Dialog open={isAddToTournamentDialogOpen} onOpenChange={setIsAddToTournamentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add Judge
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Judge to Tournament</DialogTitle>
                      <DialogDescription>
                        Select judges to add to this tournament
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                      {availableJudges.length > 0 ? (
                        <div className="space-y-2">
                          {availableJudges.map((judge) => (
                            <div key={judge.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{judge.name}</div>
                                <div className="text-sm text-muted-foreground">{judge.club}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addJudgeToTournament(judge.id)}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          All judges have been added to this tournament
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judge</TableHead>
                    <TableHead>Club/Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournamentJudges.map((tj) => (
                    <TableRow key={tj.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tj.judge_profiles.name}</div>
                          <div className="text-sm text-muted-foreground">{tj.judge_profiles.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{tj.judge_profiles.club || 'Not specified'}</TableCell>
                      <TableCell>
                        <Badge variant={tj.available ? 'default' : 'secondary'}>
                          {tj.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleJudgeAvailability(tj.id, !tj.available)}
                        >
                          {tj.available ? 'Mark Unavailable' : 'Mark Available'}
                        </Button>
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
  );
}
