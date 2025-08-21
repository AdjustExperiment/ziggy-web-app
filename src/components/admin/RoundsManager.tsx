
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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Eye, EyeOff, Clock } from 'lucide-react';

interface Round {
  id: string;
  tournament_id: string;
  name: string;
  number: number;
  type: string;
  scheduled_at: string;
  released: boolean;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
}

export function RoundsManager() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    number: 1,
    type: 'prelim',
    scheduled_at: '',
    tournament_id: ''
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchRounds();
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

  const fetchRounds = async () => {
    if (!selectedTournament) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('number');

      if (error) throw error;
      setRounds(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch rounds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRound = async () => {
    try {
      const { error } = await supabase
        .from('rounds')
        .insert([{
          ...formData,
          tournament_id: selectedTournament,
          scheduled_at: formData.scheduled_at || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchRounds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create round",
        variant: "destructive",
      });
    }
  };

  const toggleRoundRelease = async (roundId: string, released: boolean) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ released })
        .eq('id', roundId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Round ${released ? 'released' : 'unreleased'} successfully`,
      });

      fetchRounds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update round",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      number: 1,
      type: 'prelim',
      scheduled_at: '',
      tournament_id: ''
    });
  };

  if (loading && !selectedTournament) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Selection</CardTitle>
          <CardDescription>Select a tournament to manage its rounds</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedTournament && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Rounds Management</h3>
              <p className="text-muted-foreground">Create and manage tournament rounds</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Round
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Round</DialogTitle>
                  <DialogDescription>
                    Add a new round to the tournament
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Round Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Round 1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="number">Round Number</Label>
                      <Input
                        id="number"
                        type="number"
                        value={formData.number}
                        onChange={(e) => setFormData({...formData, number: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Round Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prelim">Preliminary</SelectItem>
                          <SelectItem value="elim">Elimination</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="scheduled_at">Scheduled Time (Optional)</Label>
                      <Input
                        id="scheduled_at"
                        type="datetime-local"
                        value={formData.scheduled_at}
                        onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createRound}>
                    Create Round
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rounds ({rounds.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rounds.map((round) => (
                      <TableRow key={round.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{round.name}</div>
                            <div className="text-sm text-muted-foreground">#{round.number}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={round.type === 'elim' ? 'destructive' : 'secondary'}>
                            {round.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {round.scheduled_at ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(round.scheduled_at).toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={round.released ? 'default' : 'outline'}>
                            {round.released ? 'Released' : 'Unreleased'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleRoundRelease(round.id, !round.released)}
                            >
                              {round.released ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Release
                                </>
                              )}
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
        </>
      )}
    </div>
  );
}
