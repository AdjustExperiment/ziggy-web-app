/**
 * Advanced Draw Generation System
 * Based on Tabbycat's draw generation algorithms including:
 * - Power pairing with bracket management
 * - Munkres algorithm for optimal assignments
 * - One-up-one-down conflict swapping
 * - Side balance optimization
 */

import { Munkres, DISALLOWED } from './munkres';

// Types
export interface Team {
  id: string;
  name: string;
  institution?: string;
  wins: number;
  speaks: number;
  affCount: number;
  negCount: number;
  pullupCount: number;
  isActive: boolean;
}

export interface PairingHistory {
  affId: string;
  negId: string;
  roundNumber: number;
}

export interface DrawSettings {
  drawMethod: 'random' | 'power_paired' | 'round_robin' | 'manual';
  sideMethod: 'balance' | 'preallocated' | 'random';
  oddBracket: 'pullup_top' | 'pullup_bottom' | 'intermediate' | 'intermediate_bubble_up_down';
  pullupRestriction: 'least_to_date';
  avoidRematches: boolean;
  clubProtect: boolean;
  historyPenalty: number;
  institutionPenalty: number;
  sidePenalty: number;
  maxRepeatOpponents: number;
}

export interface GeneratedPairing {
  affTeamId: string;
  negTeamId: string;
  bracket: number;
  roomRank: number;
  flags: string[];
}

interface Bracket {
  wins: number;
  teams: Team[];
}

interface DebatePairing {
  aff: Team;
  neg: Team;
  flags: string[];
}

/**
 * Main Draw Generator class implementing Tabbycat-style power pairing
 */
export class DrawGenerator {
  private teams: Team[];
  private history: PairingHistory[];
  private settings: DrawSettings;
  private roundNumber: number;

  constructor(
    teams: Team[],
    history: PairingHistory[],
    settings: Partial<DrawSettings>,
    roundNumber: number
  ) {
    this.teams = teams.filter(t => t.isActive);
    this.history = history;
    this.roundNumber = roundNumber;
    this.settings = {
      drawMethod: settings.drawMethod || 'power_paired',
      sideMethod: settings.sideMethod || 'balance',
      oddBracket: settings.oddBracket || 'pullup_top',
      pullupRestriction: settings.pullupRestriction || 'least_to_date',
      avoidRematches: settings.avoidRematches ?? true,
      clubProtect: settings.clubProtect ?? true,
      historyPenalty: settings.historyPenalty ?? 1000,
      institutionPenalty: settings.institutionPenalty ?? 500,
      sidePenalty: settings.sidePenalty ?? 100,
      maxRepeatOpponents: settings.maxRepeatOpponents ?? 0,
    };
  }

  /**
   * Generate the draw based on the configured method
   */
  generate(): GeneratedPairing[] {
    switch (this.settings.drawMethod) {
      case 'random':
        return this.generateRandomDraw();
      case 'power_paired':
        return this.generatePowerPairedDraw();
      case 'round_robin':
        return this.generateRoundRobinDraw();
      default:
        return [];
    }
  }

  /**
   * Random draw - shuffles teams and pairs them
   */
  private generateRandomDraw(): GeneratedPairing[] {
    const shuffled = [...this.teams].sort(() => Math.random() - 0.5);
    const pairings: GeneratedPairing[] = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const [aff, neg] = this.assignSides(shuffled[i], shuffled[i + 1]);
      pairings.push({
        affTeamId: aff.id,
        negTeamId: neg.id,
        bracket: 0,
        roomRank: Math.floor(i / 2) + 1,
        flags: [],
      });
    }

    // Handle bye if odd number of teams
    if (shuffled.length % 2 === 1) {
      pairings.push({
        affTeamId: shuffled[shuffled.length - 1].id,
        negTeamId: '', // Bye
        bracket: 0,
        roomRank: pairings.length + 1,
        flags: ['bye'],
      });
    }

    return pairings;
  }

  /**
   * Power-paired draw using Tabbycat's algorithm
   */
  private generatePowerPairedDraw(): GeneratedPairing[] {
    // Step 1: Create brackets by win count
    const brackets = this.createBrackets();
    
    // Step 2: Handle odd brackets (pullups)
    this.resolveOddBrackets(brackets);
    
    // Step 3: Pair within each bracket using Munkres algorithm
    const rawPairings = this.pairBrackets(brackets);
    
    // Step 4: Resolve conflicts using one-up-one-down swapping
    const resolvedPairings = this.resolveConflicts(rawPairings, brackets);
    
    // Step 5: Assign sides
    const finalPairings = this.assignAllSides(resolvedPairings);
    
    // Step 6: Assign room ranks
    return this.assignRoomRanks(finalPairings);
  }

  /**
   * Round robin draw (placeholder - for league-style tournaments)
   */
  private generateRoundRobinDraw(): GeneratedPairing[] {
    // Simple implementation - in full version would track round robin schedule
    return this.generateRandomDraw();
  }

  /**
   * Create brackets grouped by win count
   */
  private createBrackets(): Bracket[] {
    const bracketMap = new Map<number, Team[]>();
    
    for (const team of this.teams) {
      const wins = team.wins;
      if (!bracketMap.has(wins)) {
        bracketMap.set(wins, []);
      }
      bracketMap.get(wins)!.push(team);
    }
    
    // Sort brackets by wins (highest first)
    const sortedWins = Array.from(bracketMap.keys()).sort((a, b) => b - a);
    
    return sortedWins.map(wins => ({
      wins,
      teams: bracketMap.get(wins)!.sort((a, b) => b.speaks - a.speaks), // Sort by speaks within bracket
    }));
  }

  /**
   * Handle odd-sized brackets by pulling up teams
   */
  private resolveOddBrackets(brackets: Bracket[]): void {
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      
      if (bracket.teams.length % 2 === 1 && i < brackets.length - 1) {
        // Pull up from next bracket
        const nextBracket = brackets[i + 1];
        
        if (nextBracket.teams.length > 0) {
          let pullupTeam: Team;
          
          switch (this.settings.oddBracket) {
            case 'pullup_top':
              // Pull up the top team from next bracket
              pullupTeam = this.selectPullup(nextBracket.teams, 'top');
              break;
            case 'pullup_bottom':
              // Pull up the bottom team from next bracket
              pullupTeam = this.selectPullup(nextBracket.teams, 'bottom');
              break;
            case 'intermediate':
            case 'intermediate_bubble_up_down':
              // Pull up team with fewest pullups
              pullupTeam = this.selectPullup(nextBracket.teams, 'least_pullups');
              break;
            default:
              pullupTeam = this.selectPullup(nextBracket.teams, 'top');
          }
          
          // Move team from next bracket to current
          nextBracket.teams = nextBracket.teams.filter(t => t.id !== pullupTeam.id);
          pullupTeam.pullupCount++;
          bracket.teams.push(pullupTeam);
        }
      }
    }
    
    // Handle remaining odd bracket at the bottom (bye)
    const lastBracket = brackets[brackets.length - 1];
    if (lastBracket && lastBracket.teams.length % 2 === 1) {
      // The last team gets a bye - handled in pairing
    }
  }

  /**
   * Select which team to pull up based on strategy
   */
  private selectPullup(teams: Team[], strategy: 'top' | 'bottom' | 'least_pullups'): Team {
    if (teams.length === 0) throw new Error('No teams to pull up');
    
    const sorted = [...teams].sort((a, b) => {
      if (strategy === 'least_pullups') {
        if (a.pullupCount !== b.pullupCount) {
          return a.pullupCount - b.pullupCount;
        }
      }
      // Secondary sort by speaks
      return b.speaks - a.speaks;
    });
    
    return strategy === 'bottom' ? sorted[sorted.length - 1] : sorted[0];
  }

  /**
   * Pair teams within each bracket using Munkres algorithm
   */
  private pairBrackets(brackets: Bracket[]): DebatePairing[] {
    const allPairings: DebatePairing[] = [];
    
    for (const bracket of brackets) {
      if (bracket.teams.length === 0) continue;
      
      if (bracket.teams.length === 1) {
        // Bye for single team in bracket
        allPairings.push({
          aff: bracket.teams[0],
          neg: null as any, // Will be handled as bye
          flags: ['bye'],
        });
        continue;
      }
      
      const bracketPairings = this.pairBracket(bracket);
      allPairings.push(...bracketPairings);
    }
    
    return allPairings;
  }

  /**
   * Pair a single bracket using Munkres algorithm for optimal matching
   */
  private pairBracket(bracket: Bracket): DebatePairing[] {
    const teams = bracket.teams;
    const n = teams.length;
    
    if (n < 2) return [];
    
    // Build cost matrix
    // Divide teams into two halves (power pairing fold)
    const half = Math.floor(n / 2);
    const topHalf = teams.slice(0, half);
    const bottomHalf = teams.slice(half);
    
    // Pad if necessary
    while (bottomHalf.length < topHalf.length) {
      bottomHalf.push(null as any);
    }
    while (topHalf.length < bottomHalf.length) {
      topHalf.push(null as any);
    }
    
    // Build cost matrix
    const costMatrix: number[][] = [];
    
    for (let i = 0; i < topHalf.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < bottomHalf.length; j++) {
        if (!topHalf[i] || !bottomHalf[j]) {
          row.push(DISALLOWED);
        } else {
          row.push(this.pairingCost(topHalf[i], bottomHalf[j]));
        }
      }
      costMatrix.push(row);
    }
    
    // Run Munkres algorithm
    const munkres = new Munkres();
    const { assignment } = munkres.compute(costMatrix);
    
    // Convert assignment to pairings
    const pairings: DebatePairing[] = [];
    const usedTeams = new Set<string>();
    
    for (const [i, j] of assignment) {
      if (topHalf[i] && bottomHalf[j]) {
        if (!usedTeams.has(topHalf[i].id) && !usedTeams.has(bottomHalf[j].id)) {
          pairings.push({
            aff: topHalf[i],
            neg: bottomHalf[j],
            flags: [],
          });
          usedTeams.add(topHalf[i].id);
          usedTeams.add(bottomHalf[j].id);
        }
      }
    }
    
    return pairings;
  }

  /**
   * Calculate the cost of pairing two teams
   */
  private pairingCost(team1: Team, team2: Team): number {
    let cost = 0;
    
    // History penalty - have they met before?
    if (this.settings.avoidRematches) {
      const meetCount = this.countMeetings(team1.id, team2.id);
      if (meetCount > this.settings.maxRepeatOpponents) {
        return DISALLOWED;
      }
      cost += meetCount * this.settings.historyPenalty;
    }
    
    // Institution penalty - same school?
    if (this.settings.clubProtect && team1.institution && team2.institution) {
      if (team1.institution.toLowerCase() === team2.institution.toLowerCase()) {
        cost += this.settings.institutionPenalty;
      }
    }
    
    // Power pairing tries to match teams close in rank
    // Smaller difference = lower cost (will be adjusted by matrix position)
    const speaksDiff = Math.abs(team1.speaks - team2.speaks);
    cost += speaksDiff * 0.01; // Small weight for speaks difference
    
    return cost;
  }

  /**
   * Count how many times two teams have met
   */
  private countMeetings(teamId1: string, teamId2: string): number {
    return this.history.filter(
      h => (h.affId === teamId1 && h.negId === teamId2) ||
           (h.affId === teamId2 && h.negId === teamId1)
    ).length;
  }

  /**
   * Resolve conflicts using one-up-one-down swapping
   * Based on Tabbycat's one_up_one_down.py
   */
  private resolveConflicts(pairings: DebatePairing[], brackets: Bracket[]): DebatePairing[] {
    // Group pairings by bracket
    const pairingsByBracket = new Map<number, DebatePairing[]>();
    
    for (const pairing of pairings) {
      if (!pairing.neg) continue; // Skip byes
      
      const bracketWins = pairing.aff.wins;
      if (!pairingsByBracket.has(bracketWins)) {
        pairingsByBracket.set(bracketWins, []);
      }
      pairingsByBracket.get(bracketWins)!.push(pairing);
    }
    
    // Process each pair of adjacent brackets
    const bracketWins = Array.from(pairingsByBracket.keys()).sort((a, b) => b - a);
    
    for (let i = 0; i < bracketWins.length - 1; i++) {
      const upperBracket = pairingsByBracket.get(bracketWins[i]) || [];
      const lowerBracket = pairingsByBracket.get(bracketWins[i + 1]) || [];
      
      this.swapToResolveConflicts(upperBracket, lowerBracket);
    }
    
    // Flatten back to array
    const resolved: DebatePairing[] = [];
    for (const wins of bracketWins) {
      resolved.push(...(pairingsByBracket.get(wins) || []));
    }
    
    // Add back byes
    for (const pairing of pairings) {
      if (!pairing.neg) {
        resolved.push(pairing);
      }
    }
    
    return resolved;
  }

  /**
   * Swap teams between adjacent brackets to resolve conflicts
   */
  private swapToResolveConflicts(upperBracket: DebatePairing[], lowerBracket: DebatePairing[]): void {
    for (const upper of upperBracket) {
      if (!this.hasConflict(upper)) continue;
      
      // Try swapping with lower bracket pairings
      for (const lower of lowerBracket) {
        if (this.hasConflict(lower)) continue; // Don't swap into another conflict
        
        // Try swapping aff teams
        if (this.wouldResolveConflict(upper, lower, 'aff')) {
          const temp = upper.aff;
          upper.aff = lower.aff;
          lower.aff = temp;
          upper.flags.push('swapped_aff');
          lower.flags.push('swapped_aff');
          break;
        }
        
        // Try swapping neg teams
        if (this.wouldResolveConflict(upper, lower, 'neg')) {
          const temp = upper.neg;
          upper.neg = lower.neg;
          lower.neg = temp;
          upper.flags.push('swapped_neg');
          lower.flags.push('swapped_neg');
          break;
        }
      }
    }
  }

  /**
   * Check if a pairing has a conflict (rematch or same institution)
   */
  private hasConflict(pairing: DebatePairing): boolean {
    if (!pairing.aff || !pairing.neg) return false;
    
    // Check rematch
    if (this.settings.avoidRematches) {
      const meetCount = this.countMeetings(pairing.aff.id, pairing.neg.id);
      if (meetCount > this.settings.maxRepeatOpponents) {
        return true;
      }
    }
    
    // Check institution
    if (this.settings.clubProtect) {
      if (pairing.aff.institution && pairing.neg.institution) {
        if (pairing.aff.institution.toLowerCase() === pairing.neg.institution.toLowerCase()) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if swapping would resolve the conflict
   */
  private wouldResolveConflict(
    upper: DebatePairing,
    lower: DebatePairing,
    position: 'aff' | 'neg'
  ): boolean {
    // Create hypothetical swapped pairings
    let newUpper: DebatePairing;
    let newLower: DebatePairing;
    
    if (position === 'aff') {
      newUpper = { ...upper, aff: lower.aff };
      newLower = { ...lower, aff: upper.aff };
    } else {
      newUpper = { ...upper, neg: lower.neg };
      newLower = { ...lower, neg: upper.neg };
    }
    
    // Check if conflicts are resolved
    return !this.hasConflict(newUpper) && !this.hasConflict(newLower);
  }

  /**
   * Assign sides (aff/neg) based on side balance
   */
  private assignSides(team1: Team, team2: Team): [Team, Team] {
    if (this.settings.sideMethod === 'random') {
      return Math.random() < 0.5 ? [team1, team2] : [team2, team1];
    }
    
    // Balance method - team with fewer aff debates goes aff
    const team1Imbalance = team1.affCount - team1.negCount;
    const team2Imbalance = team2.affCount - team2.negCount;
    
    if (team1Imbalance < team2Imbalance) {
      return [team1, team2]; // team1 needs more aff
    } else if (team2Imbalance < team1Imbalance) {
      return [team2, team1]; // team2 needs more aff
    } else {
      // Equal imbalance - random
      return Math.random() < 0.5 ? [team1, team2] : [team2, team1];
    }
  }

  /**
   * Assign sides to all pairings
   */
  private assignAllSides(pairings: DebatePairing[]): DebatePairing[] {
    return pairings.map(pairing => {
      if (!pairing.neg) return pairing; // Bye
      
      const [aff, neg] = this.assignSides(pairing.aff, pairing.neg);
      return { ...pairing, aff, neg };
    });
  }

  /**
   * Assign room ranks based on bracket position
   */
  private assignRoomRanks(pairings: DebatePairing[]): GeneratedPairing[] {
    // Sort by bracket (wins) and then by combined speaks
    const sorted = [...pairings].sort((a, b) => {
      if (!a.neg) return 1; // Byes at end
      if (!b.neg) return -1;
      
      const aWins = a.aff.wins;
      const bWins = b.aff.wins;
      if (aWins !== bWins) return bWins - aWins;
      
      const aSpeaks = a.aff.speaks + a.neg.speaks;
      const bSpeaks = b.aff.speaks + b.neg.speaks;
      return bSpeaks - aSpeaks;
    });
    
    return sorted.map((pairing, index) => ({
      affTeamId: pairing.aff.id,
      negTeamId: pairing.neg?.id || '',
      bracket: pairing.aff.wins,
      roomRank: index + 1,
      flags: pairing.flags,
    }));
  }
}

/**
 * Convenience function to generate a draw
 */
export function generateDraw(
  teams: Team[],
  history: PairingHistory[],
  settings: Partial<DrawSettings>,
  roundNumber: number
): GeneratedPairing[] {
  const generator = new DrawGenerator(teams, history, settings, roundNumber);
  return generator.generate();
}

/**
 * Calculate side imbalance for a team
 */
export function calculateSideImbalance(affCount: number, negCount: number): number {
  return affCount - negCount;
}

/**
 * Check if pairing would create a conflict
 */
export function checkPairingConflict(
  team1: Team,
  team2: Team,
  history: PairingHistory[],
  settings: Partial<DrawSettings>
): { hasConflict: boolean; reason?: string } {
  // Check rematch
  if (settings.avoidRematches !== false) {
    const meetCount = history.filter(
      h => (h.affId === team1.id && h.negId === team2.id) ||
           (h.affId === team2.id && h.negId === team1.id)
    ).length;
    
    if (meetCount > (settings.maxRepeatOpponents || 0)) {
      return { hasConflict: true, reason: `Teams have met ${meetCount} time(s)` };
    }
  }
  
  // Check institution
  if (settings.clubProtect !== false && team1.institution && team2.institution) {
    if (team1.institution.toLowerCase() === team2.institution.toLowerCase()) {
      return { hasConflict: true, reason: 'Same institution' };
    }
  }
  
  return { hasConflict: false };
}
