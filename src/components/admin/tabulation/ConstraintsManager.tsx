import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Shield, 
  Users, 
  AlertTriangle, 
  Plus, 
  X, 
  Trash2,
  UserX,
  School,
  Save
} from 'lucide-react';

interface ConstraintsManagerProps {
  tournamentId: string;
  registrations: any[];
  judges: any[];
}

interface TeamConflict {
  id: string;
  registration_id: string;
  cannot_face_registration_id: string;
  reason: string | null;
  team1_name?: string;
  team2_name?: string;
}

interface JudgeTeamConflict {
  id: string;
  judge_profile_id: string;
  registration_id: string;
  reason: string | null;
  judge_name?: string;
  team_name?: string;
}

interface JudgeSchoolConflict {
  id: string;
  judge_profile_id: string;
  school_name: string;
  reason: string | null;
  judge_name?: string;
}

interface GlobalSettings {
  club_protect: boolean;
  avoid_rematches: boolean;
  max_repeat_opponents: number;
}

export function ConstraintsManager({ tournamentId, registrations, judges }: ConstraintsManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Conflicts state
  const [teamConflicts, setTeamConflicts] = useState<TeamConflict[]>([]);
  const [judgeTeamConflicts, setJudgeTeamConflicts] = useState<JudgeTeamConflict[]>([]);
  const [judgeSchoolConflicts, setJudgeSchoolConflicts] = useState<JudgeSchoolConflict[]>([]);
  
  // Global settings
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    club_protect: true,
    avoid_rematches: true,
    max_repeat_opponents: 0
  });

  // Dialog state for adding conflicts
  const [showAddTeamConflict, setShowAddTeamConflict] = useState(false);
  const [showAddJudgeTeamConflict, setShowAddJudgeTeamConflict] = useState(false);
  const [showAddJudgeSchoolConflict, setShowAddJudgeSchoolConflict] = useState(false);
  
  // Form state
  const [newTeamConflict, setNewTeamConflict] = useState({ team1: '', team2: '', reason: '' });
  const [newJudgeTeamConflict, setNewJudgeTeamConflict] = useState({ judge: '', team: '', reason: '' });
  const [newJudgeSchoolConflict, setNewJudgeSchoolConflict] = useState({ judge: '', school: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchGlobalSettings(),
        fetchTeamConflicts(),
        fetchJudgeTeamConflicts(),
        fetchJudgeSchoolConflicts()
      ]);
    } catch (error) {
      console.error('Error fetching constraints:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    const { data, error } = await supabase
      .from('tournament_tabulation_settings')
      .select('club_protect, avoid_rematches, max_repeat_opponents')
      .eq('tournament_id', tournamentId)
      .maybeSingle();

    if (data) {
      setGlobalSettings({
        club_protect: data.club_protect ?? true,
        avoid_rematches: data.avoid_rematches ?? true,
        max_repeat_opponents: data.max_repeat_opponents ?? 0
      });
    }
  };

  const fetchTeamConflicts = async () => {
    const { data } = await (supabase as any)
      .from('team_conflicts')
      .select(`
        *,
        team1:tournament_registrations!team1_id(participant_name),
        team2:tournament_registrations!team2_id(participant_name)
      `)
      .eq('tournament_id', tournamentId);

    if (data) {
      setTeamConflicts(data.map((c: any) => ({
        ...c,
        team1_name: c.team1?.participant_name,
        team2_name: c.team2?.participant_name
      })));
    }
  };

  const fetchJudgeTeamConflicts = async () => {
    const { data } = await (supabase as any)
      .from('judge_team_conflicts')
      .select(`
        *,
        judge:judge_profiles(name),
        team:tournament_registrations!registration_id(participant_name)
      `)
      .eq('tournament_id', tournamentId);

    if (data) {
      setJudgeTeamConflicts(data.map((c: any) => ({
        ...c,
        judge_name: c.judge?.name,
        team_name: c.team?.participant_name
      })));
    }
  };

  const fetchJudgeSchoolConflicts = async () => {
    const { data } = await (supabase as any)
      .from('judge_school_conflicts')
      .select(`
        *,
        judge:judge_profiles(name)
      `)
      .eq('tournament_id', tournamentId);

    if (data) {
      setJudgeSchoolConflicts(data.map((c: any) => ({
        ...c,
        judge_name: c.judge?.name
      })));
    }
  };

  const saveGlobalSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('tournament_tabulation_settings')
        .upsert({
          tournament_id: tournamentId,
          club_protect: globalSettings.club_protect,
          avoid_rematches: globalSettings.avoid_rematches,
          max_repeat_opponents: globalSettings.max_repeat_opponents
        }, { onConflict: 'tournament_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Global settings saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addTeamConflict = async () => {
    if (!newTeamConflict.team1 || !newTeamConflict.team2) {
      toast({ title: "Error", description: "Select both teams", variant: "destructive" });
      return;
    }

    try {
      const { error } = await (supabase
        .from('team_conflicts' as any)
        .insert({
          tournament_id: tournamentId,
          registration_id: newTeamConflict.team1,
          cannot_face_registration_id: newTeamConflict.team2,
          reason: newTeamConflict.reason || null
        }) as any);

      if (error) throw error;

      toast({ title: "Success", description: "Team conflict added" });
      setShowAddTeamConflict(false);
      setNewTeamConflict({ team1: '', team2: '', reason: '' });
      fetchTeamConflicts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const addJudgeTeamConflict = async () => {
    if (!newJudgeTeamConflict.judge || !newJudgeTeamConflict.team) {
      toast({ title: "Error", description: "Select judge and team", variant: "destructive" });
      return;
    }

    try {
      const { error } = await (supabase
        .from('judge_team_conflicts' as any)
        .insert({
          tournament_id: tournamentId,
          judge_profile_id: newJudgeTeamConflict.judge,
          registration_id: newJudgeTeamConflict.team,
          reason: newJudgeTeamConflict.reason || null
        }) as any);

      if (error) throw error;

      toast({ title: "Success", description: "Judge-team conflict added" });
      setShowAddJudgeTeamConflict(false);
      setNewJudgeTeamConflict({ judge: '', team: '', reason: '' });
      fetchJudgeTeamConflicts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const addJudgeSchoolConflict = async () => {
    if (!newJudgeSchoolConflict.judge || !newJudgeSchoolConflict.school) {
      toast({ title: "Error", description: "Select judge and enter school", variant: "destructive" });
      return;
    }

    try {
      const { error } = await (supabase
        .from('judge_school_conflicts' as any)
        .insert({
          tournament_id: tournamentId,
          judge_profile_id: newJudgeSchoolConflict.judge,
          school_name: newJudgeSchoolConflict.school,
          reason: newJudgeSchoolConflict.reason || null
        }) as any);

      if (error) throw error;

      toast({ title: "Success", description: "Judge-school conflict added" });
      setShowAddJudgeSchoolConflict(false);
      setNewJudgeSchoolConflict({ judge: '', school: '', reason: '' });
      fetchJudgeSchoolConflicts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteTeamConflict = async (id: string) => {
    try {
      const { error } = await (supabase.from('team_conflicts' as any).delete().eq('id', id) as any);
      if (error) throw error;
      setTeamConflicts(prev => prev.filter(c => c.id !== id));
      toast({ title: "Deleted", description: "Team conflict removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteJudgeTeamConflict = async (id: string) => {
    try {
      const { error } = await (supabase.from('judge_team_conflicts' as any).delete().eq('id', id) as any);
      if (error) throw error;
      setJudgeTeamConflicts(prev => prev.filter(c => c.id !== id));
      toast({ title: "Deleted", description: "Judge-team conflict removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteJudgeSchoolConflict = async (id: string) => {
    try {
      const { error } = await (supabase.from('judge_school_conflicts' as any).delete().eq('id', id) as any);
      if (error) throw error;
      setJudgeSchoolConflicts(prev => prev.filter(c => c.id !== id));
      toast({ title: "Deleted", description: "Judge-school conflict removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Get unique schools from registrations
  const schools = [...new Set(registrations.map(r => r.school_organization).filter(Boolean))];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Pairing Rules
          </CardTitle>
          <CardDescription>
            Tournament-wide constraints applied to all pairings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Club/School Protection</Label>
              <p className="text-sm text-muted-foreground">
                Prevent teams from the same school from debating each other
              </p>
            </div>
            <Switch
              checked={globalSettings.club_protect}
              onCheckedChange={(checked) => 
                setGlobalSettings(prev => ({ ...prev, club_protect: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Avoid Rematches</Label>
              <p className="text-sm text-muted-foreground">
                Prevent teams from debating the same opponent twice
              </p>
            </div>
            <Switch
              checked={globalSettings.avoid_rematches}
              onCheckedChange={(checked) => 
                setGlobalSettings(prev => ({ ...prev, avoid_rematches: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Max Repeat Opponents</Label>
              <p className="text-sm text-muted-foreground">
                Maximum times teams can face the same opponent (0 = no limit after avoiding)
              </p>
            </div>
            <Input
              type="number"
              min={0}
              max={5}
              value={globalSettings.max_repeat_opponents}
              onChange={(e) => 
                setGlobalSettings(prev => ({ 
                  ...prev, 
                  max_repeat_opponents: parseInt(e.target.value) || 0 
                }))
              }
              className="w-20"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={saveGlobalSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Specific Conflicts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Specific Conflicts
          </CardTitle>
          <CardDescription>
            Define specific constraints between teams and judges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="team-conflicts">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="team-conflicts">
                <Users className="h-4 w-4 mr-2" />
                Team Conflicts ({teamConflicts.length})
              </TabsTrigger>
              <TabsTrigger value="judge-team">
                <UserX className="h-4 w-4 mr-2" />
                Judge-Team ({judgeTeamConflicts.length})
              </TabsTrigger>
              <TabsTrigger value="judge-school">
                <School className="h-4 w-4 mr-2" />
                Judge-School ({judgeSchoolConflicts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team-conflicts" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showAddTeamConflict} onOpenChange={setShowAddTeamConflict}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Team Conflict
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Conflict</DialogTitle>
                      <DialogDescription>
                        Prevent two specific teams from facing each other
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Team 1</Label>
                        <Select 
                          value={newTeamConflict.team1} 
                          onValueChange={(v) => setNewTeamConflict(p => ({ ...p, team1: v }))}
                        >
                          <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                          <SelectContent>
                            {registrations.map((r: any) => (
                              <SelectItem key={r.id} value={r.id}>{r.participant_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Team 2</Label>
                        <Select 
                          value={newTeamConflict.team2} 
                          onValueChange={(v) => setNewTeamConflict(p => ({ ...p, team2: v }))}
                        >
                          <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                          <SelectContent>
                            {registrations
                              .filter((r: any) => r.id !== newTeamConflict.team1)
                              .map((r: any) => (
                                <SelectItem key={r.id} value={r.id}>{r.participant_name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Reason (optional)</Label>
                        <Input 
                          value={newTeamConflict.reason}
                          onChange={(e) => setNewTeamConflict(p => ({ ...p, reason: e.target.value }))}
                          placeholder="e.g., Same institution"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddTeamConflict(false)}>Cancel</Button>
                      <Button onClick={addTeamConflict}>Add Conflict</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {teamConflicts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No team conflicts defined
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team 1</TableHead>
                      <TableHead>Team 2</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamConflicts.map((conflict) => (
                      <TableRow key={conflict.id}>
                        <TableCell>{conflict.team1_name}</TableCell>
                        <TableCell>{conflict.team2_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {conflict.reason || '-'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteTeamConflict(conflict.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="judge-team" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showAddJudgeTeamConflict} onOpenChange={setShowAddJudgeTeamConflict}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Judge-Team Conflict
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Judge-Team Conflict</DialogTitle>
                      <DialogDescription>
                        Prevent a judge from judging a specific team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Judge</Label>
                        <Select 
                          value={newJudgeTeamConflict.judge} 
                          onValueChange={(v) => setNewJudgeTeamConflict(p => ({ ...p, judge: v }))}
                        >
                          <SelectTrigger><SelectValue placeholder="Select judge" /></SelectTrigger>
                          <SelectContent>
                            {judges.map((j: any) => (
                              <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Team</Label>
                        <Select 
                          value={newJudgeTeamConflict.team} 
                          onValueChange={(v) => setNewJudgeTeamConflict(p => ({ ...p, team: v }))}
                        >
                          <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                          <SelectContent>
                            {registrations.map((r: any) => (
                              <SelectItem key={r.id} value={r.id}>{r.participant_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Reason (optional)</Label>
                        <Input 
                          value={newJudgeTeamConflict.reason}
                          onChange={(e) => setNewJudgeTeamConflict(p => ({ ...p, reason: e.target.value }))}
                          placeholder="e.g., Former coach"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddJudgeTeamConflict(false)}>Cancel</Button>
                      <Button onClick={addJudgeTeamConflict}>Add Conflict</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {judgeTeamConflicts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No judge-team conflicts defined
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judge</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {judgeTeamConflicts.map((conflict) => (
                      <TableRow key={conflict.id}>
                        <TableCell>{conflict.judge_name}</TableCell>
                        <TableCell>{conflict.team_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {conflict.reason || '-'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteJudgeTeamConflict(conflict.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="judge-school" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showAddJudgeSchoolConflict} onOpenChange={setShowAddJudgeSchoolConflict}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Judge-School Conflict
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Judge-School Conflict</DialogTitle>
                      <DialogDescription>
                        Prevent a judge from judging any team from a school
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Judge</Label>
                        <Select 
                          value={newJudgeSchoolConflict.judge} 
                          onValueChange={(v) => setNewJudgeSchoolConflict(p => ({ ...p, judge: v }))}
                        >
                          <SelectTrigger><SelectValue placeholder="Select judge" /></SelectTrigger>
                          <SelectContent>
                            {judges.map((j: any) => (
                              <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>School</Label>
                        <Select 
                          value={newJudgeSchoolConflict.school} 
                          onValueChange={(v) => setNewJudgeSchoolConflict(p => ({ ...p, school: v }))}
                        >
                          <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                          <SelectContent>
                            {schools.map((school) => (
                              <SelectItem key={school} value={school}>{school}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Reason (optional)</Label>
                        <Input 
                          value={newJudgeSchoolConflict.reason}
                          onChange={(e) => setNewJudgeSchoolConflict(p => ({ ...p, reason: e.target.value }))}
                          placeholder="e.g., Affiliated with school"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddJudgeSchoolConflict(false)}>Cancel</Button>
                      <Button onClick={addJudgeSchoolConflict}>Add Conflict</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {judgeSchoolConflicts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No judge-school conflicts defined
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judge</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {judgeSchoolConflicts.map((conflict) => (
                      <TableRow key={conflict.id}>
                        <TableCell>{conflict.judge_name}</TableCell>
                        <TableCell>{conflict.school_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {conflict.reason || '-'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteJudgeSchoolConflict(conflict.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Constraint Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Team Conflicts</p>
                    <p className="text-2xl font-bold">{teamConflicts.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Judge-Team</p>
                    <p className="text-2xl font-bold">{judgeTeamConflicts.length}</p>
                  </div>
                  <UserX className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Judge-School</p>
                    <p className="text-2xl font-bold">{judgeSchoolConflicts.length}</p>
                  </div>
                  <School className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Protected Schools</p>
                    <p className="text-2xl font-bold">{schools.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
