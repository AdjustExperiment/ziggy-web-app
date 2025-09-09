
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Users, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Pairing, Round, Registration } from '@/types/database';
import { parseFormat, validateFormat } from '@/lib/formats';
import { generateSwissPairings, TeamRecord } from '@/lib/pairings/swiss';
import { generateEliminationPairings, SeedEntry } from '@/lib/pairings/elimination';

interface Tournament {
  id: string;
  name: string;
}

export function PairingsManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPairing, setEditingPairing] = useState<Pairing | null>(null);
  const [formData, setFormData] = useState({
    aff_registration_id: '',
    neg_registration_id: '',
    judge_id: 'none',
    room: '',
    scheduled_time: ''
  });
  const [algorithm, setAlgorithm] = useState<'swiss' | 'elimination'>('swiss');
  const [swissMethod, setSwissMethod] = useState<'high_high' | 'high_low' | 'random'>('high_high');
  const [proposals, setProposals] = useState<{
    affRegistrationId: string;
    negRegistrationId: string;
    judgeId?: string;
    room?: string;
  }[]>([]);

  useEffect(() => {
    fetchTournaments();
    fetchJudges();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchRounds = async () => {
    if (!selectedTournament) return;

    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('round_number');

      if (error) throw error;
      // Type cast to handle missing optional properties from the Round interface
      const typedRounds = (data || []).map(round => ({
        ...round,
        start_time: (round as any).start_time || null,
        format: (round as any).format || null,
        notes: (round as any).notes || null
      }));
      setRounds(typedRounds);
    } catch (error: any) {
      console.error('Error fetching rounds:', error);
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedTournament) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          judge_profiles:requested_judge_profile_id (
            name
          )
        `)
        .eq('tournament_id', selectedTournament)
        .order('participant_name');

      if (error) throw error;
      
      // Transform data to match Registration interface
      const transformedData = data?.map(item => ({
        ...item,
        judge_name: item.judge_profiles?.name || null,
        partnership_status: item.partner_name ? 'with_partner' : 'individual'
      })) || [];
      
      setRegistrations(transformedData as Registration[]);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
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
      console.error('Error fetching judges:', error);
    }
  };

  const fetchPairings = async () => {
    if (!selectedRound) return;

    try {
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_registration:tournament_registrations!aff_registration_id(participant_name, participant_email),
          neg_registration:tournament_registrations!neg_registration_id(participant_name, participant_email),
          judge_profiles(name, email),
          round:rounds(name),
          tournaments(name)
        `)
        .eq('round_id', selectedRound)
        .order('created_at');

      if (error) throw error;
      setPairings(data || []);
    } catch (error: any) {
      console.error('Error fetching pairings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pairings",
        variant: "destructive",
      });
    }
  };

  const validateTournamentFormat = async (tournamentId: string) => {
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('format')
      .eq('id', tournamentId)
      .single();
    if (tErr) throw tErr;
    if (!tournament?.format) return;

    const { data: format, error: fErr } = await supabase
      .from('debate_formats')
      .select('rules')
      .eq('name', tournament.format)
      .single();
    if (fErr) throw fErr;

    const parsed = format?.rules || {};
    // Simple validation - just check if format exists
  };

  const runAlgorithm = () => {
    if (!selectedRound || registrations.length < 2) {
      toast({
        title: "Error",
        description: "Need at least two registrations",
        variant: "destructive",
      });
      return;
    }
    if (algorithm === 'swiss') {
      const records: TeamRecord[] = registrations.map(r => ({
        registration: r,
        wins: 0,
        losses: 0,
        speaks: 0,
        oppStrength: 0
      }));
      const generated = generateSwissPairings(records, judges, { method: swissMethod });
      setProposals(generated.map(p => ({ ...p })));
    } else {
      const seeds: SeedEntry[] = registrations.map((r, idx) => ({ registrationId: r.id, seed: idx + 1 }));
      const generated = generateEliminationPairings(seeds, judges);
      setProposals(generated.map(p => ({ ...p })));
    }
  };

  const updateProposal = (index: number, changes: Partial<{ judgeId?: string; room?: string }>) => {
    setProposals(prev => prev.map((p, i) => (i === index ? { ...p, ...changes } : p)));
  };

  const saveGeneratedPairings = async () => {
    if (!selectedRound || !selectedTournament) return;

    const usedJudges = new Set<string>();
    const usedRooms = new Set<string>();

    for (const p of proposals) {
      if (p.judgeId) {
        if (usedJudges.has(p.judgeId)) {
          toast({
            title: "Validation error",
            description: "Judge assigned multiple times",
            variant: "destructive",
          });
          return;
        }
        usedJudges.add(p.judgeId);
      }
      if (p.room) {
        if (usedRooms.has(p.room)) {
          toast({
            title: "Validation error",
            description: "Room assigned multiple times",
            variant: "destructive",
          });
          return;
        }
        usedRooms.add(p.room);
      }
    }

    try {
      const { error } = await supabase.from('pairings').insert(
        proposals.map(p => ({
          tournament_id: selectedTournament,
          round_id: selectedRound,
          aff_registration_id: p.affRegistrationId,
          neg_registration_id: p.negRegistrationId,
          judge_id: p.judgeId || null,
          room: p.room || null,
          method: algorithm,
          seed: { algorithm, method: algorithm === 'swiss' ? swissMethod : 'seeds' }
        }))
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: `Saved ${proposals.length} pairings`,
      });

      setProposals([]);
      fetchPairings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save pairings",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRound || !selectedTournament) {
      toast({
        title: "Error",
        description: "Please select a tournament and round",
        variant: "destructive",
      });
      return;
    }

    try {
      await validateTournamentFormat(selectedTournament);
      const pairingData = {
        tournament_id: selectedTournament,
        round_id: selectedRound,
        aff_registration_id: formData.aff_registration_id,
        neg_registration_id: formData.neg_registration_id,
        judge_id: formData.judge_id === 'none' ? null : formData.judge_id,
        room: formData.room || null,
        scheduled_time: formData.scheduled_time || null
      };

      if (editingPairing) {
        const { error } = await supabase
          .from('pairings')
          .update(pairingData)
          .eq('id', editingPairing.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Pairing updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('pairings')
          .insert(pairingData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Pairing created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPairings();
    } catch (error: any) {
      console.error('Error saving pairing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save pairing",
        variant: "destructive",
      });
    }
  };

  const deletePairing = async (pairingId: string) => {
    try {
      const { error } = await supabase
        .from('pairings')
        .delete()
        .eq('id', pairingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pairing deleted successfully",
      });
      fetchPairings();
    } catch (error: any) {
      console.error('Error deleting pairing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete pairing",
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
      console.error('Error toggling pairing release:', error);
      toast({
        title: "Error",
        description: "Failed to update pairing visibility",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      aff_registration_id: '',
      neg_registration_id: '',
      judge_id: 'none',
      room: '',
      scheduled_time: ''
    });
    setEditingPairing(null);
  };

  const openEditDialog = (pairing: Pairing) => {
    setEditingPairing(pairing);
    setFormData({
      aff_registration_id: pairing.aff_registration_id,
      neg_registration_id: pairing.neg_registration_id,
      judge_id: pairing.judge_id || 'none',
      room: pairing.room || '',
      scheduled_time: pairing.scheduled_time ? pairing.scheduled_time.slice(0, 16) : ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
                  {rounds.length === 0 ? (
                    <SelectItem value="none" disabled>No rounds available</SelectItem>
                  ) : (
                    rounds.map(round => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRound && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Automatic Pairings</CardTitle>
              <CardDescription>Run pairing algorithms and review results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Algorithm</Label>
                  <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as 'swiss' | 'elimination')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="swiss">Swiss</SelectItem>
                      <SelectItem value="elimination">Elimination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {algorithm === 'swiss' && (
                  <div>
                    <Label>Method</Label>
                    <Select value={swissMethod} onValueChange={(v) => setSwissMethod(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_high">High-High</SelectItem>
                        <SelectItem value="high_low">High-Low</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-end">
                  <Button onClick={runAlgorithm}>Generate</Button>
                </div>
              </div>
              {proposals.length > 0 && (
                <div className="space-y-4">
                    {proposals.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                        <div className="col-span-2">
                          <Badge variant="outline" className="mr-2">AFF</Badge>
                          {registrations.find(r => r.id === p.affRegistrationId)?.participant_name}
                          <span className="mx-2">vs</span>
                          <Badge variant="secondary" className="mr-2">NEG</Badge>
                          {registrations.find(r => r.id === p.negRegistrationId)?.participant_name}
                        </div>
                      <Select value={p.judgeId || 'none'} onValueChange={(v) => updateProposal(idx, { judgeId: v === 'none' ? undefined : v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Judge" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No judge</SelectItem>
                          {judges.map(j => (
                            <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Room" value={p.room || ''} onChange={(e) => updateProposal(idx, { room: e.target.value })} />
                    </div>
                  ))}
                  <Button onClick={saveGeneratedPairings}>Save Pairings</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pairings Management
                  </CardTitle>
                  <CardDescription>
                    Manage debate pairings for the selected round
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pairing
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPairing ? 'Edit Pairing' : 'Create New Pairing'}
                      </DialogTitle>
                      <DialogDescription>
                        Set up a debate pairing between two teams
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Affirmative Team</Label>
                          <Select
                            value={formData.aff_registration_id}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, aff_registration_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select AFF team" />
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
                          <Label>Negative Team</Label>
                          <Select
                            value={formData.neg_registration_id}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, neg_registration_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select NEG team" />
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
                      <div>
                        <Label>Judge (Optional)</Label>
                        <Select
                          value={formData.judge_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, judge_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select judge" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No judge assigned</SelectItem>
                            {judges.map(judge => (
                              <SelectItem key={judge.id} value={judge.id}>
                                {judge.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Room</Label>
                          <Input
                            value={formData.room}
                            onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                            placeholder="Room assignment"
                          />
                        </div>
                        <div>
                          <Label>Scheduled Time</Label>
                          <Input
                            type="datetime-local"
                            value={formData.scheduled_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingPairing ? 'Update' : 'Create'} Pairing
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {pairings.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pairings Yet</h3>
                  <p className="text-muted-foreground">
                    Create your first pairing to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pairings.map((pairing) => (
                    <Card key={pairing.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-3 gap-8 flex-1">
                            <div>
                              <Badge variant="outline" className="mb-2">AFF</Badge>
                              <p className="font-medium">{pairing.aff_registration?.participant_name}</p>
                              <p className="text-sm text-muted-foreground">{pairing.aff_registration?.participant_email}</p>
                            </div>
                            <div>
                              <Badge variant="secondary" className="mb-2">NEG</Badge>
                              <p className="font-medium">{pairing.neg_registration?.participant_name}</p>
                              <p className="text-sm text-muted-foreground">{pairing.neg_registration?.participant_email}</p>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Judge</div>
                              <p className="font-medium">{pairing.judge_profiles?.name || 'TBD'}</p>
                              <p className="text-sm text-muted-foreground">
                                Room: {pairing.room || 'TBD'}
                              </p>
                              {pairing.scheduled_time && (
                                <p className="text-sm text-muted-foreground">
                                  {new Date(pairing.scheduled_time).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge variant={pairing.released ? 'default' : 'secondary'}>
                              {pairing.released ? 'Released' : 'Draft'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePairingRelease(pairing.id, pairing.released)}
                            >
                              {pairing.released ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(pairing)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deletePairing(pairing.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
