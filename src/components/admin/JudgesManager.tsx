
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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, UserCheck, Gavel } from 'lucide-react';

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  qualifications?: string;
  user_id?: string;
  availability?: any;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
}

interface TournamentJudge {
  judge_id: string;
  tournament_id: string;
  conflicts?: string[];
  assigned_count: number;
  judge_profile: JudgeProfile;
}

export function JudgesManager() {
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentJudges, setTournamentJudges] = useState<TournamentJudge[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<JudgeProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    qualifications: ''
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
      if (data && data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    }
  };

  const fetchJudges = async () => {
    try {
      setLoading(true);
      
      // Placeholder implementation - judge_profiles table doesn't exist in current types
      // Show empty state until database setup is complete
      setJudges([]);
      
    } catch (error: any) {
      console.error('Error fetching judges:', error);
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
    try {
      // Placeholder implementation - tournament_judges table doesn't exist in current types
      setTournamentJudges([]);
    } catch (error: any) {
      console.error('Error fetching tournament judges:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournament judges",
        variant: "destructive",
      });
    }
  };

  const createJudge = async () => {
    try {
      // Placeholder implementation
      toast({
        title: "Feature Coming Soon",
        description: "Judge creation will be available once the database setup is complete",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create judge",
        variant: "destructive",
      });
    }
  };

  const updateJudge = async () => {
    if (!editingJudge) return;

    try {
      // Placeholder implementation
      toast({
        title: "Feature Coming Soon",
        description: "Judge updates will be available once the database setup is complete",
      });

      setIsEditDialogOpen(false);
      setEditingJudge(null);
      resetForm();
      fetchJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update judge",
        variant: "destructive",
      });
    }
  };

  const addJudgeToTournament = async (judgeId: string) => {
    if (!selectedTournament) return;

    try {
      // Placeholder implementation
      toast({
        title: "Feature Coming Soon",
        description: "Adding judges to tournaments will be available once the database setup is complete",
      });

      fetchTournamentJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add judge to tournament",
        variant: "destructive",
      });
    }
  };

  const removeJudgeFromTournament = async (judgeId: string) => {
    if (!selectedTournament) return;

    try {
      // Placeholder implementation
      toast({
        title: "Feature Coming Soon",
        description: "Removing judges from tournaments will be available once the database setup is complete",
      });

      fetchTournamentJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove judge from tournament",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (judge: JudgeProfile) => {
    setEditingJudge(judge);
    setFormData({
      name: judge.name,
      email: judge.email,
      phone: judge.phone || '',
      bio: judge.bio || '',
      qualifications: judge.qualifications || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      bio: '',
      qualifications: ''
    });
  };

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
          <h3 className="text-lg font-semibold">Judges Manager</h3>
          <p className="text-muted-foreground">Manage judge profiles and tournament assignments</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Judge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Judge</DialogTitle>
              <DialogDescription>
                Create a new judge profile
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                  placeholder="Experience, certifications, etc."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createJudge}>
                Create Judge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>All Judges ({judges.length})</CardTitle>
            <CardDescription>Manage your judge database</CardDescription>
          </CardHeader>
          <CardContent>
            {judges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p>No judges found. Judges will appear here once the database setup is complete.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {judges.map((judge) => (
                    <TableRow key={judge.id}>
                      <TableCell className="font-medium">{judge.name}</TableCell>
                      <TableCell>{judge.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(judge)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => addJudgeToTournament(judge.id)}
                            disabled={!selectedTournament}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tournament Judges</CardTitle>
            <CardDescription>
              Judges assigned to the selected tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Tournament</Label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament" />
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

              {tournamentJudges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p>No judges assigned to this tournament yet.</p>
                  <p className="text-sm mt-2">This feature will be available once the database setup is complete.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judge</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournamentJudges.map((tj) => (
                      <TableRow key={tj.judge_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tj.judge_profile.name}</div>
                            <div className="text-sm text-muted-foreground">{tj.judge_profile.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tj.assigned_count} rounds</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeJudgeFromTournament(tj.judge_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Judge</DialogTitle>
            <DialogDescription>
              Update judge information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit_name">Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_phone">Phone (Optional)</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_qualifications">Qualifications</Label>
              <Textarea
                id="edit_qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_bio">Bio (Optional)</Label>
              <Textarea
                id="edit_bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateJudge}>
              Update Judge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
