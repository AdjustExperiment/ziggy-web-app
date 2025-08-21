
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Shuffle, Play, Lock, Unlock, Trash2, Settings } from 'lucide-react';
import { generatePowerMatchPairings, calculateStandings, PairingConstraints, PairingOptions } from '@/utils/pairingAlgorithms';
import { Registration, JudgeProfile, Round } from '@/types/database';

interface PairingGeneratorProps {
  tournamentId: string;
  rounds: Round[];
  registrations: Registration[];
  judges: JudgeProfile[];
  onRoundsUpdate: () => void;
  onToggleRoundLock: (roundId: string, locked: boolean) => void;
}

export function PairingGenerator({
  tournamentId,
  rounds,
  registrations,
  judges,
  onRoundsUpdate,
  onToggleRoundLock
}: PairingGeneratorProps) {
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [pairingOptions, setPairingOptions] = useState<PairingOptions>({
    method: 'high_high',
    clubProtect: true,
    avoidRematches: true
  });
  const [pairings, setPairings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [constraints, setConstraints] = useState<PairingConstraints>({
    teamConflicts: new Map(),
    judgeTeamConflicts: new Map(),
    judgeSchoolConflicts: new Map(),
    avoidRematches: true,
    clubProtect: true
  });

  useEffect(() => {
    if (selectedRound) {
      fetchRoundPairings();
      loadConstraints();
    }
  }, [selectedRound]);

  const fetchRoundPairings = async () => {
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
        .order('created_at');

      if (error) throw error;
      setPairings(data || []);
    } catch (error: any) {
      console.error('Error fetching pairings:', error);
    }
  };

  const loadConstraints = async () => {
    try {
      // Load team conflicts
      const { data: teamConflicts } = await supabase
        .from('team_conflicts')
        .select('*')
        .eq('tournament_id', tournamentId);

      // Load judge-team conflicts
      const { data: judgeTeamConflicts } = await supabase
        .from('judge_team_conflicts')
        .select('*')
        .eq('tournament_id', tournamentId);

      // Load judge-school conflicts
      const { data: judgeSchoolConflicts } = await supabase
        .from('judge_school_conflicts')
        .select('*')
        .eq('tournament_id', tournamentId);

      // Build constraint maps
      const teamConflictMap = new Map<string, Set<string>>();
      teamConflicts?.forEach(conflict => {
        if (!teamConflictMap.has(conflict.registration_id)) {
          teamConflictMap.set(conflict.registration_id, new Set());
        }
        teamConflictMap.get(conflict.registration_id)?.add(conflict.cannot_face_registration_id);
      });

      const judgeTeamConflictMap = new Map<string, Set<string>>();
      judgeTeamConflicts?.forEach(conflict => {
        if (!judgeTeamConflictMap.has(conflict.judge_profile_id)) {
          judgeTeamConflictMap.set(conflict.judge_profile_id, new Set());
        }
        judgeTeamConflictMap.get(conflict.judge_profile_id)?.add(conflict.registration_id);
      });

      const judgeSchoolConflictMap = new Map<string, Set<string>>();
      judgeSchoolConflicts?.forEach(conflict => {
        if (!judgeSchoolConflictMap.has(conflict.judge_profile_id)) {
          judgeSchoolConflictMap.set(conflict.judge_profile_id, new Set());
        }
        judgeSchoolConflictMap.get(conflict.judge_profile_id)?.add(conflict.school_name);
      });

      setConstraints({
        teamConflicts: teamConflictMap,
        judgeTeamConflicts: judgeTeamConflictMap,
        judgeSchoolConflicts: judgeSchoolConflictMap,
        avoidRematches: pairingOptions.avoidRematches,
        clubProtect: pairingOptions.clubProtect
      });
    } catch (error: any) {
      console.error('Error loading constraints:', error);
    }
  };

  const generatePairings = async () => {
    if (!selectedRound) {
      toast({
        title: "Error",
        description: "Please select a round",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get previous pairings for rematch avoidance
      const { data: allPairings } = await supabase
        .from('pairings')
        .select('aff_registration_id, neg_registration_id')
        .eq('tournament_id', tournamentId)
        .neq('round_id', selectedRound);

      const previousPairings = allPairings?.map(p => ({
        aff: p.aff_registration_id,
        neg: p.neg_registration_id
      })) || [];

      // Calculate current standings
      const { data: existingPairings } = await supabase
        .from('pairings')
        .select('aff_registration_id, neg_registration_id, result')
        .eq('tournament_id', tournamentId);

      const standings = calculateStandings(registrations, existingPairings || []);

      // Generate new pairings
      const newPairings = generatePowerMatchPairings(
        standings,
        judges,
        constraints,
        pairingOptions,
        previousPairings
      );

      // Create pairing run record
      const { data: runData, error: runError } = await supabase
        .from('round_pairing_runs')
        .insert({
          tournament_id: tournamentId,
          round_id: selectedRound,
          method: pairingOptions.method,
          params: pairingOptions,
          summary: `Generated ${newPairings.length} pairings using ${pairingOptions.method} method`
        })
        .select()
        .single();

      if (runError) throw runError;

      // Insert pairings into database
      const pairingInserts = newPairings.map(pairing => ({
        tournament_id: tournamentId,
        round_id: selectedRound,
        aff_registration_id: pairing.affRegistrationId,
        neg_registration_id: pairing.negRegistrationId,
        judge_id: pairing.judgeId || null,
        room: pairing.room || null,
        generated_by_run_id: runData.id
      }));

      const { error: insertError } = await supabase
        .from('pairings')
        .insert(pairingInserts);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `Generated ${newPairings.length} pairings successfully`,
      });

      fetchRoundPairings();
    } catch (error: any) {
      console.error('Error generating pairings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate pairings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearPairings = async () => {
    if (!selectedRound) return;

    try {
      const { error } = await supabase
        .from('pairings')
        .delete()
        .eq('round_id', selectedRound);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pairings cleared successfully",
      });

      fetchRoundPairings();
    } catch (error: any) {
      console.error('Error clearing pairings:', error);
      toast({
        title: "Error",
        description: "Failed to clear pairings",
        variant: "destructive",
      });
    }
  };

  const selectedRoundData = rounds.find(r => r.id === selectedRound);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Pairing Generator
          </CardTitle>
          <CardDescription>
            Generate automated pairings using power-matching algorithms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Round</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger>
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map(round => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.name} {round.locked && '🔒'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pairing Method</Label>
              <Select
                value={pairingOptions.method}
                onValueChange={(value: any) => setPairingOptions(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_high">High-High</SelectItem>
                  <SelectItem value="high_low">High-Low</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="club-protect"
                checked={pairingOptions.clubProtect}
                onCheckedChange={(checked) => setPairingOptions(prev => ({ ...prev, clubProtect: checked }))}
              />
              <Label htmlFor="club-protect">Club Protect</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="avoid-rematches"
                checked={pairingOptions.avoidRematches}
                onCheckedChange={(checked) => setPairingOptions(prev => ({ ...prev, avoidRematches: checked }))}
              />
              <Label htmlFor="avoid-rematches">Avoid Rematches</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generatePairings}
              disabled={!selectedRound || loading || selectedRoundData?.locked}
              className="flex-1"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Generate Pairings
            </Button>
            <Button
              variant="outline"
              onClick={clearPairings}
              disabled={!selectedRound || selectedRoundData?.locked}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            {selectedRoundData && (
              <Button
                variant="outline"
                onClick={() => onToggleRoundLock(selectedRound, selectedRoundData.locked)}
              >
                {selectedRoundData.locked ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedRound && (
        <Card>
          <CardHeader>
            <CardTitle>Current Pairings</CardTitle>
            <CardDescription>
              {pairings.length} pairings for {selectedRoundData?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pairings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pairings generated yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pairings.map((pairing, index) => (
                  <Card key={pairing.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Badge variant="outline" className="mb-2">AFF</Badge>
                          <p className="font-medium">{pairing.aff_registration?.participant_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pairing.aff_registration?.school_organization || 'Independent'}
                          </p>
                        </div>
                        <div>
                          <Badge variant="secondary" className="mb-2">NEG</Badge>
                          <p className="font-medium">{pairing.neg_registration?.participant_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pairing.neg_registration?.school_organization || 'Independent'}
                          </p>
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-2">Judge</Badge>
                          <p className="font-medium">{pairing.judge_profiles?.name || 'TBD'}</p>
                          <p className="text-sm text-muted-foreground">
                            Room: {pairing.room || 'TBD'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
