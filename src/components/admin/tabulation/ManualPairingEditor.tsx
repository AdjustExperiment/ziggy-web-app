import React, { useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ArrowLeftRight, 
  Undo2, 
  Download, 
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  History
} from 'lucide-react';
import { InlineEditCell } from './InlineEditCell';
import { JudgeSearchDropdown } from './JudgeSearchDropdown';
import { useEditHistory } from '@/hooks/useEditHistory';
import { usePairingRealtime } from '@/hooks/usePairingRealtime';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Registration {
  id: string;
  participant_name: string;
  partner_name?: string;
  school_organization?: string;
}

interface Judge {
  id: string;
  name: string;
  email: string;
  experience_level: string;
  specializations: string[];
  alumni: boolean;
}

interface Pairing {
  id: string;
  round_id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  judge_id: string | null;
  room: string | null;
  scheduled_time: string | null;
  status: string;
  released: boolean;
  bracket: number | null;
}

interface Conflict {
  judge_profile_id: string;
  type: 'team' | 'school';
  registration_id?: string;
  school_name?: string;
}

interface ManualPairingEditorProps {
  pairings: Pairing[];
  registrations: Registration[];
  judges: Judge[];
  conflicts: Conflict[];
  roundId: string;
  onPairingsChange: (pairings: Pairing[]) => void;
  onRefresh: () => void;
  onReleaseToggle: (pairingId: string, released: boolean) => Promise<void>;
}

export function ManualPairingEditor({
  pairings,
  registrations,
  judges,
  conflicts,
  roundId,
  onPairingsChange,
  onRefresh,
  onReleaseToggle
}: ManualPairingEditorProps) {
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { logEdit, undoLastEdit } = useEditHistory();

  // Real-time sync
  const handleRealtimeUpdate = useCallback((payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => {
    const updatedPairing = payload.new as unknown as Pairing;
    onPairingsChange(
      pairings.map(p => p.id === updatedPairing.id ? updatedPairing : p)
    );
  }, [pairings, onPairingsChange]);

  usePairingRealtime({
    roundId,
    onUpdate: handleRealtimeUpdate
  });

  // Get assigned judge IDs for this round
  const assignedJudgeIds = useMemo(() => 
    new Set(pairings.map(p => p.judge_id).filter(Boolean) as string[]),
    [pairings]
  );

  // Helper to get registration by ID
  const getRegistration = (id: string) => registrations.find(r => r.id === id);
  const getJudge = (id: string | null) => id ? judges.find(j => j.id === id) : null;

  // Get team display name
  const getTeamName = (reg: Registration | undefined) => {
    if (!reg) return 'Unknown';
    if (reg.partner_name) {
      return `${reg.participant_name} & ${reg.partner_name}`;
    }
    return reg.participant_name;
  };

  // Update pairing field
  const updatePairingField = async (
    pairingId: string,
    field: string,
    value: unknown,
    oldValue: unknown
  ): Promise<boolean> => {
    const cellKey = `${pairingId}-${field}`;
    setSavingCells(prev => new Set(prev).add(cellKey));

    try {
      const { error } = await supabase
        .from('pairings')
        .update({ [field]: value })
        .eq('id', pairingId);

      if (error) throw error;

      // Log edit history
      await logEdit({
        pairing_id: pairingId,
        field_changed: field,
        old_value: { [field]: oldValue },
        new_value: { [field]: value }
      });

      // Optimistic update
      onPairingsChange(
        pairings.map(p => p.id === pairingId ? { ...p, [field]: value } : p)
      );

      return true;
    } catch (error) {
      console.error('Failed to update pairing:', error);
      toast({ title: 'Failed to save changes', variant: 'destructive' });
      return false;
    } finally {
      setSavingCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  // Swap teams
  const handleSwapTeams = async (pairing: Pairing) => {
    const cellKey = `${pairing.id}-swap`;
    setSavingCells(prev => new Set(prev).add(cellKey));

    try {
      const { error } = await supabase
        .from('pairings')
        .update({
          aff_registration_id: pairing.neg_registration_id,
          neg_registration_id: pairing.aff_registration_id
        })
        .eq('id', pairing.id);

      if (error) throw error;

      await logEdit({
        pairing_id: pairing.id,
        field_changed: 'team_swap',
        old_value: { 
          aff_registration_id: pairing.aff_registration_id,
          neg_registration_id: pairing.neg_registration_id
        },
        new_value: {
          aff_registration_id: pairing.neg_registration_id,
          neg_registration_id: pairing.aff_registration_id
        },
        change_reason: 'Team swap'
      });

      onPairingsChange(
        pairings.map(p => p.id === pairing.id ? {
          ...p,
          aff_registration_id: pairing.neg_registration_id,
          neg_registration_id: pairing.aff_registration_id
        } : p)
      );

      toast({ title: 'Teams swapped' });
    } catch (error) {
      console.error('Failed to swap teams:', error);
      toast({ title: 'Failed to swap teams', variant: 'destructive' });
    } finally {
      setSavingCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  // Handle undo
  const handleUndo = async (pairingId: string) => {
    const result = await undoLastEdit(pairingId);
    if (result) {
      onRefresh();
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Aff Team', 'Neg Team', 'Judge', 'Room', 'Status', 'Released'];
    const rows = pairings.map(p => {
      const affReg = getRegistration(p.aff_registration_id);
      const negReg = getRegistration(p.neg_registration_id);
      const judge = getJudge(p.judge_id);
      return [
        getTeamName(affReg),
        getTeamName(negReg),
        judge?.name || '',
        p.room || '',
        p.status,
        p.released ? 'Yes' : 'No'
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pairings-${roundId}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Pairings exported' });
  };

  // Get pairing schools for conflict detection
  const getPairingSchools = (pairing: Pairing): string[] => {
    const affReg = getRegistration(pairing.aff_registration_id);
    const negReg = getRegistration(pairing.neg_registration_id);
    const schools: string[] = [];
    if (affReg?.school_organization) schools.push(affReg.school_organization);
    if (negReg?.school_organization) schools.push(negReg.school_organization);
    return schools;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {pairings.length} pairing{pairings.length !== 1 ? 's' : ''} • 
          Click any cell to edit inline
        </div>
      </div>

      {/* Pairings Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Aff Team</TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Neg Team</TableHead>
              <TableHead>Judge</TableHead>
              <TableHead className="w-32">Room</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 text-center">Released</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pairings.map((pairing, index) => {
              const affReg = getRegistration(pairing.aff_registration_id);
              const negReg = getRegistration(pairing.neg_registration_id);
              const judge = getJudge(pairing.judge_id);
              const isSaving = Array.from(savingCells).some(k => k.startsWith(pairing.id));

              return (
                <TableRow 
                  key={pairing.id}
                  className={cn(
                    pairing.released && 'bg-green-50/30 dark:bg-green-900/10',
                    pairing.status === 'completed' && 'bg-muted/30'
                  )}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  
                  {/* Aff Team */}
                  <TableCell>
                    <Select
                      value={pairing.aff_registration_id}
                      onValueChange={(value) => updatePairingField(
                        pairing.id, 
                        'aff_registration_id', 
                        value, 
                        pairing.aff_registration_id
                      )}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">AFF</Badge>
                            <span className="truncate">{getTeamName(affReg)}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {registrations.map(reg => (
                          <SelectItem key={reg.id} value={reg.id}>
                            {getTeamName(reg)}
                            {reg.school_organization && (
                              <span className="text-muted-foreground ml-2">
                                ({reg.school_organization})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Swap Button */}
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSwapTeams(pairing)}
                            disabled={savingCells.has(`${pairing.id}-swap`)}
                          >
                            {savingCells.has(`${pairing.id}-swap`) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowLeftRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Swap sides</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* Neg Team */}
                  <TableCell>
                    <Select
                      value={pairing.neg_registration_id}
                      onValueChange={(value) => updatePairingField(
                        pairing.id, 
                        'neg_registration_id', 
                        value, 
                        pairing.neg_registration_id
                      )}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">NEG</Badge>
                            <span className="truncate">{getTeamName(negReg)}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {registrations.map(reg => (
                          <SelectItem key={reg.id} value={reg.id}>
                            {getTeamName(reg)}
                            {reg.school_organization && (
                              <span className="text-muted-foreground ml-2">
                                ({reg.school_organization})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Judge */}
                  <TableCell>
                    <JudgeSearchDropdown
                      judges={judges}
                      selectedJudgeId={pairing.judge_id}
                      onSelect={(judgeId) => updatePairingField(
                        pairing.id,
                        'judge_id',
                        judgeId,
                        pairing.judge_id
                      )}
                      conflicts={conflicts}
                      pairingAffRegistrationId={pairing.aff_registration_id}
                      pairingNegRegistrationId={pairing.neg_registration_id}
                      pairingSchools={getPairingSchools(pairing)}
                      assignedJudgeIds={assignedJudgeIds}
                    />
                  </TableCell>

                  {/* Room */}
                  <TableCell>
                    <InlineEditCell
                      value={pairing.room || ''}
                      onSave={async (value) => updatePairingField(
                        pairing.id,
                        'room',
                        value || null,
                        pairing.room
                      )}
                      placeholder="Add room"
                    />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Select
                      value={pairing.status}
                      onValueChange={(value) => updatePairingField(
                        pairing.id,
                        'status',
                        value,
                        pairing.status
                      )}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="bye">Bye</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Released */}
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onReleaseToggle(pairing.id, !pairing.released)}
                    >
                      {pairing.released ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUndo(pairing.id)}
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo last edit</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}

            {pairings.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No pairings for this round. Generate pairings to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
