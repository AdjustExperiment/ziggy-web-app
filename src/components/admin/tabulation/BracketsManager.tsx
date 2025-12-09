import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Users, 
  Play, 
  Settings, 
  Target,
  ArrowRight,
  Crown,
  Medal,
  ChevronRight,
  RefreshCw,
  Download,
  Edit2,
  Check
} from 'lucide-react';

interface BracketsManagerProps {
  tournamentId: string;
  rounds: any[];
  registrations: any[];
}

interface EliminationSeed {
  id: string;
  registration_id: string;
  seed: number;
  team_name?: string;
  school?: string;
  wins?: number;
}

interface BracketMatch {
  id: string;
  round_name: string;
  round_number: number;
  seed_aff: number;
  seed_neg: number;
  aff_team?: string;
  neg_team?: string;
  winner?: 'aff' | 'neg';
  advances_to?: string;
}

export function BracketsManager({ tournamentId, rounds, registrations }: BracketsManagerProps) {
  const { toast } = useToast();
  const [bracketType, setBracketType] = useState<'single' | 'double'>('single');
  const [bracketSize, setBracketSize] = useState<number>(8);
  const [loading, setLoading] = useState(false);
  const [seeds, setSeeds] = useState<EliminationSeed[]>([]);
  const [showSeedingDialog, setShowSeedingDialog] = useState(false);
  const [editingSeed, setEditingSeed] = useState<{ id: string; seed: number } | null>(null);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const availableSizes = [4, 8, 16, 32];

  useEffect(() => {
    fetchSeeds();
    fetchBracketPairings();
  }, [tournamentId]);

  const fetchSeeds = async () => {
    const { data } = await (supabase
      .from('elimination_seeds' as any)
      .select(`
        *,
        registration:tournament_registrations(
          participant_name,
          school_organization
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true }) as any);

    if (data) {
      setSeeds(data.map((s: any) => ({
        ...s,
        team_name: s.registration?.participant_name,
        school: s.registration?.school_organization
      })));
    }
  };

  const fetchBracketPairings = async () => {
    const { data } = await (supabase
      .from('pairings')
      .select(`
        *,
        round:rounds(name, round_number),
        aff_registration:tournament_registrations!aff_registration_id(participant_name),
        neg_registration:tournament_registrations!neg_registration_id(participant_name)
      `)
      .eq('tournament_id', tournamentId)
      .eq('is_elimination', true) as any)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setHasGenerated(true);
      setBracketMatches(data.map((p: any) => ({
        id: p.id,
        round_name: p.round?.name || 'Unknown',
        round_number: p.round?.round_number || 0,
        seed_aff: p.seed_aff || 0,
        seed_neg: p.seed_neg || 0,
        aff_team: p.aff_registration?.participant_name,
        neg_team: p.neg_registration?.participant_name,
        winner: p.result?.winner,
        advances_to: p.advances_to_pairing_id
      })));
    }
  };

  // Auto-generate seeds from standings
  const autoGenerateSeeds = async () => {
    try {
      setLoading(true);

      // Fetch standings
      const { data: standings } = await (supabase
        .from('tournament_standings' as any)
        .select(`
          *,
          registration:tournament_registrations(id, participant_name, school_organization)
        `)
        .eq('tournament_id', tournamentId)
        .order('wins', { ascending: false })
        .limit(bracketSize) as any);

      if (!standings || standings.length === 0) {
        // Fallback: use registrations sorted by wins from pairings
        const topTeams = registrations
          .slice(0, bracketSize)
          .map((reg, index) => ({
            registration_id: reg.id,
            seed: index + 1
          }));

        // Clear existing seeds
        await (supabase.from('elimination_seeds' as any).delete().eq('tournament_id', tournamentId) as any);

        // Insert new seeds
        const { error } = await (supabase.from('elimination_seeds' as any).insert(
          topTeams.map(t => ({
            tournament_id: tournamentId,
            registration_id: t.registration_id,
            seed: t.seed
          }))
        ) as any);

        if (error) throw error;
      } else {
        // Clear existing seeds
        await (supabase.from('elimination_seeds' as any).delete().eq('tournament_id', tournamentId) as any);

        // Insert from standings
        const { error } = await (supabase.from('elimination_seeds' as any).insert(
          standings.map((s: any, index: number) => ({
            tournament_id: tournamentId,
            registration_id: s.registration_id,
            seed: index + 1
          }))
        ) as any);

        if (error) throw error;
      }

      toast({ title: "Success", description: `Generated ${bracketSize} seeds from standings` });
      fetchSeeds();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Update individual seed
  const updateSeed = async () => {
    if (!editingSeed) return;

    try {
      const { error } = await (supabase
        .from('elimination_seeds' as any) as any)
        .update({ seed: editingSeed.seed })
        .eq('id', editingSeed.id);

      if (error) throw error;

      toast({ title: "Updated", description: "Seed position updated" });
      setEditingSeed(null);
      fetchSeeds();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Generate bracket structure
  const generateBracket = async () => {
    if (seeds.length < bracketSize) {
      toast({ 
        title: "Error", 
        description: `Need ${bracketSize} seeds, only have ${seeds.length}. Generate seeds first.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Calculate rounds needed
      const roundCount = Math.log2(bracketSize);
      const roundNames = getRoundNames(bracketSize);

      // Create elimination rounds
      for (let i = 0; i < roundCount; i++) {
        const roundName = roundNames[i];
        const roundNumber = rounds.length + i + 1;

        await (supabase.from('rounds').insert({
          tournament_id: tournamentId,
          name: roundName,
          round_number: roundNumber,
          status: 'upcoming'
        } as any) as any);
      }

      // Fetch newly created rounds
      const { data: elimRounds } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('is_elimination', true)
        .order('round_number', { ascending: true });

      if (!elimRounds || elimRounds.length === 0) throw new Error('Failed to create rounds');

      // Generate first round pairings using proper bracket seeding
      const firstRoundPairings = generateFirstRoundPairings(seeds);
      const firstRound = elimRounds[0];

      const pairingInserts = firstRoundPairings.map((match, index) => ({
        tournament_id: tournamentId,
        round_id: firstRound.id,
        aff_registration_id: match.higher.registration_id,
        neg_registration_id: match.lower.registration_id,
        seed_aff: match.higher.seed,
        seed_neg: match.lower.seed,
        room: `Room ${index + 1}`,
        status: 'scheduled',
        is_elimination: true,
        released: false
      }));

      const { error } = await supabase.from('pairings').insert(pairingInserts);
      if (error) throw error;

      toast({ 
        title: "Success", 
        description: `Created ${roundCount} elimination rounds with ${bracketSize / 2} first-round matches` 
      });

      setHasGenerated(true);
      fetchBracketPairings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Get proper round names
  const getRoundNames = (size: number): string[] => {
    const names: string[] = [];
    if (size >= 32) names.push('Round of 32');
    if (size >= 16) names.push('Octofinals');
    if (size >= 8) names.push('Quarterfinals');
    if (size >= 4) names.push('Semifinals');
    names.push('Finals');
    return names.slice(-(Math.log2(size)));
  };

  // Generate proper bracket pairings (1v16, 8v9, 4v13, 5v12, 2v15, 7v10, 3v14, 6v11)
  const generateFirstRoundPairings = (seededTeams: EliminationSeed[]) => {
    const size = seededTeams.length;
    const pairings: { higher: EliminationSeed; lower: EliminationSeed }[] = [];
    
    // Standard bracket order
    const bracketOrder = getBracketOrder(size);
    
    for (const [highSeed, lowSeed] of bracketOrder) {
      const higher = seededTeams.find(s => s.seed === highSeed);
      const lower = seededTeams.find(s => s.seed === lowSeed);
      if (higher && lower) {
        pairings.push({ higher, lower });
      }
    }

    return pairings;
  };

  // Get standard bracket pairing order
  const getBracketOrder = (size: number): [number, number][] => {
    if (size === 4) return [[1, 4], [2, 3]];
    if (size === 8) return [[1, 8], [4, 5], [2, 7], [3, 6]];
    if (size === 16) return [
      [1, 16], [8, 9], [4, 13], [5, 12],
      [2, 15], [7, 10], [3, 14], [6, 11]
    ];
    if (size === 32) return [
      [1, 32], [16, 17], [8, 25], [9, 24],
      [4, 29], [13, 20], [5, 28], [12, 21],
      [2, 31], [15, 18], [7, 26], [10, 23],
      [3, 30], [14, 19], [6, 27], [11, 22]
    ];
    return [];
  };

  // Group matches by round for visualization
  const matchesByRound = useMemo(() => {
    const grouped = new Map<string, BracketMatch[]>();
    bracketMatches.forEach(match => {
      const existing = grouped.get(match.round_name) || [];
      existing.push(match);
      grouped.set(match.round_name, existing);
    });
    return grouped;
  }, [bracketMatches]);

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Bracket Configuration
          </CardTitle>
          <CardDescription>
            Set up elimination brackets for tournament finals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bracket Type</Label>
              <Select value={bracketType} onValueChange={(v: any) => setBracketType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Elimination</SelectItem>
                  <SelectItem value="double" disabled>Double Elimination (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Bracket Size</Label>
              <Select value={bracketSize.toString()} onValueChange={(v) => setBracketSize(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} Teams ({getRoundNames(size).join(' → ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button 
              onClick={autoGenerateSeeds} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Auto-Generate Seeds
            </Button>
            
            <Button onClick={() => setShowSeedingDialog(true)} variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Seeds ({seeds.length})
            </Button>

            <Button 
              onClick={generateBracket} 
              disabled={loading || seeds.length < bracketSize || hasGenerated}
            >
              <Play className="h-4 w-4 mr-2" />
              Generate Bracket
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
              <Users className="h-4 w-4" />
              <span>{registrations.length} registered, {seeds.length} seeded</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seeds Table */}
      {seeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Current Seeds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {seeds.slice(0, bracketSize).map((seed) => (
                <div 
                  key={seed.id}
                  className={`flex items-center gap-2 p-2 rounded border ${
                    seed.seed <= 4 ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <Badge variant={seed.seed <= 4 ? 'default' : 'secondary'} className="w-8 justify-center">
                    {seed.seed}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{seed.team_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{seed.school}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bracket Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Bracket
          </CardTitle>
          <CardDescription>
            Visual representation of the elimination bracket
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasGenerated ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bracket Generated</h3>
              <p className="text-muted-foreground mb-4">
                Configure your bracket settings, generate seeds, then click "Generate Bracket" to create matches.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-8 min-w-max p-4">
                {Array.from(matchesByRound.entries()).map(([roundName, matches], roundIndex) => (
                  <div key={roundName} className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold text-center border-b pb-2">
                      {roundName}
                    </h4>
                    <div 
                      className="flex flex-col gap-4"
                      style={{ paddingTop: `${roundIndex * 40}px` }}
                    >
                      {matches.map((match, idx) => (
                        <div 
                          key={match.id}
                          className="relative"
                          style={{ marginTop: idx > 0 ? `${roundIndex * 80}px` : 0 }}
                        >
                          <Card className="w-48">
                            <CardContent className="p-2 space-y-1">
                              <div className={`flex items-center justify-between p-1.5 rounded text-sm ${
                                match.winner === 'aff' ? 'bg-green-100 dark:bg-green-900/30' : ''
                              }`}>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="w-6 h-5 text-xs justify-center">
                                    {match.seed_aff}
                                  </Badge>
                                  <span className="truncate max-w-24">{match.aff_team || 'TBD'}</span>
                                </div>
                                {match.winner === 'aff' && <Crown className="h-3 w-3 text-green-600" />}
                              </div>
                              <div className={`flex items-center justify-between p-1.5 rounded text-sm ${
                                match.winner === 'neg' ? 'bg-green-100 dark:bg-green-900/30' : ''
                              }`}>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="w-6 h-5 text-xs justify-center">
                                    {match.seed_neg}
                                  </Badge>
                                  <span className="truncate max-w-24">{match.neg_team || 'TBD'}</span>
                                </div>
                                {match.winner === 'neg' && <Crown className="h-3 w-3 text-green-600" />}
                              </div>
                            </CardContent>
                          </Card>
                          {roundIndex < matchesByRound.size - 1 && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Champion placeholder */}
                {hasGenerated && (
                  <div className="flex flex-col justify-center">
                    <h4 className="text-sm font-semibold text-center border-b pb-2">
                      Champion
                    </h4>
                    <Card className="w-48 mt-4 border-2 border-primary">
                      <CardContent className="p-4 text-center">
                        <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                        <p className="text-sm font-medium">TBD</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seeding Dialog */}
      <Dialog open={showSeedingDialog} onOpenChange={setShowSeedingDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Seeds</DialogTitle>
            <DialogDescription>
              Manually adjust team seeding positions
            </DialogDescription>
          </DialogHeader>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Seed</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>School</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seeds.map((seed) => (
                <TableRow key={seed.id}>
                  <TableCell>
                    {editingSeed?.id === seed.id ? (
                      <Input
                        type="number"
                        min={1}
                        max={seeds.length}
                        value={editingSeed.seed}
                        onChange={(e) => setEditingSeed({ ...editingSeed, seed: parseInt(e.target.value) || 1 })}
                        className="w-16"
                      />
                    ) : (
                      <Badge>{seed.seed}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{seed.team_name}</TableCell>
                  <TableCell className="text-muted-foreground">{seed.school}</TableCell>
                  <TableCell>
                    {editingSeed?.id === seed.id ? (
                      <Button size="sm" onClick={updateSeed}>
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setEditingSeed({ id: seed.id, seed: seed.seed })}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeedingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
