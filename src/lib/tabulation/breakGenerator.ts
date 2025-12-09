/**
 * Break Generation System
 * Handles break qualification with multiple category support
 * Based on Tabbycat patterns: Standard, AIDA-1996, AIDA-2016
 */

export interface TeamStanding {
  teamId: string;
  teamName: string;
  institution: string;
  wins: number;
  speaks: number;
  oppStrength: number;
  rank: number;
}

export interface BreakCategory {
  id: string;
  name: string;
  slug: string;
  breakSize: number;
  rule: BreakRule;
  institutionCap: number;
  isGeneral: boolean;
  priority: number;
}

export type BreakRule = 'standard' | 'aida-1996' | 'aida-2016';

export interface BreakResult {
  teamId: string;
  teamName: string;
  institution: string;
  breakRank: number;
  isBreaking: boolean;
  remark: BreakRemark | null;
  categoryId: string;
}

export type BreakRemark = 
  | 'capped' 
  | 'ineligible' 
  | 'different_break' 
  | 'coin_flip' 
  | 'promoted';

export interface BreakGeneratorOptions {
  standings: TeamStanding[];
  category: BreakCategory;
  eligibility: Map<string, boolean>; // teamId -> isEligible
  otherBreaks?: Map<string, string>; // teamId -> categoryId they're breaking in
}

export class BreakGenerator {
  private standings: TeamStanding[];
  private category: BreakCategory;
  private eligibility: Map<string, boolean>;
  private otherBreaks: Map<string, string>;

  constructor(options: BreakGeneratorOptions) {
    this.standings = options.standings;
    this.category = options.category;
    this.eligibility = options.eligibility;
    this.otherBreaks = options.otherBreaks || new Map();
  }

  generate(): BreakResult[] {
    switch (this.category.rule) {
      case 'aida-1996':
        return this.generateAIDA1996();
      case 'aida-2016':
        return this.generateAIDA2016();
      default:
        return this.generateStandard();
    }
  }

  /**
   * Standard Break: Top N eligible teams by standings
   */
  private generateStandard(): BreakResult[] {
    const results: BreakResult[] = [];
    const institutionCount = new Map<string, number>();
    let breakRank = 0;
    let breaking = 0;

    for (const team of this.standings) {
      const isEligible = this.eligibility.get(team.teamId) !== false;
      const inOtherBreak = this.otherBreaks.get(team.teamId);
      const instCount = institutionCount.get(team.institution) || 0;
      const cappedByInstitution = this.category.institutionCap > 0 && 
                                   instCount >= this.category.institutionCap;

      let remark: BreakRemark | null = null;
      let isBreaking = false;

      if (!isEligible) {
        remark = 'ineligible';
      } else if (inOtherBreak && inOtherBreak !== this.category.id) {
        remark = 'different_break';
      } else if (cappedByInstitution) {
        remark = 'capped';
      } else if (breaking < this.category.breakSize) {
        isBreaking = true;
        breakRank++;
        breaking++;
        institutionCount.set(team.institution, instCount + 1);
      }

      results.push({
        teamId: team.teamId,
        teamName: team.teamName,
        institution: team.institution,
        breakRank: isBreaking ? breakRank : 0,
        isBreaking,
        remark,
        categoryId: this.category.id,
      });
    }

    return results;
  }

  /**
   * AIDA-1996: Teams must be in top 3 from their institution
   * to be eligible for the break
   */
  private generateAIDA1996(): BreakResult[] {
    // First, determine which teams are in top 3 from their institution
    const institutionRanks = new Map<string, number>();
    const teamInstitutionRank = new Map<string, number>();

    for (const team of this.standings) {
      const currentRank = institutionRanks.get(team.institution) || 0;
      const newRank = currentRank + 1;
      institutionRanks.set(team.institution, newRank);
      teamInstitutionRank.set(team.teamId, newRank);
    }

    // Generate break with institution rank constraint
    const results: BreakResult[] = [];
    const institutionBreaking = new Map<string, number>();
    let breakRank = 0;
    let breaking = 0;

    for (const team of this.standings) {
      const isEligible = this.eligibility.get(team.teamId) !== false;
      const inOtherBreak = this.otherBreaks.get(team.teamId);
      const institutionRank = teamInstitutionRank.get(team.teamId) || 999;
      const instBreaking = institutionBreaking.get(team.institution) || 0;

      // AIDA-1996: Must be in top 3 from institution
      const meetsAIDARule = institutionRank <= 3;
      const cappedByInstitution = this.category.institutionCap > 0 && 
                                   instBreaking >= this.category.institutionCap;

      let remark: BreakRemark | null = null;
      let isBreakingTeam = false;

      if (!isEligible) {
        remark = 'ineligible';
      } else if (inOtherBreak && inOtherBreak !== this.category.id) {
        remark = 'different_break';
      } else if (!meetsAIDARule) {
        remark = 'capped'; // Institution rank too low
      } else if (cappedByInstitution) {
        remark = 'capped';
      } else if (breaking < this.category.breakSize) {
        isBreakingTeam = true;
        breakRank++;
        breaking++;
        institutionBreaking.set(team.institution, instBreaking + 1);
      }

      results.push({
        teamId: team.teamId,
        teamName: team.teamName,
        institution: team.institution,
        breakRank: isBreakingTeam ? breakRank : 0,
        isBreaking: isBreakingTeam,
        remark,
        categoryId: this.category.id,
      });
    }

    return results;
  }

  /**
   * AIDA-2016 (Australs/Easters): Hybrid system with fallback
   * Similar to AIDA-1996 but with additional considerations
   */
  private generateAIDA2016(): BreakResult[] {
    // Similar to AIDA-1996 but with promotions from lower-ranked institution teams
    const results = this.generateAIDA1996();
    
    // Check if we have enough breaking teams
    const breakingCount = results.filter(r => r.isBreaking).length;
    
    if (breakingCount < this.category.breakSize) {
      // Promote teams that were capped due to institution rank
      const promoted: BreakResult[] = [];
      let remaining = this.category.breakSize - breakingCount;
      let nextRank = breakingCount + 1;

      for (const result of results) {
        if (!result.isBreaking && result.remark === 'capped' && remaining > 0) {
          result.isBreaking = true;
          result.breakRank = nextRank++;
          result.remark = 'promoted';
          remaining--;
        }
      }
    }

    return results;
  }

  /**
   * Calculate liveness - can team still mathematically make the break?
   */
  static calculateLiveness(
    team: TeamStanding,
    standings: TeamStanding[],
    breakSize: number,
    roundsRemaining: number
  ): 'safe' | 'live' | 'dead' {
    const maxPossibleWins = team.wins + roundsRemaining;
    
    // Count teams that are definitely ahead
    const teamsDefinitelyAhead = standings.filter(t => 
      t.teamId !== team.teamId && t.wins > maxPossibleWins
    ).length;

    // If too many teams are definitely ahead, team is dead
    if (teamsDefinitelyAhead >= breakSize) {
      return 'dead';
    }

    // Count teams that team could potentially beat
    const minWinsNeeded = Math.max(...standings.slice(0, breakSize).map(t => t.wins)) - roundsRemaining;
    
    if (team.wins >= minWinsNeeded && team.rank <= breakSize) {
      return 'safe';
    }

    return 'live';
  }
}

/**
 * Generate break for all categories in priority order
 */
export function generateAllBreaks(
  standings: TeamStanding[],
  categories: BreakCategory[],
  eligibilityMap: Map<string, Map<string, boolean>> // categoryId -> teamId -> eligible
): Map<string, BreakResult[]> {
  const results = new Map<string, BreakResult[]>();
  const assignedBreaks = new Map<string, string>(); // teamId -> categoryId

  // Sort categories by priority (lower = higher priority)
  const sortedCategories = [...categories].sort((a, b) => a.priority - b.priority);

  for (const category of sortedCategories) {
    const categoryEligibility = eligibilityMap.get(category.id) || new Map();
    
    const generator = new BreakGenerator({
      standings,
      category,
      eligibility: categoryEligibility,
      otherBreaks: assignedBreaks,
    });

    const breakResults = generator.generate();
    results.set(category.id, breakResults);

    // Track which teams are breaking in this category
    for (const result of breakResults) {
      if (result.isBreaking) {
        assignedBreaks.set(result.teamId, category.id);
      }
    }
  }

  return results;
}
