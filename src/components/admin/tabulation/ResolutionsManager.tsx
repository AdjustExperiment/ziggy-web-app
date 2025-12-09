import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Eye,
  EyeOff,
  Edit,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Resolution {
  id: string;
  tournament_id: string;
  round_id: string | null;
  resolution_text: string;
  info_slide: string | null;
  seq: number;
  is_released: boolean;
  released_at: string | null;
  created_at: string;
}

interface Round {
  id: string;
  name: string;
  round_number: number;
}

interface ResolutionsManagerProps {
  tournamentId: string;
  rounds: Round[];
}

export function ResolutionsManager({ tournamentId, rounds }: ResolutionsManagerProps) {
  const { toast } = useToast();
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingResolution, setEditingResolution] = useState<Resolution | null>(null);
  const [newResolution, setNewResolution] = useState({
    round_id: '',
    resolution_text: '',
    info_slide: '',
    seq: 1
  });

  useEffect(() => {
    fetchResolutions();
  }, [tournamentId]);

  const fetchResolutions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resolutions')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seq');

      if (error) throw error;
      setResolutions(data || []);
    } catch (error: any) {
      console.error('Error fetching resolutions:', error);
      toast({
        title: "Error",
        description: "Failed to load resolutions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addResolution = async () => {
    try {
      const { error } = await supabase
        .from('resolutions')
        .insert({
          tournament_id: tournamentId,
          round_id: newResolution.round_id || null,
          resolution_text: newResolution.resolution_text,
          info_slide: newResolution.info_slide || null,
          seq: newResolution.seq
        });

      if (error) throw error;

      toast({ title: "Success", description: "Resolution added" });
      setShowAddDialog(false);
      setNewResolution({ round_id: '', resolution_text: '', info_slide: '', seq: 1 });
      fetchResolutions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateResolution = async () => {
    if (!editingResolution) return;

    try {
      const { error } = await supabase
        .from('resolutions')
        .update({
          round_id: editingResolution.round_id,
          resolution_text: editingResolution.resolution_text,
          info_slide: editingResolution.info_slide,
          seq: editingResolution.seq
        })
        .eq('id', editingResolution.id);

      if (error) throw error;

      toast({ title: "Success", description: "Resolution updated" });
      setEditingResolution(null);
      fetchResolutions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteResolution = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resolutions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Deleted", description: "Resolution removed" });
      fetchResolutions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleRelease = async (resolution: Resolution) => {
    try {
      const newReleased = !resolution.is_released;
      const { error } = await supabase
        .from('resolutions')
        .update({
          is_released: newReleased,
          released_at: newReleased ? new Date().toISOString() : null
        })
        .eq('id', resolution.id);

      if (error) throw error;

      // Also update the round's resolution_released status if linked
      if (resolution.round_id) {
        await supabase
          .from('rounds')
          .update({ resolution_released: newReleased })
          .eq('id', resolution.round_id);
      }

      toast({ 
        title: "Success", 
        description: newReleased ? "Resolution released to participants" : "Resolution hidden" 
      });
      fetchResolutions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getRoundName = (roundId: string | null) => {
    if (!roundId) return 'General';
    const round = rounds.find(r => r.id === roundId);
    return round?.name || 'Unknown Round';
  };

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resolutions
              </CardTitle>
              <CardDescription>
                Manage debate resolutions/motions for each round
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resolution
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Resolution</DialogTitle>
                  <DialogDescription>
                    Create a new resolution for a specific round
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Round</Label>
                      <Select
                        value={newResolution.round_id}
                        onValueChange={v => setNewResolution(p => ({ ...p, round_id: v }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select round" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">General (No Round)</SelectItem>
                          {rounds.map(round => (
                            <SelectItem key={round.id} value={round.id}>
                              {round.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sequence</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newResolution.seq}
                        onChange={e => setNewResolution(p => ({ ...p, seq: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Resolution Text</Label>
                    <Textarea
                      value={newResolution.resolution_text}
                      onChange={e => setNewResolution(p => ({ ...p, resolution_text: e.target.value }))}
                      placeholder="This house believes that..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Info Slide (Optional)</Label>
                    <Textarea
                      value={newResolution.info_slide}
                      onChange={e => setNewResolution(p => ({ ...p, info_slide: e.target.value }))}
                      placeholder="Context or definitions for the resolution..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button onClick={addResolution} disabled={!newResolution.resolution_text.trim()}>
                    Add Resolution
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {resolutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No resolutions added yet</p>
              <p className="text-sm">Add resolutions for your tournament rounds</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolutions.map(resolution => (
                  <TableRow key={resolution.id}>
                    <TableCell>{resolution.seq}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRoundName(resolution.round_id)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="line-clamp-2">{resolution.resolution_text}</p>
                        {resolution.info_slide && (
                          <p className="text-xs text-muted-foreground mt-1">Has info slide</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {resolution.is_released ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <Eye className="h-3 w-3" />
                          Released
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant={resolution.is_released ? "outline" : "default"}
                          onClick={() => toggleRelease(resolution)}
                        >
                          {resolution.is_released ? (
                            <><EyeOff className="h-4 w-4 mr-1" /> Hide</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-1" /> Release</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingResolution(resolution)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteResolution(resolution.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Resolution Dialog */}
      <Dialog open={!!editingResolution} onOpenChange={(open) => !open && setEditingResolution(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resolution</DialogTitle>
          </DialogHeader>
          {editingResolution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Round</Label>
                  <Select
                    value={editingResolution.round_id || ''}
                    onValueChange={v => setEditingResolution({ ...editingResolution, round_id: v || null })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select round" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General (No Round)</SelectItem>
                      {rounds.map(round => (
                        <SelectItem key={round.id} value={round.id}>
                          {round.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sequence</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingResolution.seq}
                    onChange={e => setEditingResolution({ ...editingResolution, seq: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div>
                <Label>Resolution Text</Label>
                <Textarea
                  value={editingResolution.resolution_text}
                  onChange={e => setEditingResolution({ ...editingResolution, resolution_text: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Info Slide (Optional)</Label>
                <Textarea
                  value={editingResolution.info_slide || ''}
                  onChange={e => setEditingResolution({ ...editingResolution, info_slide: e.target.value || null })}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResolution(null)}>Cancel</Button>
            <Button onClick={updateResolution}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
