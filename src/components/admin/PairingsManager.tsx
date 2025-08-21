
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
import { Plus, Edit, MessageSquare, Users, Eye, EyeOff } from 'lucide-react';

interface Pairing {
  id: string;
  tournament_id: string;
  round_id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  room: string;
  scheduled_time: string;
  scheduling_status: string;
  released: boolean;
  aff_participant: { participant_name: string };
  neg_participant: { participant_name: string };
  round: { name: string };
}

interface Round {
  id: string;
  name: string;
}

interface Registration {
  id: string;
  participant_name: string;
}

export function PairingsManager() {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    aff_registration_id: '',
    neg_registration_id: '',
    room: '',
    scheduled_time: ''
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchRounds();
      fetchRegistrations();
    }
  }, [selectedTournament]);

  useEffect(() => {
    if (selectedRound) {
      fetchPairings();
    }
  }, [selectedRound]);

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
      const { data, error } = await supabase
        .from('rounds')
        .select('id, name')
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
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedTournament) return;
    
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('id, participant_name')
        .eq('tournament_id', selectedTournament)
        .eq('payment_status', 'paid');

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive",
      });
    }
  };

  const fetchPairings = async () => {
    if (!selectedRound) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_participant:tournament_registrations!aff_registration_id(participant_name),
          neg_participant:tournament_registrations!neg_registration_id(participant_name),
          round:rounds(name)
        `)
        .eq('round_id', selectedRound);

      if (error) throw error;
      setPairings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch pairings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPairing = async () => {
    try {
      const { error } = await supabase
        .from('pairings')
        .insert([{
          tournament_id: selectedTournament,
          round_id: selectedRound,
          ...formData,
          scheduled_time: formData.scheduled_time || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pairing created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchPairings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create pairing",
        variant: "destructive",
      });
    }
  };

  const togglePairingRelease = async (pairingId: string, released: boolean) => {
    try {
      const { error } = await supabase
        .from('pairings')
        .update({ released })
        .eq('id', pairingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Pairing ${released ? 'released' : 'unreleased'} successfully`,
      });

      fetchPairings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update pairing",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      aff_registration_id: '',
      neg_registration_id: '',
      room: '',
      scheduled_time: ''
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament & Round Selection</CardTitle>
          <CardDescription>Select a tournament and round to manage pairings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>Round</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound} disabled={!selectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map(round => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRound && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pairings Management</h3>
              <p className="text-muted-foreground">Create and manage round pairings</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Pairing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Pairing</DialogTitle>
                  <DialogDescription>
                    Add a new pairing to the round
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Affirmative</Label>
                      <Select value={formData.aff_registration_id} onValueChange={(value) => setFormData({...formData, aff_registration_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select participant" />
                        </SelectTrigger>
                        <SelectContent>
                          {registrations.map(reg => (
                            <SelectItem key={reg.id} value={reg.id}>
                              {reg.participant_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Negative</Label>
                      <Select value={formData.neg_registration_id} onValueChange={(value) => setFormData({...formData, neg_registration_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select participant" />
                        </SelectTrigger>
                        <SelectContent>
                          {registrations.map(reg => (
                            <SelectItem key={reg.id} value={reg.id}>
                              {reg.participant_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="room">Room</Label>
                      <Input
                        id="room"
                        value={formData.room}
                        onChange={(e) => setFormData({...formData, room: e.target.value})}
                        placeholder="e.g., Room 101"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduled_time">Scheduled Time (Optional)</Label>
                      <Input
                        id="scheduled_time"
                        type="datetime-local"
                        value={formData.scheduled_time}
                        onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPairing}>
                    Create Pairing
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pairings ({pairings.length})</CardTitle>
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
                      <TableHead>Participants</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pairings.map((pairing) => (
                      <TableRow key={pairing.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">AFF</Badge>
                              <span className="font-medium">{pairing.aff_participant?.participant_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">NEG</Badge>
                              <span className="font-medium">{pairing.neg_participant?.participant_name}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{pairing.room || 'Not assigned'}</TableCell>
                        <TableCell>
                          {pairing.scheduled_time ? (
                            new Date(pairing.scheduled_time).toLocaleString()
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={pairing.released ? 'default' : 'outline'} className="w-fit">
                              {pairing.released ? 'Released' : 'Unreleased'}
                            </Badge>
                            <Badge variant="secondary" className="w-fit">
                              {pairing.scheduling_status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePairingRelease(pairing.id, !pairing.released)}
                            >
                              {pairing.released ? (
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
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chat
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
