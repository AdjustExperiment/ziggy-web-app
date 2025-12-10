import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Trash2, UserCheck, Filter, GraduationCap } from "lucide-react";

interface JudgeProfile {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  experience_level: string;
  experience_years: number;
  specializations: string[];
  bio: string | null;
  qualifications: string | null;
  alumni: boolean;
  status: string;
  created_at: string;
}

interface TournamentJudgeRegistration {
  id: string;
  tournament_id: string;
  judge_profile_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  registered_at: string;
  judge_profile?: JudgeProfile;
  tournament?: { id: string; name: string };
}

export function JudgeApplicationManager() {
  const { toast } = useToast();
  const [judges, setJudges] = useState<TournamentJudgeRegistration[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExperience, setFilterExperience] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingJudge, setEditingJudge] = useState<JudgeProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedTournament]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tournaments
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('start_date', { ascending: false });
      
      setTournaments(tournamentsData || []);

      // Fetch judge registrations with profiles
      let query = supabase
        .from('tournament_judge_registrations')
        .select(`
          *,
          judge_profiles(*),
          tournaments(id, name)
        `)
        .order('registered_at', { ascending: false });

      if (selectedTournament !== 'all') {
        query = query.eq('tournament_id', selectedTournament);
      }

      const { data: registrations, error } = await query;

      if (error) throw error;

      const formattedJudges = registrations?.map(reg => ({
        ...reg,
        judge_profile: reg.judge_profiles,
        tournament: reg.tournaments,
      })) || [];

      setJudges(formattedJudges);
    } catch (error) {
      console.error('Error fetching judges:', error);
      toast({ title: "Error", description: "Failed to load judges", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJudge = async () => {
    if (!editingJudge) return;

    try {
      const { error } = await supabase
        .from('judge_profiles')
        .update({
          name: editingJudge.name,
          email: editingJudge.email,
          phone: editingJudge.phone,
          experience_level: editingJudge.experience_level,
          experience_years: editingJudge.experience_years,
          specializations: editingJudge.specializations,
          bio: editingJudge.bio,
          qualifications: editingJudge.qualifications,
          alumni: editingJudge.alumni,
          status: editingJudge.status,
        })
        .eq('id', editingJudge.id);

      if (error) throw error;

      toast({ title: "Success", description: "Judge profile updated" });
      setEditDialogOpen(false);
      setEditingJudge(null);
      fetchData();
    } catch (error) {
      console.error('Error updating judge:', error);
      toast({ title: "Error", description: "Failed to update judge", variant: "destructive" });
    }
  };

  const handleRemoveJudge = async (registrationId: string) => {
    if (!confirm('Are you sure you want to remove this judge from the tournament?')) return;

    try {
      const { error } = await supabase
        .from('tournament_judge_registrations')
        .update({ status: 'withdrawn' })
        .eq('id', registrationId);

      if (error) throw error;

      toast({ title: "Success", description: "Judge removed from tournament" });
      fetchData();
    } catch (error) {
      console.error('Error removing judge:', error);
      toast({ title: "Error", description: "Failed to remove judge", variant: "destructive" });
    }
  };

  const handleApproveJudge = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_judge_registrations')
        .update({ status: 'confirmed' })
        .eq('id', registrationId);

      if (error) throw error;

      toast({ title: "Success", description: "Judge approved" });
      fetchData();
    } catch (error) {
      console.error('Error approving judge:', error);
      toast({ title: "Error", description: "Failed to approve judge", variant: "destructive" });
    }
  };

  // Filter judges
  const filteredJudges = judges.filter(reg => {
    const profile = reg.judge_profile;
    if (!profile) return false;
    
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesExperience = filterExperience === 'all' || profile.experience_level === filterExperience;
    
    return matchesSearch && matchesExperience;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      pending: "secondary",
      withdrawn: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getExperienceBadge = (level: string) => {
    const colors: Record<string, string> = {
      novice: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      advanced: "bg-green-500/10 text-green-500 border-green-500/20",
      expert: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    };
    return <Badge className={colors[level] || ""}>{level}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tournament Judge Roster</h2>
        <p className="text-muted-foreground">
          View and manage judges registered for tournaments
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select tournament" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tournaments</SelectItem>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterExperience} onValueChange={setFilterExperience}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="novice">Novice</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Judges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judges.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {judges.filter(j => j.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {judges.filter(j => j.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alumni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {judges.filter(j => j.judge_profile?.alumni).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Judges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Judges</CardTitle>
          <CardDescription>
            {filteredJudges.length} judges found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredJudges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No judges found matching your criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJudges.map((reg) => {
                  const profile = reg.judge_profile;
                  if (!profile) return null;
                  
                  return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {profile.name}
                              {profile.alumni && (
                                <Badge variant="outline" className="ml-1 text-xs">
                                  <GraduationCap className="h-3 w-3 mr-1" />
                                  A
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{profile.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{reg.tournament?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getExperienceBadge(profile.experience_level)}
                          <span className="text-xs text-muted-foreground">
                            {profile.experience_years} years
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile.specializations.slice(0, 2).map((spec, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {profile.specializations.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.specializations.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(reg.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {reg.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleApproveJudge(reg.id)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingJudge(profile);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveJudge(reg.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Judge Profile</DialogTitle>
          </DialogHeader>
          {editingJudge && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingJudge.name}
                    onChange={(e) => setEditingJudge({ ...editingJudge, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editingJudge.email}
                    onChange={(e) => setEditingJudge({ ...editingJudge, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editingJudge.phone || ''}
                    onChange={(e) => setEditingJudge({ ...editingJudge, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Experience Level</Label>
                  <Select 
                    value={editingJudge.experience_level}
                    onValueChange={(v) => setEditingJudge({ ...editingJudge, experience_level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novice">Novice</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={editingJudge.experience_years}
                    onChange={(e) => setEditingJudge({ ...editingJudge, experience_years: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={editingJudge.status}
                    onValueChange={(v) => setEditingJudge({ ...editingJudge, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Qualifications</Label>
                <Textarea
                  value={editingJudge.qualifications || ''}
                  onChange={(e) => setEditingJudge({ ...editingJudge, qualifications: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea
                  value={editingJudge.bio || ''}
                  onChange={(e) => setEditingJudge({ ...editingJudge, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="alumni"
                  checked={editingJudge.alumni}
                  onChange={(e) => setEditingJudge({ ...editingJudge, alumni: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="alumni">Alumni Judge</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateJudge}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
