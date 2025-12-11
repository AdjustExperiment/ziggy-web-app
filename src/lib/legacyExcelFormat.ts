/**
 * Legacy Excel Format Definitions
 * Matches NCFCA TP.xlsm macro structure
 */

import * as XLSX from 'xlsx';
import { 
  toLastNameFormat, 
  extractState, 
  extractClub,
  formatTeamForLegacy 
} from './legacyNameFormatter';

// TeamData sheet column definitions (A-Y)
export const TEAM_DATA_COLUMNS = {
  A: 'Team',           // LastName/LastName format
  B: 'Speaker1',       // First speaker full name
  C: 'Speaker2',       // Second speaker full name (if team)
  D: 'Region',         // Region number (if available)
  E: 'RegionName',     // Region name (if available)
  F: 'Division',       // Division (Varsity/JV/etc)
  G: 'State',          // State abbreviation
  H: 'Club',           // School/Organization name
  I: 'Wins',           // Total wins
  J: 'Losses',         // Total losses
  K: 'TotalSpeaks',    // Cumulative speaker points
  L: 'AffCount',       // Times on Aff side
  M: 'NegCount',       // Times on Neg side
  N: 'Absent',         // "Y" if not active
  O: 'LastSide',       // Last side played ("Aff" or "Neg")
  // P-Y: Opponents for Rounds 1-10 (Opp1 through Opp10)
  P: 'Opp1',
  Q: 'Opp2',
  R: 'Opp3',
  S: 'Opp4',
  T: 'Opp5',
  U: 'Opp6',
  V: 'Opp7',
  W: 'Opp8',
  X: 'Opp9',
  Y: 'Opp10',
};

// Round sheet column definitions (A-E)
export const ROUND_COLUMNS = {
  A: 'Aff',            // Aff team name (LastName/LastName)
  B: 'Neg',            // Neg team name (LastName/LastName)
  C: 'Winner',         // Winner team name
  D: 'AffSpeaks',      // Aff speaker points
  E: 'NegSpeaks',      // Neg speaker points
};

export interface TeamDataRow {
  team: string;
  speaker1: string;
  speaker2: string;
  region: string;
  regionName: string;
  division: string;
  state: string;
  club: string;
  wins: number;
  losses: number;
  totalSpeaks: number;
  affCount: number;
  negCount: number;
  absent: string;
  lastSide: string;
  opponents: string[]; // Rounds 1-10
}

export interface RoundRow {
  aff: string;
  neg: string;
  winner: string;
  affSpeaks: number;
  negSpeaks: number;
}

export interface LegacyExportData {
  teamData: TeamDataRow[];
  rounds: { [roundNumber: number]: RoundRow[] };
}

/**
 * Calculate team statistics from pairings and ballots
 */
export function calculateTeamStats(
  registration: any,
  pairings: any[],
  ballots: any[]
): { wins: number; losses: number; totalSpeaks: number; lastSide: string; opponents: string[] } {
  let wins = 0;
  let losses = 0;
  let totalSpeaks = 0;
  let lastSide = '';
  const opponents: string[] = [];
  
  // Get all pairings involving this team
  const teamPairings = pairings.filter(
    p => p.aff_registration_id === registration.id || 
         p.neg_registration_id === registration.id
  ).sort((a, b) => {
    // Sort by round number if available
    const roundA = a.round?.round_number || 0;
    const roundB = b.round?.round_number || 0;
    return roundA - roundB;
  });
  
  for (const pairing of teamPairings) {
    const isAff = pairing.aff_registration_id === registration.id;
    lastSide = isAff ? 'Aff' : 'Neg';
    
    // Find opponent
    const opponentId = isAff ? pairing.neg_registration_id : pairing.aff_registration_id;
    const opponentReg = pairing.aff_registration_id === opponentId 
      ? pairing.aff_registration 
      : pairing.neg_registration;
    
    if (opponentReg) {
      opponents.push(formatTeamForLegacy(opponentReg));
    } else {
      opponents.push('');
    }
    
    // Get ballot for this pairing
    const ballot = ballots.find(b => b.pairing_id === pairing.id);
    if (ballot?.payload) {
      const payload = ballot.payload as any;
      
      // Check winner
      if (payload.winner === 'aff' && isAff) {
        wins++;
      } else if (payload.winner === 'neg' && !isAff) {
        wins++;
      } else if (payload.winner) {
        losses++;
      }
      
      // Add speaker points
      if (isAff && payload.affSpeaks) {
        totalSpeaks += Number(payload.affSpeaks) || 0;
      } else if (!isAff && payload.negSpeaks) {
        totalSpeaks += Number(payload.negSpeaks) || 0;
      }
    }
  }
  
  // Pad opponents array to 10 rounds
  while (opponents.length < 10) {
    opponents.push('');
  }
  
  return { wins, losses, totalSpeaks, lastSide, opponents };
}

/**
 * Build TeamData row from registration
 */
export function buildTeamDataRow(
  registration: any,
  pairings: any[],
  ballots: any[]
): TeamDataRow {
  const stats = calculateTeamStats(registration, pairings, ballots);
  
  return {
    team: formatTeamForLegacy(registration),
    speaker1: registration.participant_name || '',
    speaker2: registration.partner_name || '',
    region: registration.additional_info?.region || '',
    regionName: registration.additional_info?.region_name || '',
    division: registration.additional_info?.division || '',
    state: extractState(registration.school_organization),
    club: extractClub(registration.school_organization),
    wins: stats.wins,
    losses: stats.losses,
    totalSpeaks: stats.totalSpeaks,
    affCount: registration.aff_count || 0,
    negCount: registration.neg_count || 0,
    absent: registration.is_active ? '' : 'Y',
    lastSide: stats.lastSide,
    opponents: stats.opponents,
  };
}

/**
 * Build Round row from pairing and ballot
 */
export function buildRoundRow(
  pairing: any,
  ballot: any | null,
  registrations: any[]
): RoundRow {
  const affReg = registrations.find(r => r.id === pairing.aff_registration_id);
  const negReg = registrations.find(r => r.id === pairing.neg_registration_id);
  
  const payload = ballot?.payload as any || {};
  
  let winner = '';
  if (payload.winner === 'aff' && affReg) {
    winner = formatTeamForLegacy(affReg);
  } else if (payload.winner === 'neg' && negReg) {
    winner = formatTeamForLegacy(negReg);
  }
  
  return {
    aff: affReg ? formatTeamForLegacy(affReg) : '',
    neg: negReg ? formatTeamForLegacy(negReg) : '',
    winner,
    affSpeaks: Number(payload.affSpeaks) || 0,
    negSpeaks: Number(payload.negSpeaks) || 0,
  };
}

/**
 * Generate complete NCFCA-format Excel workbook
 */
export function generateLegacyWorkbook(data: LegacyExportData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  
  // Create TeamData sheet
  const teamDataHeaders = [
    'Team', 'Speaker1', 'Speaker2', 'Region', 'RegionName', 'Division',
    'State', 'Club', 'Wins', 'Losses', 'TotalSpeaks', 'AffCount', 'NegCount',
    'Absent', 'LastSide', 'Opp1', 'Opp2', 'Opp3', 'Opp4', 'Opp5',
    'Opp6', 'Opp7', 'Opp8', 'Opp9', 'Opp10'
  ];
  
  const teamDataRows = data.teamData.map(row => [
    row.team, row.speaker1, row.speaker2, row.region, row.regionName, row.division,
    row.state, row.club, row.wins, row.losses, row.totalSpeaks, row.affCount, row.negCount,
    row.absent, row.lastSide, ...row.opponents
  ]);
  
  const teamDataSheet = XLSX.utils.aoa_to_sheet([teamDataHeaders, ...teamDataRows]);
  XLSX.utils.book_append_sheet(wb, teamDataSheet, 'TeamData');
  
  // Create Round sheets (Round1 through Round10)
  for (let i = 1; i <= 10; i++) {
    const roundData = data.rounds[i] || [];
    const roundHeaders = ['Aff', 'Neg', 'Winner', 'AffSpeaks', 'NegSpeaks'];
    const roundRows = roundData.map(row => [
      row.aff, row.neg, row.winner, row.affSpeaks, row.negSpeaks
    ]);
    
    const roundSheet = XLSX.utils.aoa_to_sheet([roundHeaders, ...roundRows]);
    XLSX.utils.book_append_sheet(wb, roundSheet, `Round${i}`);
  }
  
  return wb;
}

/**
 * Parse uploaded pairing file (2-column format: Aff, Neg)
 */
export function parseUploadedPairings(file: ArrayBuffer): { aff: string; neg: string }[] {
  const wb = XLSX.read(file, { type: 'array' });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  
  // Read as array of arrays, no header
  const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
  
  const pairings: { aff: string; neg: string }[] = [];
  
  for (const row of data) {
    if (row && row.length >= 2) {
      const aff = String(row[0] || '').trim();
      const neg = String(row[1] || '').trim();
      
      if (aff && neg) {
        pairings.push({ aff, neg });
      }
    }
  }
  
  return pairings;
}

/**
 * Download workbook as file
 */
export function downloadWorkbook(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename);
}
