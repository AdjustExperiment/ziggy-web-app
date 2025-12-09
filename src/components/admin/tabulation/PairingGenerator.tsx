import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Lock, 
  Unlock, 
  Users, 
  MapPin, 
  Shuffle,
  Eye,
  EyeOff,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Printer
} from 'lucide-react';
import { DrawGenerator, Team, PairingHistory, DrawSettings, GeneratedPairing } from '@/lib/tabulation/drawGenerator';

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
  bracket?: number;
  room_rank?: number;
  flags?: string[];
  aff_registration?: { participant_name: string };
  neg_registration?: { participant_name: string };
  judge_profiles?: { name: string };
}

type DrawMethod = 'random' | 'power_paired' | 'round_robin' | 'manual';
type SideMethod = 'balance' | 'preallocated' | 'random';
type OddBracket = 'pullup_top' | 'pullup_bottom' | 'intermediate' | 'intermediate_bubble_up_down';

interface TabulationSettings {
  draw_method: DrawMethod;
  side_method: SideMethod;
  odd_bracket: OddBracket;
  pullup_restriction: string;
  avoid_rematches: boolean;
  club_protect: boolean;
  history_penalty: number;
  institution_penalty: number;
  side_penalty: number;
  max_repeat_opponents: number;
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
  const [settings, setSettings] = useState<TabulationSettings | null>(null);
  const [previewPairings, setPreviewPairings] = useState<GeneratedPairing[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [newRound, setNewRound] = useState({
    name: '',
    scheduled_date: '',
    round_number: rounds.length + 1
  });

  useEffect(() => {
    fetchSettings();
  }, [tournamentId]);

  useEffect(() => {
    if (selectedRound) {
      fetchPairings();
    }
  }, [selectedRound]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_tabulation_settings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          draw_method: (data.draw_method as DrawMethod) || 'power_paired',
          side_method: (data.side_method as SideMethod) || 'balance',
          odd_bracket: (data.odd_bracket as OddBracket) || 'pullup_top',
          pullup_restriction: data.pullup_restriction || 'least_to_date',
          avoid_rematches: data.avoid_rematches ?? true,
          club_protect: data.club_protect ?? true,
          history_penalty: data.history_penalty ?? 1000,
          institution_penalty: data.institution_penalty ?? 500,
          side_penalty: data.side_penalty ?? 100,
          max_repeat_opponents: data.max_repeat_opponents ?? 0,
        });
      } else {
        // Default settings
        setSettings({
          draw_method: 'power_paired',
          side_method: 'balance',
          odd_bracket: 'pullup_top',
          pullup_restriction: 'least_to_date',
          avoid_rematches: true,
          club_protect: true,
          history_penalty: 1000,
          institution_penalty: 500,
          side_penalty: 100,
          max_repeat_opponents: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchPairings = async () => {
    if (!selectedRound) return;

    try {
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_registration:tournament_registrations!aff_registration_id(participant_name, school_organization),
          neg_registration:tournament_registrations!neg_registration_id(participant_name, school_organization),
          judge_profiles(name)
        `)
        .eq('round_id', selectedRound)
        .order('room_rank', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setPairings(data || []);
    } catch (error: any) {
      console.error('Error fetching pairings:', error);
    }
  };

  const createRound = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('rounds')
        .insert([{
          tournament_id: tournamentId,
          name: newRound.name,
          round_number: newRound.round_number,
          scheduled_date: newRound.scheduled_date || null,
          status: 'upcoming'
        }]);

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

  // Fetch historical pairings for conflict checking
  const fetchPairingHistory = async (): Promise<PairingHistory[]> => {
    const { data, error } = await supabase
      .from('pairings')
      .select('aff_registration_id, neg_registration_id, round_id')
      .eq('tournament_id', tournamentId);

    if (error || !data) return [];

    // Get round numbers
    const roundIds = [...new Set(data.map(p => p.round_id))];
    const { data: roundsData } = await supabase
      .from('rounds')
      .select('id, round_number')
      .in('id', roundIds);

    const roundMap = new Map(roundsData?.map(r => [r.id, r.round_number]) || []);

    return data.map(p => ({
      affId: p.aff_registration_id,
      negId: p.neg_registration_id,
      roundNumber: roundMap.get(p.round_id) || 0,
    }));
  };

  // Build teams from registrations with win/loss data
  const buildTeams = async (): Promise<Team[]> => {
    // Get ballot results to calculate wins
    const { data: ballots } = await supabase
      .from('ballots')
      .select(`
        pairing_id,
        payload,
        pairings!inner(
          aff_registration_id,
          neg_registration_id,
          tournament_id
        )
      `)
      .eq('pairings.tournament_id', tournamentId)
      .eq('status', 'submitted');

    // Calculate wins and speaks for each team
    const teamStats = new Map<string, { wins: number; speaks: number; affCount: number; negCount: number }>();

    for (const reg of registrations) {
      teamStats.set(reg.id, {
        wins: 0,
        speaks: 0,
        affCount: reg.aff_count || 0,
        negCount: reg.neg_count || 0,
      });
    }

    // Process ballots
    if (ballots) {
      for (const ballot of ballots) {
        const payload = ballot.payload as any;
        const winner = payload?.winner;
        const affId = ballot.pairings?.aff_registration_id;
        const negId = ballot.pairings?.neg_registration_id;

        if (winner === 'aff' && affId) {
          const stats = teamStats.get(affId);
          if (stats) stats.wins++;
        } else if (winner === 'neg' && negId) {
          const stats = teamStats.get(negId);
          if (stats) stats.wins++;
        }

        // Add speaker points
        const affSpeaks = parseFloat(payload?.aff_speaks) || 0;
        const negSpeaks = parseFloat(payload?.neg_speaks) || 0;
        
        if (affId) {
          const stats = teamStats.get(affId);
          if (stats) stats.speaks += affSpeaks;
        }
        if (negId) {
          const stats = teamStats.get(negId);
          if (stats) stats.speaks += negSpeaks;
        }
      }
    }

    return registrations
      .filter((reg: any) => reg.is_active !== false)
      .map((reg: any) => {
        const stats = teamStats.get(reg.id) || { wins: 0, speaks: 0, affCount: 0, negCount: 0 };
        return {
          id: reg.id,
          name: reg.participant_name,
          institution: reg.school_organization || undefined,
          wins: stats.wins,
          speaks: stats.speaks,
          affCount: stats.affCount,
          negCount: stats.negCount,
          pullupCount: 0,
          isActive: reg.is_active !== false,
        };
      });
  };

  // Convert TabulationSettings to DrawSettings for the generator
  const toDrawSettings = (s: TabulationSettings): DrawSettings => ({
    drawMethod: s.draw_method === 'manual' ? 'random' : s.draw_method,
    sideMethod: s.side_method,
    oddBracket: s.odd_bracket,
    pullupRestriction: s.pullup_restriction as 'least_to_date',
    avoidRematches: s.avoid_rematches,
    clubProtect: s.club_protect,
    historyPenalty: s.history_penalty,
    institutionPenalty: s.institution_penalty,
    sidePenalty: s.side_penalty,
    maxRepeatOpponents: s.max_repeat_opponents,
  });

  // Generate pairings using the advanced algorithm
  const generateAdvancedPairings = async (preview: boolean = false) => {
    if (!selectedRound || !settings) return;

    try {
      setLoading(true);

      // Build team data
      const teams = await buildTeams();
      const history = await fetchPairingHistory();
      const currentRound = rounds.find((r: any) => r.id === selectedRound);
      const roundNumber = currentRound?.round_number || 1;

      // Generate pairings using DrawGenerator
      const drawSettings = toDrawSettings(settings);
      const generator = new DrawGenerator(teams, history, drawSettings, roundNumber);
      const generated = generator.generate();

      if (preview) {
        setPreviewPairings(generated);
        setShowPreview(true);
        return;
      }

      // Create pairings in database
      const newPairings = generated.map((p, index) => ({
        round_id: selectedRound,
        tournament_id: tournamentId,
        aff_registration_id: p.affTeamId,
        neg_registration_id: p.negTeamId || p.affTeamId, // Handle bye
        room: `Room ${index + 1}`,
        status: p.flags.includes('bye') ? 'bye' : 'scheduled',
        released: false,
        bracket: p.bracket,
        room_rank: p.roomRank,
        flags: p.flags,
      }));

      const { error } = await supabase
        .from('pairings')
        .insert(newPairings);

      if (error) throw error;

      // Update side counts for teams - fetch current counts and increment
      for (const pairing of generated) {
        if (!pairing.flags.includes('bye') && pairing.negTeamId) {
          // Get current aff team data
          const { data: affTeam } = await supabase
            .from('tournament_registrations')
            .select('aff_count')
            .eq('id', pairing.affTeamId)
            .single();
          
          if (affTeam) {
            await supabase
              .from('tournament_registrations')
              .update({ aff_count: (affTeam.aff_count || 0) + 1 })
              .eq('id', pairing.affTeamId);
          }
          
          // Get current neg team data
          const { data: negTeam } = await supabase
            .from('tournament_registrations')
            .select('neg_count')
            .eq('id', pairing.negTeamId)
            .single();
          
          if (negTeam) {
            await supabase
              .from('tournament_registrations')
              .update({ neg_count: (negTeam.neg_count || 0) + 1 })
              .eq('id', pairing.negTeamId);
          }
        }
      }

      toast({
        title: "Success",
        description: `Generated ${generated.length} pairings using ${settings.draw_method} method`,
      });

      setShowPreview(false);
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

  // Confirm and save previewed pairings
  const confirmPairings = async () => {
    await generateAdvancedPairings(false);
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

  const getTeamName = (regId: string): string => {
    const reg = registrations.find((r: any) => r.id === regId);
    return reg?.participant_name || 'Unknown';
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
                    onClick={() => generateAdvancedPairings(false)}
                    disabled={loading || registrations.length < 2}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generate Pairings
                  </Button>
                )}
                
                {pairings.length > 0 && (
                  <>
                    <Button
                      onClick={releaseAllPairings}
                      disabled={loading}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Release All
                    </Button>
                    <Button
                      onClick={() => {
                        const url = `/admin/print/${tournamentId}/${selectedRound}`;
                        window.open(url, '_blank');
                      }}
                      variant="outline"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Postings
                    </Button>
                  </>
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
                  <Button onClick={() => generateAdvancedPairings(false)} className="mt-4" disabled={loading}>
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
                          {pairing.aff_registration?.participant_name || getTeamName(pairing.aff_registration_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {pairing.neg_registration?.participant_name || getTeamName(pairing.neg_registration_id)}
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
                          {pairing.flags && pairing.flags.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {pairing.flags.join(', ')}
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
