
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Play, 
  Lock, 
  Unlock, 
  Users, 
  Calendar, 
  MapPin, 
  Shuffle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface PairingGeneratorProps {
  tournamentId: string;
  rounds: any[];
  registrations: any[];
  judges: any[];
  onRoundsUpdate: () => void;
  onToggleRoundLock: (roundId: string, locked: boolean) => void;
}

interface Round {
  id: string;
  name: string;
  round_number: number;
  scheduled_date: string;
  status: string;
  tournament_id: string;
}

interface Pairing {
  id: string;
  round_id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  judge_id?: string;
  room?: string;
  scheduled_time?: string;
  status: string;
  released: boolean;
}

export function PairingGenerator({ 
  tournamentId, 
  rounds, 
  registrations, 
  judges,
  onRoundsUpdate,
  onToggleRoundLock 
}: PairingGeneratorProps) {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newRound, setNewRound] = useState({
    name: '',
    scheduled_date: '',
    round_number: rounds.length + 1
  });

  useEffect(() => {
    if (selectedRound) {
      fetchPairings();
    }
  }, [selectedRound]);

  const fetchPairings = async () => {
    if (!selectedRound) return;

    try {
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_registration:tournament_registrations!aff_registration_id(participant_name),
          neg_registration:tournament_registrations!neg_registration_id(participant_name),
          judge_profiles(name)
        `)
        .eq('round_id', selectedRound)
        .order('room');

      if (error) throw error;
      setPairings(data || []);
    } catch (error: any) {
      console.error('Error fetching pairings:', error);
    }
  };

  const createRound = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rounds')
        .insert([{
          tournament_id: tournamentId,
          name: newRound.name,
          round_number: newRound.round_number,
          scheduled_date: newRound.scheduled_date || null,
          status: 'upcoming'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round created successfully",
      });

      setIsCreatingRound(false);
      setNewRound({
        name: '',
        scheduled_date: '',
        round_number: rounds.length + 2
      });
      onRoundsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create round",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePairings = async () => {
    if (!selectedRound) return;

    try {
      setLoading(true);

      // Simple random pairing algorithm
      const availableRegistrations = [...registrations];
      const newPairings = [];

      // Shuffle registrations
      for (let i = availableRegistrations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableRegistrations[i], availableRegistrations[j]] = [availableRegistrations[j], availableRegistrations[i]];
      }

      // Create pairs
      for (let i = 0; i < availableRegistrations.length - 1; i += 2) {
        const aff = availableRegistrations[i];
        const neg = availableRegistrations[i + 1];
        
        newPairings.push({
          round_id: selectedRound,
          tournament_id: tournamentId,
          aff_registration_id: aff.id,
          neg_registration_id: neg.id,
          room: `Room ${Math.floor(i / 2) + 1}`,
          status: 'scheduled',
          released: false
        });
      }

      const { error } = await supabase
        .from('pairings')
        .insert(newPairings);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Generated ${newPairings.length} pairings`,
      });

      fetchPairings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate pairings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignJudge = async (pairingId: string, judgeId: string) => {
    try {
      const { error } = await supabase
        .from('pairings')
        .update({ judge_id: judgeId === 'none' ? null : judgeId })
        .eq('id', pairingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Judge assigned successfully",
      });

      fetchPairings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to assign judge",
        variant: "destructive",
      });
    }
  };

  const togglePairingRelease = async (pairingId: string, released: boolean) => {
    try {
      const { error } = await supabase
        .from('pairings')
        .update({ released: !released })
        .eq('id', pairingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Pairing ${!released ? 'released' : 'hidden'}`,
      });

      fetchPairings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update pairing visibility",
        variant: "destructive",
      });
    }
  };

  const releaseAllPairings = async () => {
    if (!selectedRound) return;

    try {
      const { error } = await supabase
        .from('pairings')
        .update({ released: true })
        .eq('round_id', selectedRound);

      if (error) throw error;

      toast({
        title: "Success",
        description: "All pairings released to participants",
      });

      fetchPairings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to release pairings",
        variant: "destructive",
      });
    }
  };

  const selectedRoundData = rounds.find(r => r.id === selectedRound);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pairing Generator</h2>
          <p className="text-muted-foreground">Create rounds and manage pairings for debates</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreatingRound} onOpenChange={setIsCreatingRound}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreatingRound(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Round
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Round</DialogTitle>
                <DialogDescription>
                  Create a new debate round for this tournament
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="round-name">Round Name</Label>
                  <Input
                    id="round-name"
                    value={newRound.name}
                    onChange={(e) => setNewRound({...newRound, name: e.target.value})}
                    placeholder="e.g., Round 1, Quarterfinals"
                  />
                </div>
                
                <div>
                  <Label htmlFor="round-number">Round Number</Label>
                  <Input
                    id="round-number"
                    type="number"
                    value={newRound.round_number}
                    onChange={(e) => setNewRound({...newRound, round_number: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="scheduled-date">Scheduled Date (Optional)</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={newRound.scheduled_date}
                    onChange={(e) => setNewRound({...newRound, scheduled_date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreatingRound(false)}>
                  Cancel
                </Button>
                <Button onClick={createRound} disabled={loading || !newRound.name}>
                  {loading ? 'Creating...' : 'Create Round'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Round Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Round Management</CardTitle>
          <CardDescription>Select a round to manage pairings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="round-select">Select Round</Label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a round..." />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    <div className="flex items-center gap-2">
                      <span>{round.name}</span>
                      <Badge variant={round.status === 'locked' ? 'destructive' : 'secondary'}>
                        {round.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoundData && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium">{selectedRoundData.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Round {selectedRoundData.round_number}
                    {selectedRoundData.scheduled_date && (
                      <> • {new Date(selectedRoundData.scheduled_date).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                
                <Badge variant={selectedRoundData.status === 'locked' ? 'destructive' : 'secondary'}>
                  {selectedRoundData.status === 'locked' ? (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3 mr-1" />
                      {selectedRoundData.status}
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex gap-2">
                {pairings.length === 0 && selectedRoundData.status !== 'locked' && (
                  <Button
                    onClick={generatePairings}
                    disabled={loading || registrations.length < 2}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generate Pairings
                  </Button>
                )}
                
                {pairings.length > 0 && (
                  <Button
                    onClick={releaseAllPairings}
                    disabled={loading}
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Release All
                  </Button>
                )}
                
                <Button
                  onClick={() => onToggleRoundLock(selectedRoundData.id, selectedRoundData.status !== 'locked')}
                  variant={selectedRoundData.status === 'locked' ? 'outline' : 'secondary'}
                >
                  {selectedRoundData.status === 'locked' ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock Round
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock Round
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pairings Table */}
      {selectedRound && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pairings ({pairings.length})
            </CardTitle>
            <CardDescription>
              Manage debate pairings for the selected round
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pairings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pairings generated for this round</p>
                {registrations.length >= 2 && selectedRoundData?.status !== 'locked' && (
                  <Button onClick={generatePairings} className="mt-4" disabled={loading}>
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generate Pairings
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Affirmative</TableHead>
                    <TableHead>Negative</TableHead>
                    <TableHead>Judge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairings.map((pairing) => (
                    <TableRow key={pairing.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {pairing.room || 'TBD'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          Affirmative Team
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          Negative Team
                        </div>
                      </TableCell>
                      <TableCell>
                         <Select 
                           value={pairing.judge_id || 'none'} 
                           onValueChange={(value) => assignJudge(pairing.id, value)}
                           disabled={selectedRoundData?.status === 'locked'}
                         >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Assign judge" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No judge assigned</SelectItem>
                            {judges.map((judge) => (
                              <SelectItem key={judge.id} value={judge.id}>
                                {judge.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pairing.status === 'completed' ? 'default' : 'secondary'}>
                          {pairing.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePairingRelease(pairing.id, pairing.released)}
                          disabled={selectedRoundData?.status === 'locked'}
                        >
                          {pairing.released ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Hidden
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {pairing.scheduled_time && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(pairing.scheduled_time).toLocaleTimeString()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
