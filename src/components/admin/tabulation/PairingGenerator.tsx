import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  Calendar,
  Printer,
  Pencil,
  Trash2,
  Wand2
} from 'lucide-react';
import { DrawGenerator, Team, PairingHistory, DrawSettings, GeneratedPairing } from '@/lib/tabulation/drawGenerator';
import { JudgeAllocator, JudgeInfo, PairingInfo, JudgeConflict, JudgeAssignment } from '@/lib/tabulation/judgeAllocator';
import { JudgeAutoAssignModal } from './JudgeAutoAssignModal';
import { ManualPairingEditor } from './ManualPairingEditor';

interface PairingGeneratorProps {
  tournamentId: string;
  rounds: any[];
  registrations: any[];
  judges: any[];
  onRoundsUpdate: () => void;
  onToggleRoundLock: (roundId: string, locked: boolean) => void;
  eventId?: string | null;
  formatKey?: string | null;
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
  onToggleRoundLock,
  eventId,
  formatKey
}: PairingGeneratorProps) {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isEditingRound, setIsEditingRound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<TabulationSettings | null>(null);
  const [previewPairings, setPreviewPairings] = useState<GeneratedPairing[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [newRound, setNewRound] = useState({
    name: '',
    scheduled_date: '',
    round_number: rounds.length + 1
  });
  const [editRound, setEditRound] = useState({
    id: '',
    name: '',
    scheduled_date: '',
    round_number: 1,
    status: 'upcoming'
  });

  // Auto-assign judges state
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [proposedAssignments, setProposedAssignments] = useState<JudgeAssignment[]>([]);
  const [assignmentSummary, setAssignmentSummary] = useState<{
    totalAssigned: number;
    conflictCount: number;
    unassignedPairings: string[];
    warnings: string[];
  } | null>(null);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);

  // Track rounds with released pairings for Print Postings button
  const [roundsWithReleasedPairings, setRoundsWithReleasedPairings] = useState<string[]>([]);

  // Judge conflicts for inline editor
  const [judgeConflicts, setJudgeConflicts] = useState<{ judge_profile_id: string; type: 'team' | 'school'; registration_id?: string; school_name?: string }[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchRoundsWithReleasedPairings();
    fetchJudgeConflicts();
  }, [tournamentId]);

  useEffect(() => {
    if (selectedRound) {
      fetchPairings();
    }
  }, [selectedRound]);

  const fetchRoundsWithReleasedPairings = async () => {
    try {
      const { data, error } = await supabase
        .from('pairings')
        .select('round_id')
        .eq('tournament_id', tournamentId)
        .eq('released', true);

      if (error) {
        console.error('[PairingGenerator] Error fetching released pairings:', error);
        return;
      }

      const uniqueRoundIds = [...new Set(data?.map(p => p.round_id) || [])];
      setRoundsWithReleasedPairings(uniqueRoundIds);
      console.log('[PairingGenerator] Rounds with released pairings:', uniqueRoundIds.length);
    } catch (error) {
      console.error('[PairingGenerator] Error:', error);
    }
  };

  const fetchJudgeConflicts = async () => {
    try {
      // Fetch team conflicts
      const { data: teamConflicts, error: teamError } = await supabase
        .from('judge_team_conflicts')
        .select('judge_profile_id, registration_id, conflict_type')
        .eq('tournament_id', tournamentId);

      if (teamError) {
        console.error('[PairingGenerator] Error fetching team conflicts:', teamError);
      }

      // Fetch school conflicts
      const { data: schoolConflicts, error: schoolError } = await supabase
        .from('judge_school_conflicts')
        .select('judge_profile_id, school_name, conflict_type')
        .eq('tournament_id', tournamentId);

      if (schoolError) {
        console.error('[PairingGenerator] Error fetching school conflicts:', schoolError);
      }

      const conflicts: { judge_profile_id: string; type: 'team' | 'school'; registration_id?: string; school_name?: string }[] = [];

      (teamConflicts || []).forEach(c => {
        conflicts.push({
          judge_profile_id: c.judge_profile_id,
          type: 'team',
          registration_id: c.registration_id
        });
      });

      (schoolConflicts || []).forEach(c => {
        conflicts.push({
          judge_profile_id: c.judge_profile_id,
          type: 'school',
          school_name: c.school_name
        });
      });

      setJudgeConflicts(conflicts);
    } catch (error) {
      console.error('[PairingGenerator] Error:', error);
    }
  };

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
      // Fetch pairings without judge_profiles to avoid RLS issues
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          aff_registration:tournament_registrations!aff_registration_id(participant_name, school_organization),
          neg_registration:tournament_registrations!neg_registration_id(participant_name, school_organization)
        `)
        .eq('round_id', selectedRound)
        .order('room_rank', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // Fetch judge names separately for pairings that have judges assigned
      const judgeIds = [...new Set((data || []).map(p => p.judge_id).filter(Boolean))];
      let judgeMap: Record<string, string> = {};
      
      if (judgeIds.length > 0) {
        const { data: judgeData } = await supabase
          .from('judge_profiles')
          .select('id, name')
          .in('id', judgeIds);
        
        if (judgeData) {
          judgeMap = Object.fromEntries(judgeData.map(j => [j.id, j.name]));
        }
      }

      // Merge judge names into pairings
      const pairingsWithJudges = (data || []).map(p => ({
        ...p,
        judge_profiles: p.judge_id ? { name: judgeMap[p.judge_id] || 'Unknown' } : null
      }));

      setPairings(pairingsWithJudges);
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
          status: 'upcoming',
          event_id: eventId || null
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

  const openEditRound = (round: any) => {
    setEditRound({
      id: round.id,
      name: round.name,
      scheduled_date: round.scheduled_date ? round.scheduled_date.split('T')[0] : '',
      round_number: round.round_number,
      status: round.status
    });
    setIsEditingRound(true);
  };

  const updateRound = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('rounds')
        .update({
          name: editRound.name,
          round_number: editRound.round_number,
          scheduled_date: editRound.scheduled_date || null,
          status: editRound.status
        })
        .eq('id', editRound.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round updated successfully",
      });

      setIsEditingRound(false);
      onRoundsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update round",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRound = async (roundId: string) => {
    try {
      setLoading(true);
      
      // First delete all pairings for this round
      const { error: pairingsError } = await supabase
        .from('pairings')
        .delete()
        .eq('round_id', roundId);

      if (pairingsError) throw pairingsError;

      // Then delete the round
      const { error } = await supabase
        .from('rounds')
        .delete()
        .eq('id', roundId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round deleted successfully",
      });

      if (selectedRound === roundId) {
        setSelectedRound('');
        setPairings([]);
      }
      onRoundsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete round",
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

      // Get all pairings for this round to create notifications
      const { data: releasedPairings } = await supabase
        .from('pairings')
        .select('id, aff_registration_id, neg_registration_id, room, scheduled_time')
        .eq('round_id', selectedRound);

      // Get round name
      const round = rounds.find(r => r.id === selectedRound);

      // Create notifications for all competitors
      const notifications: any[] = [];
      for (const pairing of releasedPairings || []) {
        // Notification for aff team
        if (pairing.aff_registration_id) {
          notifications.push({
            registration_id: pairing.aff_registration_id,
            tournament_id: tournamentId,
            pairing_id: pairing.id,
            round_id: selectedRound,
            title: `${round?.name || 'Round'} Pairing Released`,
            message: `Your pairing has been released. Room: ${pairing.room || 'TBA'}`,
            type: 'pairing_released'
          });
        }
        // Notification for neg team
        if (pairing.neg_registration_id && pairing.neg_registration_id !== pairing.aff_registration_id) {
          notifications.push({
            registration_id: pairing.neg_registration_id,
            tournament_id: tournamentId,
            pairing_id: pairing.id,
            round_id: selectedRound,
            title: `${round?.name || 'Round'} Pairing Released`,
            message: `Your pairing has been released. Room: ${pairing.room || 'TBA'}`,
            type: 'pairing_released'
          });
        }
      }

      // Insert notifications
      if (notifications.length > 0) {
        await supabase.from('competitor_notifications').insert(notifications);
      }

      toast({
        title: "Success",
        description: "All pairings released and competitors notified",
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

  // Auto-assign judges using the Hungarian algorithm
  const runAutoAssignJudges = async () => {
    if (!selectedRound || pairings.length === 0) return;

    try {
      setAutoAssignLoading(true);

      // Get tournament settings
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('judges_per_room')
        .eq('id', tournamentId)
        .single();

      const judgesPerRoom = tournament?.judges_per_room || 1;
      const currentRound = rounds.find(r => r.id === selectedRound);
      const roundDate = currentRound?.scheduled_date || undefined;

      // Get judge conflicts
      const { data: teamConflicts } = await supabase
        .from('judge_team_conflicts')
        .select('judge_profile_id, registration_id, conflict_type')
        .eq('tournament_id', tournamentId);

      const { data: schoolConflicts } = await supabase
        .from('judge_school_conflicts')
        .select('judge_profile_id, school_name, conflict_type')
        .eq('tournament_id', tournamentId);

      // Get judge availability if date is set
      let availabilityMap: Map<string, string[]> = new Map();
      if (roundDate) {
        const { data: availability } = await supabase
          .from('judge_availability')
          .select('judge_profile_id, available_dates')
          .eq('tournament_id', tournamentId);

        availability?.forEach(a => {
          const dates = Array.isArray(a.available_dates) ? a.available_dates : [];
          availabilityMap.set(a.judge_profile_id, dates.map(String));
        });
      }

      // Transform judges to JudgeInfo format
      const judgeInfos: JudgeInfo[] = judges.map(j => ({
        id: j.id,
        name: j.name,
        experienceYears: j.experience_years || 0,
        availableDates: availabilityMap.get(j.id) || [],
        institution: undefined, // Could fetch from profiles if needed
        specializations: j.specializations || []
      }));

      // Transform pairings to PairingInfo format
      const pairingInfos: PairingInfo[] = pairings.map(p => ({
        id: p.id,
        affTeamId: p.aff_registration_id,
        negTeamId: p.neg_registration_id,
        affInstitution: (p.aff_registration as any)?.school_organization,
        negInstitution: (p.neg_registration as any)?.school_organization,
        scheduledTime: p.scheduled_time,
        roomRank: p.room_rank
      }));

      // Transform conflicts to JudgeConflict format
      const judgeConflicts: JudgeConflict[] = [];
      
      teamConflicts?.forEach(c => {
        judgeConflicts.push({
          judgeId: c.judge_profile_id,
          teamId: c.registration_id,
          conflictType: c.conflict_type === 'team' ? 'team' : 'personal'
        });
      });

      schoolConflicts?.forEach(c => {
        judgeConflicts.push({
          judgeId: c.judge_profile_id,
          institution: c.school_name,
          conflictType: 'institution'
        });
      });

      // Run the allocator
      const allocator = new JudgeAllocator({
        judges: judgeInfos,
        pairings: pairingInfos,
        conflicts: judgeConflicts,
        judgesPerRoom,
        roundDate,
        formatKey
      });

      const assignments = allocator.allocate();
      const summary = allocator.getSummary(assignments);

      setProposedAssignments(assignments);
      setAssignmentSummary(summary);
      setShowAutoAssignModal(true);

    } catch (error: any) {
      console.error('Auto-assign error:', error);
      toast({
        title: "Error",
        description: "Failed to generate judge assignments",
        variant: "destructive",
      });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  // Apply auto-assigned judges to database
  const applyJudgeAssignments = async (assignments: JudgeAssignment[]) => {
    try {
      setAutoAssignLoading(true);

      // Get tournament settings for judges_per_room
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('judges_per_room')
        .eq('id', tournamentId)
        .single();

      const judgesPerRoom = tournament?.judges_per_room || 1;

      // Group assignments by pairing
      const assignmentsByPairing = new Map<string, JudgeAssignment[]>();
      for (const assignment of assignments) {
        const existing = assignmentsByPairing.get(assignment.pairingId) || [];
        existing.push(assignment);
        assignmentsByPairing.set(assignment.pairingId, existing);
      }

      // Process each pairing
      for (const [pairingId, pairingAssignments] of assignmentsByPairing) {
        if (pairingAssignments.length === 0) continue;

        // First judge becomes the main judge
        const mainJudge = pairingAssignments[0];
        await supabase
          .from('pairings')
          .update({ judge_id: mainJudge.judgeId })
          .eq('id', pairingId);

        // Additional judges go to panel assignments (if multi-judge)
        if (judgesPerRoom > 1 && pairingAssignments.length > 1) {
          const panelAssignments = pairingAssignments.slice(1).map((a, index) => ({
            pairing_id: pairingId,
            judge_profile_id: a.judgeId,
            role: index === 0 ? 'chair' : 'wing',
            status: 'assigned'
          }));

          await supabase
            .from('pairing_judge_assignments')
            .insert(panelAssignments);
        }

        // Create notification for judge
        await supabase
          .from('judge_notifications')
          .insert({
            judge_profile_id: mainJudge.judgeId,
            tournament_id: tournamentId,
            pairing_id: pairingId,
            title: 'New Judging Assignment',
            message: `You have been assigned to judge a debate.`,
            type: 'assignment'
          });
      }

      toast({
        title: "Success",
        description: `Applied ${assignments.length} judge assignments`,
      });

      setShowAutoAssignModal(false);
      fetchPairings();
    } catch (error: any) {
      console.error('Apply assignments error:', error);
      toast({
        title: "Error",
        description: "Failed to apply judge assignments",
        variant: "destructive",
      });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  // Handle manual override in modal
  const handleAssignmentOverride = (pairingId: string, judgeId: string, judgeName: string) => {
    setProposedAssignments(prev => {
      const filtered = prev.filter(a => a.pairingId !== pairingId);
      return [...filtered, { pairingId, judgeId, judgeName, cost: 0, hasConflict: false }];
    });
  };

  const getTeamName = (regId: string): string => {
    const reg = registrations.find((r: any) => r.id === regId);
    return reg?.participant_name || 'Unknown';
  };

  const selectedRoundData = rounds.find(r => r.id === selectedRound);

  // Get rounds that have released pairings for the dropdown
  const printableRounds = rounds.filter(r => roundsWithReleasedPairings.includes(r.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pairing Generator</h2>
          <p className="text-muted-foreground">Create rounds and manage pairings for debates</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Print Postings - Top Level Button */}
          {printableRounds.length > 0 && (
            <Select onValueChange={(roundId) => {
              window.open(`/admin/print/${tournamentId}/${roundId}`, '_blank');
            }}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Postings
                </div>
              </SelectTrigger>
              <SelectContent>
                {printableRounds.map(round => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.name}
                  </SelectItem>
                ))}
                <SelectItem value="__all__" disabled>
                  ── All Rounds ──
                </SelectItem>
              </SelectContent>
            </Select>
          )}

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

      {/* Edit Round Dialog */}
      <Dialog open={isEditingRound} onOpenChange={setIsEditingRound}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Round</DialogTitle>
            <DialogDescription>
              Update round details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-round-name">Round Name</Label>
              <Input
                id="edit-round-name"
                value={editRound.name}
                onChange={(e) => setEditRound({...editRound, name: e.target.value})}
                placeholder="e.g., Round 1, Quarterfinals"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-round-number">Round Number</Label>
              <Input
                id="edit-round-number"
                type="number"
                value={editRound.round_number}
                onChange={(e) => setEditRound({...editRound, round_number: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-scheduled-date">Scheduled Date (Optional)</Label>
              <Input
                id="edit-scheduled-date"
                type="date"
                value={editRound.scheduled_date}
                onChange={(e) => setEditRound({...editRound, scheduled_date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={editRound.status} 
                onValueChange={(value) => setEditRound({...editRound, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingRound(false)}>
              Cancel
            </Button>
            <Button onClick={updateRound} disabled={loading || !editRound.name}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Round Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Round Management</CardTitle>
          <CardDescription>Select a round to manage pairings, or edit/delete existing rounds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rounds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pairings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((round) => (
                  <TableRow 
                    key={round.id} 
                    className={selectedRound === round.id ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <div className="font-medium">{round.name}</div>
                      <div className="text-sm text-muted-foreground">Round {round.round_number}</div>
                    </TableCell>
                    <TableCell>
                      {round.scheduled_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(round.scheduled_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={round.status === 'locked' ? 'destructive' : round.status === 'completed' ? 'default' : 'secondary'}>
                        {round.status === 'locked' && <Lock className="h-3 w-3 mr-1" />}
                        {round.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={selectedRound === round.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRound(selectedRound === round.id ? '' : round.id)}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {selectedRound === round.id ? 'Hide' : 'View'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditRound(round)}
                          disabled={round.status === 'locked'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={round.status === 'locked'}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Round</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{round.name}"? This will also delete all pairings associated with this round. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteRound(round.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Round
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleRoundLock(round.id, round.status !== 'locked')}
                        >
                          {round.status === 'locked' ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rounds created yet</p>
              <p className="text-sm">Create your first round to start generating pairings</p>
            </div>
          )}

          {selectedRoundData && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
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
                    {pairings.some(p => !p.judge_id) && selectedRoundData.status !== 'locked' && (
                      <Button
                        onClick={runAutoAssignJudges}
                        disabled={autoAssignLoading || judges.length === 0}
                        variant="outline"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {autoAssignLoading ? 'Assigning...' : 'Auto-Assign Judges'}
                      </Button>
                    )}
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pairings Editor */}
      {selectedRound && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pairings ({pairings.length})
            </CardTitle>
            <CardDescription>
              Click any cell to edit inline. Changes are saved automatically with edit history tracking.
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
              <ManualPairingEditor
                pairings={pairings.map(p => ({
                  id: p.id,
                  round_id: p.round_id,
                  aff_registration_id: p.aff_registration_id,
                  neg_registration_id: p.neg_registration_id,
                  judge_id: p.judge_id || null,
                  room: p.room || null,
                  scheduled_time: p.scheduled_time || null,
                  status: p.status,
                  released: p.released,
                  bracket: p.bracket || null
                }))}
                registrations={registrations.map((r: any) => ({
                  id: r.id,
                  participant_name: r.participant_name,
                  partner_name: r.partner_name,
                  school_organization: r.school_organization
                }))}
                judges={judges.map((j: any) => ({
                  id: j.id,
                  name: j.name,
                  email: j.email,
                  experience_level: j.experience_level || 'novice',
                  specializations: j.specializations || [],
                  alumni: j.alumni || false
                }))}
                conflicts={judgeConflicts}
                roundId={selectedRound}
                onPairingsChange={(updated) => {
                  setPairings(updated.map(u => {
                    const existing = pairings.find(p => p.id === u.id);
                    return {
                      ...existing,
                      ...u,
                      aff_registration: existing?.aff_registration,
                      neg_registration: existing?.neg_registration,
                      judge_profiles: existing?.judge_profiles
                    } as Pairing;
                  }));
                }}
                onRefresh={fetchPairings}
                onReleaseToggle={async (pairingId, released) => {
                  await togglePairingRelease(pairingId, !released);
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-Assign Judges Modal */}
      <JudgeAutoAssignModal
        open={showAutoAssignModal}
        onOpenChange={setShowAutoAssignModal}
        assignments={proposedAssignments}
        summary={assignmentSummary || { totalAssigned: 0, conflictCount: 0, unassignedPairings: [], warnings: [] }}
        pairings={pairings}
        judges={judges}
        onApply={applyJudgeAssignments}
        onOverride={handleAssignmentOverride}
        loading={autoAssignLoading}
      />
    </div>
  );
}
