/**
 * Optional Judge Auto-Assignment System
 * Uses Hungarian algorithm for optimal allocation
 * Only runs when enabled for tournament
 */

import { computeOptimalAssignment } from './munkres';

export interface JudgeInfo {
  id: string;
  name: string;
  experienceYears: number;
  availableDates: string[];
  institution?: string;
  specializations?: string[];
}

export interface PairingInfo {
  id: string;
  affTeamId: string;
  negTeamId: string;
  affInstitution?: string;
  negInstitution?: string;
  scheduledTime?: string;
  roomRank?: number;
}

export interface JudgeConflict {
  judgeId: string;
  teamId?: string;
  institution?: string;
  conflictType: 'team' | 'institution' | 'personal';
}

export interface JudgeAllocationOptions {
  judges: JudgeInfo[];
  pairings: PairingInfo[];
  conflicts: JudgeConflict[];
  judgesPerRoom: number;
  roundDate?: string;
  formatKey?: string | null;
}

export interface JudgeAssignment {
  pairingId: string;
  judgeId: string;
  judgeName: string;
  cost: number;
  hasConflict: boolean;
  conflictReason?: string;
}

// Cost constants
const CONFLICT_COST = 10000; // Very high - effectively prevents assignment
const INSTITUTION_CONFLICT_COST = 5000;
const EXPERIENCE_BONUS = 100; // Higher experience = lower cost
const ROOM_PRIORITY_BONUS = 50; // Higher rooms get better judges

export class JudgeAllocator {
  private judges: JudgeInfo[];
  private pairings: PairingInfo[];
  private conflicts: JudgeConflict[];
  private judgesPerRoom: number;
  private roundDate?: string;
  private formatKey?: string | null;

  constructor(options: JudgeAllocationOptions) {
    this.judges = options.judges;
    this.pairings = options.pairings;
    this.conflicts = options.conflicts;
    this.judgesPerRoom = options.judgesPerRoom;
    this.roundDate = options.roundDate;
    this.formatKey = options.formatKey;
  }

  /**
   * Allocate judges to pairings optimally
   */
  allocate(): JudgeAssignment[] {
    if (this.judges.length === 0 || this.pairings.length === 0) {
      return [];
    }

    // Filter available judges for this round
    const availableJudges = this.filterAvailableJudges();
    
    if (availableJudges.length === 0) {
      return [];
    }

    // Calculate total assignments needed
    const totalSlots = this.pairings.length * this.judgesPerRoom;
    
    // If we need multiple judges per room, expand pairings
    const expandedPairings = this.expandPairingsForMultiJudge();

    // Build cost matrix
    const costMatrix = this.buildCostMatrix(availableJudges, expandedPairings);

    // Run Hungarian algorithm
    const result = computeOptimalAssignment(costMatrix);

    // Map assignments back to judges and pairings
    const assignments: JudgeAssignment[] = [];
    const usedJudges = new Set<string>();

    for (const [judgeIndex, slotIndex] of result.assignment) {
      if (judgeIndex >= availableJudges.length || slotIndex >= expandedPairings.length) {
        continue;
      }

      const judge = availableJudges[judgeIndex];
      const slot = expandedPairings[slotIndex];
      
      // Don't assign same judge twice
      if (usedJudges.has(judge.id)) {
        continue;
      }

      const conflict = this.checkConflict(judge, slot.pairing);
      const cost = costMatrix[judgeIndex][slotIndex];

      assignments.push({
        pairingId: slot.pairing.id,
        judgeId: judge.id,
        judgeName: judge.name,
        cost,
        hasConflict: conflict !== null,
        conflictReason: conflict || undefined,
      });

      if (this.judgesPerRoom === 1) {
        usedJudges.add(judge.id);
      }
    }

    return assignments;
  }

  /**
   * Filter judges available for this round's date and format
   */
  private filterAvailableJudges(): JudgeInfo[] {
    let filtered = this.judges;

    // Filter by format specialization if specified
    if (this.formatKey) {
      filtered = filtered.filter(judge => {
        // If judge has no specializations, assume they can judge any format
        if (!judge.specializations || judge.specializations.length === 0) {
          return true;
        }
        // Check if judge's specializations include this format
        return judge.specializations.includes(this.formatKey!);
      });
    }

    // Filter by date availability
    if (this.roundDate) {
      filtered = filtered.filter(judge => {
        if (!judge.availableDates || judge.availableDates.length === 0) {
          return true; // Assume available if no dates specified
        }
        return judge.availableDates.includes(this.roundDate!);
      });
    }

    return filtered;
  }

  /**
   * Expand pairings if multiple judges per room needed
   */
  private expandPairingsForMultiJudge(): Array<{ pairing: PairingInfo; slot: number }> {
    const expanded: Array<{ pairing: PairingInfo; slot: number }> = [];
    
    for (const pairing of this.pairings) {
      for (let slot = 0; slot < this.judgesPerRoom; slot++) {
        expanded.push({ pairing, slot });
      }
    }

    return expanded;
  }

  /**
   * Build cost matrix for Hungarian algorithm
   */
  private buildCostMatrix(
    judges: JudgeInfo[],
    slots: Array<{ pairing: PairingInfo; slot: number }>
  ): number[][] {
    const n = Math.max(judges.length, slots.length);
    const matrix: number[][] = [];

    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i >= judges.length || j >= slots.length) {
          // Padding for non-square matrix
          matrix[i][j] = CONFLICT_COST;
        } else {
          matrix[i][j] = this.calculateCost(judges[i], slots[j].pairing);
        }
      }
    }

    return matrix;
  }

  /**
   * Calculate assignment cost for a judge-pairing pair
   * Lower cost = better assignment
   */
  private calculateCost(judge: JudgeInfo, pairing: PairingInfo): number {
    let cost = 1000; // Base cost

    // Check for hard conflicts
    const conflict = this.checkConflict(judge, pairing);
    if (conflict) {
      if (conflict.includes('team')) {
        return CONFLICT_COST; // Can't assign
      }
      if (conflict.includes('institution')) {
        cost += INSTITUTION_CONFLICT_COST;
      }
    }

    // Experience bonus - more experienced judges get lower cost
    cost -= judge.experienceYears * EXPERIENCE_BONUS;

    // Room priority bonus - better rooms (lower rank) get better judges
    if (pairing.roomRank) {
      cost -= (10 - Math.min(pairing.roomRank, 10)) * ROOM_PRIORITY_BONUS;
    }

    return Math.max(0, cost);
  }

  /**
   * Check if judge has conflict with pairing
   */
  private checkConflict(judge: JudgeInfo, pairing: PairingInfo): string | null {
    for (const conflict of this.conflicts) {
      if (conflict.judgeId !== judge.id) continue;

      // Team conflict
      if (conflict.teamId) {
        if (conflict.teamId === pairing.affTeamId || conflict.teamId === pairing.negTeamId) {
          return `team conflict with ${conflict.teamId}`;
        }
      }

      // Institution conflict
      if (conflict.institution) {
        if (conflict.institution === pairing.affInstitution || 
            conflict.institution === pairing.negInstitution) {
          return `institution conflict with ${conflict.institution}`;
        }
      }
    }

    // Check judge's own institution
    if (judge.institution) {
      if (judge.institution === pairing.affInstitution || 
          judge.institution === pairing.negInstitution) {
        return `judge's institution conflict`;
      }
    }

    return null;
  }

  /**
   * Get assignment summary with any warnings
   */
  getSummary(assignments: JudgeAssignment[]): {
    totalAssigned: number;
    conflictCount: number;
    unassignedPairings: string[];
    warnings: string[];
  } {
    const assignedPairings = new Set(assignments.map(a => a.pairingId));
    const unassignedPairings = this.pairings
      .filter(p => !assignedPairings.has(p.id))
      .map(p => p.id);

    const warnings: string[] = [];
    const conflictCount = assignments.filter(a => a.hasConflict).length;

    if (conflictCount > 0) {
      warnings.push(`${conflictCount} assignments have conflicts`);
    }

    if (unassignedPairings.length > 0) {
      warnings.push(`${unassignedPairings.length} pairings have no judge assigned`);
    }

    const judgesNeeded = this.pairings.length * this.judgesPerRoom;
    if (this.judges.length < judgesNeeded) {
      warnings.push(`Not enough judges: have ${this.judges.length}, need ${judgesNeeded}`);
    }

    return {
      totalAssigned: assignments.length,
      conflictCount,
      unassignedPairings,
      warnings,
    };
  }
}
