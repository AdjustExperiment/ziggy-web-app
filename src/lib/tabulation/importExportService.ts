/**
 * Import/Export Service for Tournament Tabulation
 *
 * Provides comprehensive import/export functionality supporting:
 * - Export: CSV, JSON, Excel (NCFCA compatible), PDF-ready HTML
 * - Import: Tabbycat CSV format for teams and results
 * - Validation: Clear error messages for invalid data
 *
 * @module importExportService
 */

import * as XLSX from 'xlsx';
import type { ComputedStanding, StandingWithTeam } from '@/types/tabulation';

// ============================================================================
// Types
// ============================================================================

/**
 * Parsed team from Tabbycat CSV import
 */
export interface ParsedTeam {
  name: string;
  institution: string;
  speakers: string[];
  division?: string;
}

/**
 * Parsed result from Tabbycat CSV import
 */
export interface ParsedResult {
  roundNumber: number;
  room?: string;
  affTeam: string;
  negTeam: string;
  winner: 'aff' | 'neg' | null;
  affSpeaks?: number;
  negSpeaks?: number;
}

/**
 * Validation error for import data
 */
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Validation warning for import data
 */
export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Options for Excel export
 */
export interface ExcelExportOptions {
  includeRoundBreakdown?: boolean;
  tournamentName?: string;
}

/**
 * Options for print HTML generation
 */
export interface PrintHtmlOptions {
  tournamentName?: string;
  showSpeakerPoints?: boolean;
}

/**
 * JSON export format with metadata
 */
export interface StandingsExportJson {
  exportedAt: string;
  tournamentName?: string;
  standings: ExportedStanding[];
}

/**
 * Individual standing in JSON export
 */
export interface ExportedStanding {
  rank: number;
  team: string;
  school: string;
  wins: number;
  losses: number;
  totalSpeaks: number;
  avgSpeaks: number;
  adjustedSpeaks: number;
  oppWins: number;
  oppWinPct: number;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Escapes a value for CSV format
 * Wraps in quotes if contains comma, quote, or newline
 * Doubles any existing quotes
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Gets the display name for a team from standing
 */
function getTeamName(standing: StandingWithTeam): string {
  const reg = standing.registration;
  if (reg.partner_name) {
    return `${reg.participant_name} & ${reg.partner_name}`;
  }
  return reg.participant_name;
}

/**
 * Gets the school/organization name from standing
 */
function getSchoolName(standing: StandingWithTeam): string {
  return standing.registration.school_organization || '';
}

/**
 * Formats win-loss record as string
 */
function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

/**
 * Export standings to CSV format
 *
 * Format:
 * Rank,Team,School,Record,Total Speaks,Avg Speaks,Adj Speaks,Opp Wins,Opp Win %
 *
 * @param standings - Array of standings with team info
 * @returns CSV string
 *
 * @example
 * const csv = exportStandingsToCSV(standings);
 * // "Rank,Team,School,Record,Total Speaks,Avg Speaks,Adj Speaks,Opp Wins,Opp Win %\n1,..."
 */
export function exportStandingsToCSV(standings: StandingWithTeam[]): string {
  const headers = [
    'Rank',
    'Team',
    'School',
    'Record',
    'Total Speaks',
    'Avg Speaks',
    'Adj Speaks',
    'Opp Wins',
    'Opp Win %',
  ];

  const rows: string[] = [headers.join(',')];

  standings.forEach((standing, index) => {
    const rank = standing.prelim_rank ?? standing.overall_rank ?? index + 1;
    const team = getTeamName(standing);
    const school = getSchoolName(standing);
    const record = formatRecord(standing.wins, standing.losses);
    const totalSpeaks = standing.total_speaks.toFixed(1);
    const avgSpeaks = standing.avg_speaks.toFixed(2);
    const adjSpeaks = standing.adjusted_speaks.toFixed(1);
    const oppWins = standing.opp_wins;
    const oppWinPct = (standing.opp_win_pct * 100).toFixed(1) + '%';

    const row = [
      escapeCSVValue(rank),
      escapeCSVValue(team),
      escapeCSVValue(school),
      escapeCSVValue(record),
      escapeCSVValue(totalSpeaks),
      escapeCSVValue(avgSpeaks),
      escapeCSVValue(adjSpeaks),
      escapeCSVValue(oppWins),
      escapeCSVValue(oppWinPct),
    ].join(',');

    rows.push(row);
  });

  return rows.join('\n');
}

/**
 * Export standings to JSON format with metadata
 *
 * @param standings - Array of standings with team info
 * @param tournamentName - Optional tournament name for metadata
 * @returns Pretty-printed JSON string
 *
 * @example
 * const json = exportStandingsToJSON(standings, 'Winter Classic 2024');
 */
export function exportStandingsToJSON(
  standings: StandingWithTeam[],
  tournamentName?: string
): string {
  const exportData: StandingsExportJson = {
    exportedAt: new Date().toISOString(),
    tournamentName,
    standings: standings.map((standing, index) => ({
      rank: standing.prelim_rank ?? standing.overall_rank ?? index + 1,
      team: getTeamName(standing),
      school: getSchoolName(standing),
      wins: standing.wins,
      losses: standing.losses,
      totalSpeaks: standing.total_speaks,
      avgSpeaks: Math.round(standing.avg_speaks * 100) / 100,
      adjustedSpeaks: standing.adjusted_speaks,
      oppWins: standing.opp_wins,
      oppWinPct: Math.round(standing.opp_win_pct * 1000) / 1000,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export standings to Excel workbook
 * Compatible with existing NCFCA format where possible
 *
 * Creates a workbook with:
 * - Standings sheet with full data
 * - Optional round breakdown sheet
 *
 * @param standings - Array of standings with team info
 * @param options - Export options
 * @returns XLSX WorkBook object
 *
 * @example
 * const wb = exportStandingsToExcel(standings, { tournamentName: 'Regionals' });
 * XLSX.writeFile(wb, 'standings.xlsx');
 */
export function exportStandingsToExcel(
  standings: StandingWithTeam[],
  options?: ExcelExportOptions
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Create main standings sheet
  const standingsHeaders = [
    'Rank',
    'Team',
    'School',
    'Wins',
    'Losses',
    'Total Speaks',
    'Avg Speaks',
    'Adjusted Speaks',
    'Opp Wins',
    'Opp Win %',
    'Aff Rounds',
    'Neg Rounds',
  ];

  const standingsData: (string | number)[][] = [standingsHeaders];

  standings.forEach((standing, index) => {
    const rank = standing.prelim_rank ?? standing.overall_rank ?? index + 1;
    standingsData.push([
      rank,
      getTeamName(standing),
      getSchoolName(standing),
      standing.wins,
      standing.losses,
      Math.round(standing.total_speaks * 10) / 10,
      Math.round(standing.avg_speaks * 100) / 100,
      Math.round(standing.adjusted_speaks * 10) / 10,
      standing.opp_wins,
      Math.round(standing.opp_win_pct * 1000) / 1000,
      standing.aff_rounds,
      standing.neg_rounds,
    ]);
  });

  const standingsSheet = XLSX.utils.aoa_to_sheet(standingsData);

  // Set column widths for readability
  standingsSheet['!cols'] = [
    { wch: 6 },  // Rank
    { wch: 30 }, // Team
    { wch: 25 }, // School
    { wch: 6 },  // Wins
    { wch: 7 },  // Losses
    { wch: 12 }, // Total Speaks
    { wch: 10 }, // Avg Speaks
    { wch: 14 }, // Adjusted Speaks
    { wch: 10 }, // Opp Wins
    { wch: 10 }, // Opp Win %
    { wch: 10 }, // Aff Rounds
    { wch: 10 }, // Neg Rounds
  ];

  const sheetName = options?.tournamentName
    ? `${options.tournamentName.slice(0, 20)} Standings`
    : 'Standings';

  XLSX.utils.book_append_sheet(wb, standingsSheet, sheetName.slice(0, 31));

  // Add round breakdown sheet if requested and data available
  if (options?.includeRoundBreakdown) {
    const roundsWithData = standings.filter(
      (s) => s.round_results && s.round_results.length > 0
    );

    if (roundsWithData.length > 0) {
      const roundHeaders = ['Team', 'Round', 'Side', 'Result', 'Speaks'];
      const roundData: (string | number)[][] = [roundHeaders];

      for (const standing of roundsWithData) {
        const teamName = getTeamName(standing);
        for (const result of standing.round_results || []) {
          roundData.push([
            teamName,
            result.round_number,
            result.side || '',
            result.result,
            result.total_speaks ?? '',
          ]);
        }
      }

      const roundSheet = XLSX.utils.aoa_to_sheet(roundData);
      roundSheet['!cols'] = [
        { wch: 30 }, // Team
        { wch: 8 },  // Round
        { wch: 6 },  // Side
        { wch: 12 }, // Result
        { wch: 10 }, // Speaks
      ];

      XLSX.utils.book_append_sheet(wb, roundSheet, 'Round Breakdown');
    }
  }

  return wb;
}

/**
 * Generate PDF-ready HTML for standings
 * Designed for browser print or PDF generation libraries
 *
 * @param standings - Array of standings with team info
 * @param options - Print options
 * @returns HTML string ready for printing
 *
 * @example
 * const html = generateStandingsPrintHTML(standings, { tournamentName: 'Nationals' });
 * window.open().document.write(html);
 */
export function generateStandingsPrintHTML(
  standings: StandingWithTeam[],
  options?: PrintHtmlOptions
): string {
  const title = options?.tournamentName
    ? `${options.tournamentName} - Standings`
    : 'Tournament Standings';

  const showSpeaks = options?.showSpeakerPoints !== false; // Default to true

  const tableHeaders = showSpeaks
    ? `<th>Rank</th><th>Team</th><th>School</th><th>Record</th><th>Speaks</th><th>Avg</th><th>Opp Wins</th>`
    : `<th>Rank</th><th>Team</th><th>School</th><th>Record</th><th>Opp Wins</th>`;

  const tableRows = standings
    .map((standing, index) => {
      const rank = standing.prelim_rank ?? standing.overall_rank ?? index + 1;
      const team = escapeHtml(getTeamName(standing));
      const school = escapeHtml(getSchoolName(standing));
      const record = formatRecord(standing.wins, standing.losses);
      const speaks = standing.total_speaks.toFixed(1);
      const avgSpeaks = standing.avg_speaks.toFixed(2);
      const oppWins = standing.opp_wins;

      if (showSpeaks) {
        return `<tr>
          <td>${rank}</td>
          <td>${team}</td>
          <td>${school}</td>
          <td>${record}</td>
          <td>${speaks}</td>
          <td>${avgSpeaks}</td>
          <td>${oppWins}</td>
        </tr>`;
      } else {
        return `<tr>
          <td>${rank}</td>
          <td>${team}</td>
          <td>${school}</td>
          <td>${record}</td>
          <td>${oppWins}</td>
        </tr>`;
      }
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 10px;
    }
    .timestamp {
      text-align: center;
      color: #666;
      margin-bottom: 20px;
      font-size: 0.9em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    tr:hover {
      background-color: #f0f0f0;
    }
    td:first-child {
      text-align: center;
      font-weight: 600;
    }
    @media print {
      body {
        padding: 0;
      }
      table {
        font-size: 10pt;
      }
      th, td {
        padding: 4px 8px;
      }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        ${tableHeaders}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Parses a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parses CSV content into rows
 */
function parseCSV(content: string): string[][] {
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((line) => line.trim() !== '');

  return lines.map(parseCSVLine);
}

/**
 * Parse Tabbycat teams CSV export
 *
 * Expected columns: Name, Institution, Speakers (comma-separated within quotes)
 *
 * @param csvContent - Raw CSV string content
 * @returns Array of parsed teams
 *
 * @example
 * const teams = parseTabbycatTeamsCSV(csvContent);
 * // [{ name: 'Smith/Jones', institution: 'Central High', speakers: ['John Smith', 'Jane Jones'] }]
 */
export function parseTabbycatTeamsCSV(csvContent: string): ParsedTeam[] {
  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    return [];
  }

  // Find header row and column indices
  const headerRow = rows[0].map((h) => h.toLowerCase().trim());
  const nameIndex = headerRow.findIndex(
    (h) => h === 'name' || h === 'team' || h === 'team name'
  );
  const institutionIndex = headerRow.findIndex(
    (h) => h === 'institution' || h === 'school' || h === 'organization'
  );
  const speakersIndex = headerRow.findIndex(
    (h) => h === 'speakers' || h === 'members' || h === 'debaters'
  );
  const divisionIndex = headerRow.findIndex(
    (h) => h === 'division' || h === 'category'
  );

  // If we can't find required columns, return empty
  if (nameIndex === -1) {
    return [];
  }

  const teams: ParsedTeam[] = [];

  // Process data rows (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIndex]?.trim() || '';

    if (!name) {
      continue; // Skip rows without a team name
    }

    const institution =
      institutionIndex !== -1 ? row[institutionIndex]?.trim() || '' : '';

    let speakers: string[] = [];
    if (speakersIndex !== -1 && row[speakersIndex]) {
      // Speakers are comma-separated within the field
      speakers = row[speakersIndex]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '');
    }

    const division =
      divisionIndex !== -1 ? row[divisionIndex]?.trim() || undefined : undefined;

    teams.push({
      name,
      institution,
      speakers,
      division,
    });
  }

  return teams;
}

/**
 * Parse Tabbycat results CSV
 *
 * Expected columns: Round, Room, Aff, Neg, Winner, Aff Speaks, Neg Speaks
 *
 * @param csvContent - Raw CSV string content
 * @returns Array of parsed results
 *
 * @example
 * const results = parseTabbycatResultsCSV(csvContent);
 * // [{ roundNumber: 1, affTeam: 'Smith/Jones', negTeam: 'Brown/Davis', winner: 'aff', ... }]
 */
export function parseTabbycatResultsCSV(csvContent: string): ParsedResult[] {
  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    return [];
  }

  // Find header row and column indices
  const headerRow = rows[0].map((h) => h.toLowerCase().trim());
  const roundIndex = headerRow.findIndex(
    (h) => h === 'round' || h === 'round number' || h === 'rd'
  );
  const roomIndex = headerRow.findIndex(
    (h) => h === 'room' || h === 'venue' || h === 'location'
  );
  const affIndex = headerRow.findIndex(
    (h) => h === 'aff' || h === 'affirmative' || h === 'prop' || h === 'proposition'
  );
  const negIndex = headerRow.findIndex(
    (h) => h === 'neg' || h === 'negative' || h === 'opp' || h === 'opposition'
  );
  const winnerIndex = headerRow.findIndex(
    (h) => h === 'winner' || h === 'result' || h === 'decision'
  );
  const affSpeaksIndex = headerRow.findIndex(
    (h) =>
      h === 'aff speaks' ||
      h === 'aff speaker points' ||
      h === 'affirmative speaks' ||
      h === 'prop speaks'
  );
  const negSpeaksIndex = headerRow.findIndex(
    (h) =>
      h === 'neg speaks' ||
      h === 'neg speaker points' ||
      h === 'negative speaks' ||
      h === 'opp speaks'
  );

  // Required columns
  if (roundIndex === -1 || affIndex === -1 || negIndex === -1) {
    return [];
  }

  const results: ParsedResult[] = [];

  // Process data rows (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const roundStr = row[roundIndex]?.trim();
    const roundNumber = parseInt(roundStr, 10);

    if (isNaN(roundNumber) || roundNumber <= 0) {
      continue; // Skip invalid round numbers
    }

    const affTeam = row[affIndex]?.trim() || '';
    const negTeam = row[negIndex]?.trim() || '';

    if (!affTeam || !negTeam) {
      continue; // Skip rows without both teams
    }

    const room = roomIndex !== -1 ? row[roomIndex]?.trim() || undefined : undefined;

    let winner: 'aff' | 'neg' | null = null;
    if (winnerIndex !== -1) {
      const winnerStr = row[winnerIndex]?.trim().toLowerCase();
      if (
        winnerStr === 'aff' ||
        winnerStr === 'affirmative' ||
        winnerStr === 'prop' ||
        winnerStr === 'proposition'
      ) {
        winner = 'aff';
      } else if (
        winnerStr === 'neg' ||
        winnerStr === 'negative' ||
        winnerStr === 'opp' ||
        winnerStr === 'opposition'
      ) {
        winner = 'neg';
      } else if (winnerStr === affTeam.toLowerCase()) {
        winner = 'aff';
      } else if (winnerStr === negTeam.toLowerCase()) {
        winner = 'neg';
      }
    }

    let affSpeaks: number | undefined;
    if (affSpeaksIndex !== -1 && row[affSpeaksIndex]) {
      const parsed = parseFloat(row[affSpeaksIndex]);
      if (!isNaN(parsed)) {
        affSpeaks = parsed;
      }
    }

    let negSpeaks: number | undefined;
    if (negSpeaksIndex !== -1 && row[negSpeaksIndex]) {
      const parsed = parseFloat(row[negSpeaksIndex]);
      if (!isNaN(parsed)) {
        negSpeaks = parsed;
      }
    }

    results.push({
      roundNumber,
      room,
      affTeam,
      negTeam,
      winner,
      affSpeaks,
      negSpeaks,
    });
  }

  return results;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate import data before processing
 *
 * Validation rules:
 * - Team names: Required, non-empty
 * - Speaks: Must be numeric if present, within valid range (0-100)
 * - Winner: Must be 'aff', 'neg', or empty
 * - Round number: Must be positive integer
 * - Warnings: Duplicate team names, missing speaks for completed rounds
 *
 * @param data - Array of parsed teams or results
 * @param type - Type of data being validated
 * @returns ValidationResult with errors and warnings
 *
 * @example
 * const result = validateImportData(teams, 'teams');
 * if (!result.valid) {
 *   console.error('Errors:', result.errors);
 * }
 */
export function validateImportData(
  data: ParsedTeam[] | ParsedResult[],
  type: 'teams' | 'results'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (type === 'teams') {
    const teams = data as ParsedTeam[];
    const seenNames = new Set<string>();

    teams.forEach((team, index) => {
      const row = index + 2; // Account for header row, 1-indexed

      // Required: team name
      if (!team.name || team.name.trim() === '') {
        errors.push({
          row,
          field: 'name',
          message: 'Team name is required',
        });
      } else {
        // Check for duplicates
        const normalizedName = team.name.toLowerCase().trim();
        if (seenNames.has(normalizedName)) {
          warnings.push({
            row,
            field: 'name',
            message: `Duplicate team name: "${team.name}"`,
          });
        }
        seenNames.add(normalizedName);
      }

      // Warn if no speakers listed
      if (!team.speakers || team.speakers.length === 0) {
        warnings.push({
          row,
          field: 'speakers',
          message: 'No speakers listed for team',
        });
      }
    });
  } else {
    const results = data as ParsedResult[];
    const roundTeams = new Map<number, Set<string>>();

    results.forEach((result, index) => {
      const row = index + 2; // Account for header row, 1-indexed

      // Required: round number must be positive
      if (!result.roundNumber || result.roundNumber <= 0) {
        errors.push({
          row,
          field: 'roundNumber',
          message: 'Round number must be a positive integer',
        });
      }

      // Required: aff team
      if (!result.affTeam || result.affTeam.trim() === '') {
        errors.push({
          row,
          field: 'affTeam',
          message: 'Affirmative team name is required',
        });
      }

      // Required: neg team
      if (!result.negTeam || result.negTeam.trim() === '') {
        errors.push({
          row,
          field: 'negTeam',
          message: 'Negative team name is required',
        });
      }

      // Validate speaks range if present
      if (result.affSpeaks !== undefined) {
        if (result.affSpeaks < 0 || result.affSpeaks > 100) {
          errors.push({
            row,
            field: 'affSpeaks',
            message: `Invalid speaker points: ${result.affSpeaks}. Must be between 0 and 100.`,
          });
        }
      }

      if (result.negSpeaks !== undefined) {
        if (result.negSpeaks < 0 || result.negSpeaks > 100) {
          errors.push({
            row,
            field: 'negSpeaks',
            message: `Invalid speaker points: ${result.negSpeaks}. Must be between 0 and 100.`,
          });
        }
      }

      // Warn if winner is set but speaks are missing
      if (result.winner !== null) {
        if (result.affSpeaks === undefined) {
          warnings.push({
            row,
            field: 'affSpeaks',
            message: 'Missing speaker points for completed round (aff)',
          });
        }
        if (result.negSpeaks === undefined) {
          warnings.push({
            row,
            field: 'negSpeaks',
            message: 'Missing speaker points for completed round (neg)',
          });
        }
      }

      // Check for duplicate teams in same round
      if (result.roundNumber > 0) {
        if (!roundTeams.has(result.roundNumber)) {
          roundTeams.set(result.roundNumber, new Set());
        }
        const teams = roundTeams.get(result.roundNumber)!;

        const affNormalized = result.affTeam.toLowerCase().trim();
        const negNormalized = result.negTeam.toLowerCase().trim();

        if (teams.has(affNormalized)) {
          warnings.push({
            row,
            field: 'affTeam',
            message: `Team "${result.affTeam}" appears multiple times in round ${result.roundNumber}`,
          });
        }
        if (teams.has(negNormalized)) {
          warnings.push({
            row,
            field: 'negTeam',
            message: `Team "${result.negTeam}" appears multiple times in round ${result.roundNumber}`,
          });
        }

        teams.add(affNormalized);
        teams.add(negNormalized);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Downloads a file with the given content
 *
 * @param content - File content
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type of the content
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads standings as CSV
 */
export function downloadStandingsCSV(
  standings: StandingWithTeam[],
  filename: string = 'standings.csv'
): void {
  const csv = exportStandingsToCSV(standings);
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Downloads standings as JSON
 */
export function downloadStandingsJSON(
  standings: StandingWithTeam[],
  tournamentName?: string,
  filename: string = 'standings.json'
): void {
  const json = exportStandingsToJSON(standings, tournamentName);
  downloadFile(json, filename, 'application/json');
}

/**
 * Downloads standings as Excel
 */
export function downloadStandingsExcel(
  standings: StandingWithTeam[],
  options?: ExcelExportOptions,
  filename: string = 'standings.xlsx'
): void {
  const wb = exportStandingsToExcel(standings, options);
  XLSX.writeFile(wb, filename);
}

/**
 * Opens print dialog with standings HTML
 */
export function printStandings(
  standings: StandingWithTeam[],
  options?: PrintHtmlOptions
): void {
  const html = generateStandingsPrintHTML(standings, options);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Reads file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
