
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Trash2, Crown, Eye, UserCheck, UserX } from 'lucide-react';
import { PairingJudgeAssignment, JudgeProfile, Pairing } from '@/types/database';

interface MultiJudgePanelManagerProps {
  tournamentId: string;
}

interface PairingWithAssignments extends Pairing {
  judge_assignments: (PairingJudgeAssignment & { judge_profiles: JudgeProfile })[];
}

export default function MultiJudgePanelManager({ tournamentId }: MultiJudgePanelManagerProps) {
  const { toast } = useToast();
  const [pairings, setPairings] = useState<PairingWithAssignments[]>([]);
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPairing, setSelectedPairing] = useState<PairingWithAssignments | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [assignmentForm, setAssignmentForm] = useState({
    judge_profile_id: '',
    role: 'panelist' as 'chair' | 'panelist' | 'shadow' | 'trainee',
    notes: ''
  });

  useEffect(() => {
    fetchPairingsAndJudges();
  }, [tournamentId]);

  const fetchPairingsAndJudges = async () => {
    try {
      setLoading(true);
      
      // Fetch pairings with their judge assignments
      const { data: pairingsData, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_registration:tournament_registrations!aff_registration_id(participant_name),
          neg_registration:tournament_registrations!neg_registration_id(participant_name),
          round:rounds(name),
          judge_assignments:pairing_judge_assignments(
            *,
            judge_profiles(*)
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });

      if (pairingsError) throw pairingsError;

      // Fetch available judges
      const { data: judgesData, error: judgesError } = await supabase
        .from('judge_profiles')
        .select('*')
        .order('name');

      if (judgesError) throw judgesError;

      setPairings(pairingsData || []);
      setJudges(judgesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pairings and judges',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJudge = async (pairingId: string) => {
    if (!assignmentForm.judge_profile_id) return;

    try {
      const { error } = await supabase
        .from('pairing_judge_assignments')
        .insert({
          pairing_id: pairingId,
          judge_profile_id: assignmentForm.judge_profile_id,
          role: assignmentForm.role,
          notes: assignmentForm.notes || null,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Judge assigned to panel successfully',
      });

      setAssignmentForm({ judge_profile_id: '', role: 'panelist', notes: '' });
      setIsDialogOpen(false);
      fetchPairingsAndJudges();
    } catch (error: any) {
      console.error('Error assigning judge:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign judge',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this judge assignment?')) return;

    try {
      const { error } = await supabase
        .from('pairing_judge_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Judge assignment removed successfully',
      });

      fetchPairingsAndJudges();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove judge assignment',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'chair': return <Crown className="h-4 w-4" />;
      case 'shadow': return <Eye className="h-4 w-4" />;
      case 'trainee': return <UserCheck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'removed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
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
          <h3 className="text-lg font-semibold">Multi-Judge Panel Management</h3>
          <p className="text-sm text-muted-foreground">
            Assign multiple judges to pairings and manage panel compositions
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {pairings.map((pairing) => (
          <Card key={pairing.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {pairing.aff_registration?.participant_name} vs {pairing.neg_registration?.participant_name}
                  </CardTitle>
                  <CardDescription>
                    {pairing.round?.name} • Room: {pairing.room || 'TBD'} • 
                    {pairing.scheduled_time ? new Date(pairing.scheduled_time).toLocaleString() : 'Time TBD'}
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen && selectedPairing?.id === pairing.id} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (open) setSelectedPairing(pairing);
                  else setSelectedPairing(null);
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Judge
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Judge to Panel</DialogTitle>
                      <DialogDescription>
                        Add a judge to the panel for this pairing
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="judge">Judge</Label>
                        <Select 
                          value={assignmentForm.judge_profile_id}
                          onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, judge_profile_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a judge" />
                          </SelectTrigger>
                          <SelectContent>
                            {judges
                              .filter(judge => !pairing.judge_assignments.some(a => a.judge_profile_id === judge.id))
                              .map(judge => (
                                <SelectItem key={judge.id} value={judge.id}>
                                  {judge.name} ({judge.experience_level})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select 
                          value={assignmentForm.role}
                          onValueChange={(value: any) => setAssignmentForm(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chair">Chair Judge</SelectItem>
                            <SelectItem value="panelist">Panelist</SelectItem>
                            <SelectItem value="shadow">Shadow Judge</SelectItem>
                            <SelectItem value="trainee">Trainee Judge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={assignmentForm.notes}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any special instructions or notes..."
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleAssignJudge(pairing.id)}>
                          Assign Judge
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {pairing.judge_assignments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No judges assigned to this panel yet
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium">Panel Composition</h4>
                  <div className="grid gap-3">
                    {pairing.judge_assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(assignment.role)}
                            <span className="font-medium">
                              {assignment.judge_profiles?.name}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {assignment.role}
                          </Badge>
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.notes && (
                            <span className="text-xs text-muted-foreground max-w-32 truncate">
                              {assignment.notes}
                            </span>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {pairings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pairings Found</h3>
            <p className="text-muted-foreground">
              Create pairings for this tournament to start assigning judge panels.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
