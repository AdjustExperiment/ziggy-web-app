import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, CheckCircle, XCircle } from 'lucide-react';
import { JudgeAssignment } from '@/lib/tabulation/judgeAllocator';

interface JudgeAutoAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: JudgeAssignment[];
  summary: {
    totalAssigned: number;
    conflictCount: number;
    unassignedPairings: string[];
    warnings: string[];
  };
  pairings: Array<{
    id: string;
    room?: string;
    aff_registration?: { participant_name: string };
    neg_registration?: { participant_name: string };
  }>;
  judges: Array<{ id: string; name: string }>;
  onApply: (assignments: JudgeAssignment[]) => Promise<void>;
  onOverride: (pairingId: string, judgeId: string, judgeName: string) => void;
  loading: boolean;
}

export function JudgeAutoAssignModal({
  open,
  onOpenChange,
  assignments,
  summary,
  pairings,
  judges,
  onApply,
  onOverride,
  loading
}: JudgeAutoAssignModalProps) {
  const [localAssignments, setLocalAssignments] = useState<JudgeAssignment[]>(assignments);

  // Update local assignments when props change
  React.useEffect(() => {
    setLocalAssignments(assignments);
  }, [assignments]);

  const handleOverride = (pairingId: string, judgeId: string) => {
    const judge = judges.find(j => j.id === judgeId);
    if (!judge) return;

    const newAssignments = localAssignments.map(a => 
      a.pairingId === pairingId 
        ? { ...a, judgeId, judgeName: judge.name, hasConflict: false, conflictReason: undefined, cost: 0 }
        : a
    );

    // If pairing doesn't have assignment, add it
    if (!newAssignments.some(a => a.pairingId === pairingId)) {
      newAssignments.push({
        pairingId,
        judgeId,
        judgeName: judge.name,
        cost: 0,
        hasConflict: false
      });
    }

    setLocalAssignments(newAssignments);
    onOverride(pairingId, judgeId, judge.name);
  };

  const getPairingInfo = (pairingId: string) => {
    return pairings.find(p => p.id === pairingId);
  };

  const getAssignmentForPairing = (pairingId: string) => {
    return localAssignments.find(a => a.pairingId === pairingId);
  };

  const assignedJudgeIds = new Set(localAssignments.map(a => a.judgeId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Auto-Assign Judges Preview
          </DialogTitle>
          <DialogDescription>
            Review proposed judge assignments before applying them
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 py-4">
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{pairings.length}</div>
            <div className="text-xs text-muted-foreground">Total Pairings</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{summary.totalAssigned}</div>
            <div className="text-xs text-muted-foreground">Assigned</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className={`text-2xl font-bold ${summary.unassignedPairings.length > 0 ? 'text-destructive' : 'text-primary'}`}>
              {summary.unassignedPairings.length}
            </div>
            <div className="text-xs text-muted-foreground">Unassigned</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className={`text-2xl font-bold ${summary.conflictCount > 0 ? 'text-amber-500' : 'text-primary'}`}>
              {summary.conflictCount}
            </div>
            <div className="text-xs text-muted-foreground">With Conflicts</div>
          </div>
        </div>

        {/* Warnings */}
        {summary.warnings.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {summary.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Assignments Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Affirmative</TableHead>
                <TableHead>Negative</TableHead>
                <TableHead>Proposed Judge</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pairings.map((pairing) => {
                const assignment = getAssignmentForPairing(pairing.id);
                return (
                  <TableRow key={pairing.id} className={assignment?.hasConflict ? 'bg-amber-500/10' : ''}>
                    <TableCell className="font-medium">{pairing.room || 'TBD'}</TableCell>
                    <TableCell>{pairing.aff_registration?.participant_name || '—'}</TableCell>
                    <TableCell>{pairing.neg_registration?.participant_name || '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={assignment?.judgeId || 'none'}
                        onValueChange={(value) => value !== 'none' && handleOverride(pairing.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select judge" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No judge</SelectItem>
                          {judges.map((judge) => (
                            <SelectItem 
                              key={judge.id} 
                              value={judge.id}
                              disabled={assignedJudgeIds.has(judge.id) && assignment?.judgeId !== judge.id}
                            >
                              {judge.name}
                              {assignedJudgeIds.has(judge.id) && assignment?.judgeId !== judge.id && ' (assigned)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {assignment ? (
                        assignment.hasConflict ? (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {assignment.conflictReason || 'Conflict'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-primary border-primary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-destructive border-destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          No judge
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={() => onApply(localAssignments)} 
            disabled={loading || localAssignments.length === 0}
          >
            {loading ? 'Applying...' : `Apply ${localAssignments.length} Assignments`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
