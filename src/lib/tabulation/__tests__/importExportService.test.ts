/**
 * Tests for the Import/Export Service
 *
 * Comprehensive test suite covering:
 * - CSV export with various data types
 * - JSON export with metadata
 * - Excel export functionality
 * - Tabbycat CSV import parsing
 * - Validation for import data
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import {
  exportStandingsToCSV,
  exportStandingsToJSON,
  exportStandingsToExcel,
  generateStandingsPrintHTML,
  parseTabbycatTeamsCSV,
  parseTabbycatResultsCSV,
  validateImportData,
  type ParsedTeam,
  type ParsedResult,
  type StandingsExportJson,
} from '../importExportService';
import type { StandingWithTeam, ComputedStanding } from '@/types/tabulation';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Factory function to create test standings with sensible defaults
 */
function createStanding(overrides: Partial<ComputedStanding> = {}): ComputedStanding {
  return {
    id: `standing-${Math.random().toString(36).slice(2, 9)}`,
    tournament_id: 'tournament-1',
    event_id: 'event-1',
    registration_id: `reg-${Math.random().toString(36).slice(2, 9)}`,
    wins: 0,
    losses: 0,
    byes: 0,
    forfeits_given: 0,
    forfeits_received: 0,
    total_speaks: 0,
    avg_speaks: 0,
    adjusted_speaks: 0,
    double_adjusted_speaks: 0,
    total_ranks: 0,
    avg_ranks: 0,
    adjusted_ranks: 0,
    double_adjusted_ranks: 0,
    opp_wins: 0,
    opp_win_pct: 0,
    aff_rounds: 0,
    neg_rounds: 0,
    prelim_rank: null,
    overall_rank: null,
    is_breaking: false,
    break_seed: null,
    rounds_completed: 0,
    last_computed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Factory function to create test standing with team info
 */
function createStandingWithTeam(
  overrides: Partial<ComputedStanding> = {},
  registration: Partial<StandingWithTeam['registration']> = {}
): StandingWithTeam {
  return {
    ...createStanding(overrides),
    registration: {
      id: `reg-${Math.random().toString(36).slice(2, 9)}`,
      participant_name: 'John Smith',
      partner_name: null,
      school_organization: 'Test School',
      ...registration,
    },
  };
}

/**
 * Create a set of sample standings for testing
 */
function createSampleStandings(): StandingWithTeam[] {
  return [
    createStandingWithTeam(
      {
        wins: 5,
        losses: 0,
        total_speaks: 142.5,
        avg_speaks: 28.5,
        adjusted_speaks: 114.0,
        opp_wins: 12,
        opp_win_pct: 0.6,
        prelim_rank: 1,
        aff_rounds: 3,
        neg_rounds: 2,
      },
      {
        participant_name: 'John Smith',
        partner_name: 'Jane Jones',
        school_organization: 'Central High School',
      }
    ),
    createStandingWithTeam(
      {
        wins: 4,
        losses: 1,
        total_speaks: 138.0,
        avg_speaks: 27.6,
        adjusted_speaks: 110.4,
        opp_wins: 14,
        opp_win_pct: 0.7,
        prelim_rank: 2,
        aff_rounds: 2,
        neg_rounds: 3,
      },
      {
        participant_name: 'Bob Brown',
        partner_name: 'Alice Davis',
        school_organization: 'North Academy',
      }
    ),
    createStandingWithTeam(
      {
        wins: 3,
        losses: 2,
        total_speaks: 130.0,
        avg_speaks: 26.0,
        adjusted_speaks: 104.0,
        opp_wins: 10,
        opp_win_pct: 0.5,
        prelim_rank: 3,
        aff_rounds: 3,
        neg_rounds: 2,
      },
      {
        participant_name: 'Charlie Wilson',
        partner_name: null,
        school_organization: 'West Prep',
      }
    ),
  ];
}

// ============================================================================
// Test 1: CSV export with full standings
// ============================================================================
describe('exportStandingsToCSV - full standings', () => {
  it('should export standings with correct headers', () => {
    const standings = createSampleStandings();
    const csv = exportStandingsToCSV(standings);

    const lines = csv.split('\n');
    const headers = lines[0];

    expect(headers).toContain('Rank');
    expect(headers).toContain('Team');
    expect(headers).toContain('School');
    expect(headers).toContain('Record');
    expect(headers).toContain('Total Speaks');
    expect(headers).toContain('Avg Speaks');
    expect(headers).toContain('Adj Speaks');
    expect(headers).toContain('Opp Wins');
    expect(headers).toContain('Opp Win %');
  });

  it('should export correct data for each standing', () => {
    const standings = createSampleStandings();
    const csv = exportStandingsToCSV(standings);

    const lines = csv.split('\n');

    // Check first data row (rank 1)
    expect(lines[1]).toContain('1');
    expect(lines[1]).toContain('John Smith & Jane Jones');
    expect(lines[1]).toContain('Central High School');
    expect(lines[1]).toContain('5-0');
    expect(lines[1]).toContain('142.5');

    // Check second data row (rank 2)
    expect(lines[2]).toContain('2');
    expect(lines[2]).toContain('Bob Brown & Alice Davis');
    expect(lines[2]).toContain('North Academy');
    expect(lines[2]).toContain('4-1');
  });

  it('should handle solo debaters (no partner)', () => {
    const standings = createSampleStandings();
    const csv = exportStandingsToCSV(standings);

    // Charlie Wilson has no partner
    expect(csv).toContain('Charlie Wilson');
    expect(csv).not.toContain('Charlie Wilson &');
  });
});

// ============================================================================
// Test 2: CSV export handles special characters
// ============================================================================
describe('exportStandingsToCSV - special characters', () => {
  it('should escape values containing commas', () => {
    const standings = [
      createStandingWithTeam(
        { wins: 3, losses: 2, total_speaks: 100, avg_speaks: 20, adjusted_speaks: 80, opp_wins: 5, opp_win_pct: 0.5 },
        {
          participant_name: 'Smith, Jr.',
          partner_name: 'Jones',
          school_organization: 'Academy of Arts, Sciences, and Letters',
        }
      ),
    ];

    const csv = exportStandingsToCSV(standings);

    // Values with commas should be quoted
    expect(csv).toContain('"Smith, Jr. & Jones"');
    expect(csv).toContain('"Academy of Arts, Sciences, and Letters"');
  });

  it('should escape values containing quotes', () => {
    const standings = [
      createStandingWithTeam(
        { wins: 3, losses: 2, total_speaks: 100, avg_speaks: 20, adjusted_speaks: 80, opp_wins: 5, opp_win_pct: 0.5 },
        {
          participant_name: 'John "The Debater" Smith',
          partner_name: 'Jane',
          school_organization: 'Test School',
        }
      ),
    ];

    const csv = exportStandingsToCSV(standings);

    // Quotes should be doubled and value should be wrapped in quotes
    expect(csv).toContain('""The Debater""');
  });

  it('should handle newlines in values', () => {
    const standings = [
      createStandingWithTeam(
        { wins: 3, losses: 2, total_speaks: 100, avg_speaks: 20, adjusted_speaks: 80, opp_wins: 5, opp_win_pct: 0.5 },
        {
          participant_name: 'John Smith',
          partner_name: 'Jane',
          school_organization: 'Test School\nMultiline',
        }
      ),
    ];

    const csv = exportStandingsToCSV(standings);

    // Should be quoted
    expect(csv).toContain('"Test School\nMultiline"');
  });
});

// ============================================================================
// Test 3: JSON export with metadata
// ============================================================================
describe('exportStandingsToJSON - metadata', () => {
  it('should include exportedAt timestamp', () => {
    const standings = createSampleStandings();
    const json = exportStandingsToJSON(standings, 'Test Tournament');
    const parsed: StandingsExportJson = JSON.parse(json);

    expect(parsed.exportedAt).toBeDefined();
    expect(new Date(parsed.exportedAt).getTime()).not.toBeNaN();
  });

  it('should include tournament name when provided', () => {
    const standings = createSampleStandings();
    const json = exportStandingsToJSON(standings, 'Winter Classic 2024');
    const parsed: StandingsExportJson = JSON.parse(json);

    expect(parsed.tournamentName).toBe('Winter Classic 2024');
  });

  it('should export correct standing data', () => {
    const standings = createSampleStandings();
    const json = exportStandingsToJSON(standings);
    const parsed: StandingsExportJson = JSON.parse(json);

    expect(parsed.standings).toHaveLength(3);
    expect(parsed.standings[0].rank).toBe(1);
    expect(parsed.standings[0].team).toBe('John Smith & Jane Jones');
    expect(parsed.standings[0].wins).toBe(5);
    expect(parsed.standings[0].losses).toBe(0);
    expect(parsed.standings[0].totalSpeaks).toBe(142.5);
  });

  it('should produce valid JSON', () => {
    const standings = createSampleStandings();
    const json = exportStandingsToJSON(standings);

    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ============================================================================
// Test 4: Excel export creates valid workbook
// ============================================================================
describe('exportStandingsToExcel - workbook creation', () => {
  it('should create a valid XLSX workbook', () => {
    const standings = createSampleStandings();
    const wb = exportStandingsToExcel(standings);

    expect(wb).toBeDefined();
    expect(wb.SheetNames).toBeDefined();
    expect(wb.SheetNames.length).toBeGreaterThan(0);
  });

  it('should create standings sheet with correct headers', () => {
    const standings = createSampleStandings();
    const wb = exportStandingsToExcel(standings);

    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    const headers = data[0];
    expect(headers).toContain('Rank');
    expect(headers).toContain('Team');
    expect(headers).toContain('School');
    expect(headers).toContain('Wins');
    expect(headers).toContain('Losses');
  });

  it('should include tournament name in sheet name when provided', () => {
    const standings = createSampleStandings();
    const wb = exportStandingsToExcel(standings, { tournamentName: 'Regionals' });

    expect(wb.SheetNames[0]).toContain('Regionals');
  });

  it('should include correct data rows', () => {
    const standings = createSampleStandings();
    const wb = exportStandingsToExcel(standings);

    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    // Header + 3 data rows
    expect(data.length).toBe(4);
  });
});

// ============================================================================
// Test 5: Tabbycat teams CSV parsing
// ============================================================================
describe('parseTabbycatTeamsCSV - teams parsing', () => {
  it('should parse teams with standard columns', () => {
    const csv = `Name,Institution,Speakers
"Smith/Jones",Central High,"John Smith, Jane Jones"
"Brown/Davis",North Academy,"Bob Brown, Alice Davis"`;

    const teams = parseTabbycatTeamsCSV(csv);

    expect(teams).toHaveLength(2);
    expect(teams[0].name).toBe('Smith/Jones');
    expect(teams[0].institution).toBe('Central High');
    expect(teams[0].speakers).toEqual(['John Smith', 'Jane Jones']);
  });

  it('should handle alternative column names', () => {
    const csv = `Team,School,Members
TeamA,School A,"Speaker 1, Speaker 2"`;

    const teams = parseTabbycatTeamsCSV(csv);

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe('TeamA');
    expect(teams[0].institution).toBe('School A');
  });

  it('should handle optional division column', () => {
    const csv = `Name,Institution,Speakers,Division
TeamA,School A,"Speaker 1",Varsity
TeamB,School B,"Speaker 2",JV`;

    const teams = parseTabbycatTeamsCSV(csv);

    expect(teams[0].division).toBe('Varsity');
    expect(teams[1].division).toBe('JV');
  });

  it('should skip rows without team names', () => {
    const csv = `Name,Institution,Speakers
TeamA,School A,"Speaker 1"
,School B,"Speaker 2"
TeamC,School C,"Speaker 3"`;

    const teams = parseTabbycatTeamsCSV(csv);

    expect(teams).toHaveLength(2);
    expect(teams[0].name).toBe('TeamA');
    expect(teams[1].name).toBe('TeamC');
  });
});

// ============================================================================
// Test 6: Tabbycat results CSV parsing
// ============================================================================
describe('parseTabbycatResultsCSV - results parsing', () => {
  it('should parse results with standard columns', () => {
    const csv = `Round,Room,Aff,Neg,Winner,Aff Speaks,Neg Speaks
1,Room 1,Smith/Jones,Brown/Davis,aff,28.5,27.0
1,Room 2,Wilson/Lee,Taylor/Clark,neg,26.5,29.0`;

    const results = parseTabbycatResultsCSV(csv);

    expect(results).toHaveLength(2);
    expect(results[0].roundNumber).toBe(1);
    expect(results[0].room).toBe('Room 1');
    expect(results[0].affTeam).toBe('Smith/Jones');
    expect(results[0].negTeam).toBe('Brown/Davis');
    expect(results[0].winner).toBe('aff');
    expect(results[0].affSpeaks).toBe(28.5);
    expect(results[0].negSpeaks).toBe(27.0);
  });

  it('should handle alternative winner values', () => {
    const csv = `Round,Aff,Neg,Winner
1,TeamA,TeamB,affirmative
2,TeamC,TeamD,negative
3,TeamE,TeamF,prop
4,TeamG,TeamH,opp`;

    const results = parseTabbycatResultsCSV(csv);

    expect(results[0].winner).toBe('aff');
    expect(results[1].winner).toBe('neg');
    expect(results[2].winner).toBe('aff');
    expect(results[3].winner).toBe('neg');
  });

  it('should handle missing winner', () => {
    const csv = `Round,Aff,Neg,Winner
1,TeamA,TeamB,`;

    const results = parseTabbycatResultsCSV(csv);

    expect(results[0].winner).toBeNull();
  });

  it('should handle missing speaks', () => {
    const csv = `Round,Aff,Neg,Winner,Aff Speaks,Neg Speaks
1,TeamA,TeamB,aff,,`;

    const results = parseTabbycatResultsCSV(csv);

    expect(results[0].affSpeaks).toBeUndefined();
    expect(results[0].negSpeaks).toBeUndefined();
  });
});

// ============================================================================
// Test 7: Validation - missing required field
// ============================================================================
describe('validateImportData - missing required fields', () => {
  it('should error on missing team name', () => {
    const teams: ParsedTeam[] = [
      { name: '', institution: 'School A', speakers: ['Speaker 1'] },
    ];

    const result = validateImportData(teams, 'teams');

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('name');
    expect(result.errors[0].message).toContain('required');
  });

  it('should error on missing round number', () => {
    const results: ParsedResult[] = [
      { roundNumber: 0, affTeam: 'TeamA', negTeam: 'TeamB', winner: 'aff' },
    ];

    const result = validateImportData(results, 'results');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'roundNumber')).toBe(true);
  });

  it('should error on missing aff team', () => {
    const results: ParsedResult[] = [
      { roundNumber: 1, affTeam: '', negTeam: 'TeamB', winner: 'aff' },
    ];

    const result = validateImportData(results, 'results');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'affTeam')).toBe(true);
  });

  it('should error on missing neg team', () => {
    const results: ParsedResult[] = [
      { roundNumber: 1, affTeam: 'TeamA', negTeam: '', winner: 'aff' },
    ];

    const result = validateImportData(results, 'results');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'negTeam')).toBe(true);
  });
});

// ============================================================================
// Test 8: Validation - invalid speaks value
// ============================================================================
describe('validateImportData - invalid speaks', () => {
  it('should error on speaks below 0', () => {
    const results: ParsedResult[] = [
      { roundNumber: 1, affTeam: 'TeamA', negTeam: 'TeamB', winner: 'aff', affSpeaks: -5 },
    ];

    const result = validateImportData(results, 'results');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'affSpeaks')).toBe(true);
    expect(result.errors[0].message).toContain('between 0 and 100');
  });

  it('should error on speaks above 100', () => {
    const results: ParsedResult[] = [
      { roundNumber: 1, affTeam: 'TeamA', negTeam: 'TeamB', winner: 'neg', negSpeaks: 150 },
    ];

    const result = validateImportData(results, 'results');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'negSpeaks')).toBe(true);
  });

  it('should accept valid speaks values', () => {
    const results: ParsedResult[] = [
      { roundNumber: 1, affTeam: 'TeamA', negTeam: 'TeamB', winner: 'aff', affSpeaks: 28.5, negSpeaks: 27.0 },
    ];

    const result = validateImportData(results, 'results');

    expect(result.errors.filter((e) => e.field.includes('Speaks'))).toHaveLength(0);
  });
});

// ============================================================================
// Test 9: Validation - duplicate team warning
// ============================================================================
describe('validateImportData - duplicate warnings', () => {
  it('should warn on duplicate team names', () => {
    const teams: ParsedTeam[] = [
      { name: 'TeamA', institution: 'School A', speakers: ['Speaker 1'] },
      { name: 'TeamA', institution: 'School B', speakers: ['Speaker 2'] },
    ];

    const result = validateImportData(teams, 'teams');

    expect(result.valid).toBe(true); // Warnings don't invalidate
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain('Duplicate');
  });

  it('should warn on team appearing multiple times in same round', () => {
    const results: ParsedResult[] = [
      { roundNumber: 1, affTeam: 'TeamA', negTeam: 'TeamB', winner: 'aff' },
      { roundNumber: 1, affTeam: 'TeamA', negTeam: 'TeamC', winner: 'neg' },
    ];

    const result = validateImportData(results, 'results');

    expect(result.warnings.some((w) => w.message.includes('multiple times'))).toBe(true);
  });

  it('should warn on missing speaks for completed round', () => {
    const results: ParsedResult[] = [
      { roundNumber: 1, affTeam: 'TeamA', negTeam: 'TeamB', winner: 'aff' },
    ];

    const result = validateImportData(results, 'results');

    expect(result.warnings.some((w) => w.field === 'affSpeaks')).toBe(true);
    expect(result.warnings.some((w) => w.field === 'negSpeaks')).toBe(true);
  });
});

// ============================================================================
// Test 10: Empty input handling
// ============================================================================
describe('Empty input handling', () => {
  it('should handle empty standings array for CSV export', () => {
    const csv = exportStandingsToCSV([]);

    // Should still have headers
    expect(csv).toContain('Rank');
    const lines = csv.split('\n');
    expect(lines.length).toBe(1); // Only header
  });

  it('should handle empty standings array for JSON export', () => {
    const json = exportStandingsToJSON([]);
    const parsed: StandingsExportJson = JSON.parse(json);

    expect(parsed.standings).toHaveLength(0);
    expect(parsed.exportedAt).toBeDefined();
  });

  it('should handle empty standings array for Excel export', () => {
    const wb = exportStandingsToExcel([]);

    expect(wb.SheetNames.length).toBeGreaterThan(0);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    expect(data.length).toBe(1); // Only header
  });

  it('should return empty array for empty CSV content', () => {
    const teams = parseTabbycatTeamsCSV('');
    expect(teams).toHaveLength(0);

    const results = parseTabbycatResultsCSV('');
    expect(results).toHaveLength(0);
  });

  it('should validate empty arrays without errors', () => {
    const teamsResult = validateImportData([], 'teams');
    expect(teamsResult.valid).toBe(true);
    expect(teamsResult.errors).toHaveLength(0);

    const resultsResult = validateImportData([], 'results');
    expect(resultsResult.valid).toBe(true);
    expect(resultsResult.errors).toHaveLength(0);
  });
});

// ============================================================================
// Test 11: Malformed CSV handling
// ============================================================================
describe('Malformed CSV handling', () => {
  it('should handle CSV with only headers', () => {
    const csv = 'Name,Institution,Speakers';
    const teams = parseTabbycatTeamsCSV(csv);

    expect(teams).toHaveLength(0);
  });

  it('should handle CSV with missing columns', () => {
    const csv = `Name
TeamA
TeamB`;

    const teams = parseTabbycatTeamsCSV(csv);

    expect(teams).toHaveLength(2);
    expect(teams[0].institution).toBe('');
    expect(teams[0].speakers).toHaveLength(0);
  });

  it('should handle unclosed quotes gracefully', () => {
    const csv = `Name,Institution,Speakers
"TeamA,School A,"Speaker 1`;

    // Should not throw
    expect(() => parseTabbycatTeamsCSV(csv)).not.toThrow();
  });

  it('should handle various line endings', () => {
    const csvCRLF = 'Name,Institution\r\nTeamA,School A\r\nTeamB,School B';
    const csvCR = 'Name,Institution\rTeamA,School A\rTeamB,School B';
    const csvLF = 'Name,Institution\nTeamA,School A\nTeamB,School B';

    expect(parseTabbycatTeamsCSV(csvCRLF)).toHaveLength(2);
    expect(parseTabbycatTeamsCSV(csvCR)).toHaveLength(2);
    expect(parseTabbycatTeamsCSV(csvLF)).toHaveLength(2);
  });

  it('should skip blank lines', () => {
    const csv = `Name,Institution

TeamA,School A

TeamB,School B

`;

    const teams = parseTabbycatTeamsCSV(csv);
    expect(teams).toHaveLength(2);
  });
});

// ============================================================================
// Test 12: Large dataset (100+ teams)
// ============================================================================
describe('Large dataset handling', () => {
  it('should handle 100+ teams in CSV export', () => {
    const standings: StandingWithTeam[] = [];

    for (let i = 0; i < 150; i++) {
      standings.push(
        createStandingWithTeam(
          {
            wins: Math.floor(Math.random() * 6),
            losses: Math.floor(Math.random() * 6),
            total_speaks: 100 + Math.random() * 50,
            avg_speaks: 20 + Math.random() * 10,
            adjusted_speaks: 80 + Math.random() * 40,
            opp_wins: Math.floor(Math.random() * 20),
            opp_win_pct: Math.random(),
            prelim_rank: i + 1,
          },
          {
            participant_name: `Speaker ${i + 1}A`,
            partner_name: `Speaker ${i + 1}B`,
            school_organization: `School ${Math.floor(i / 10) + 1}`,
          }
        )
      );
    }

    const csv = exportStandingsToCSV(standings);
    const lines = csv.split('\n');

    expect(lines.length).toBe(151); // 1 header + 150 data rows
  });

  it('should handle 100+ teams in JSON export', () => {
    const standings: StandingWithTeam[] = [];

    for (let i = 0; i < 150; i++) {
      standings.push(
        createStandingWithTeam(
          { wins: i % 6, prelim_rank: i + 1 },
          { participant_name: `Team ${i + 1}`, school_organization: `School ${i}` }
        )
      );
    }

    const json = exportStandingsToJSON(standings);
    const parsed: StandingsExportJson = JSON.parse(json);

    expect(parsed.standings).toHaveLength(150);
  });

  it('should handle 100+ teams in Excel export', () => {
    const standings: StandingWithTeam[] = [];

    for (let i = 0; i < 150; i++) {
      standings.push(
        createStandingWithTeam(
          { wins: i % 6, prelim_rank: i + 1 },
          { participant_name: `Team ${i + 1}`, school_organization: `School ${i}` }
        )
      );
    }

    const wb = exportStandingsToExcel(standings);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(data.length).toBe(151); // 1 header + 150 data rows
  });

  it('should handle 100+ teams in CSV import', () => {
    let csv = 'Name,Institution,Speakers\n';

    for (let i = 0; i < 150; i++) {
      csv += `"Team ${i + 1}",School ${i % 50},"Speaker A, Speaker B"\n`;
    }

    const teams = parseTabbycatTeamsCSV(csv);

    expect(teams).toHaveLength(150);
  });

  it('should handle 100+ results in CSV import', () => {
    let csv = 'Round,Aff,Neg,Winner,Aff Speaks,Neg Speaks\n';

    for (let i = 0; i < 150; i++) {
      const round = Math.floor(i / 30) + 1;
      csv += `${round},Team ${i * 2},Team ${i * 2 + 1},aff,28.0,27.0\n`;
    }

    const results = parseTabbycatResultsCSV(csv);

    expect(results).toHaveLength(150);
  });
});

// ============================================================================
// Additional Tests: Print HTML generation
// ============================================================================
describe('generateStandingsPrintHTML', () => {
  it('should generate valid HTML document', () => {
    const standings = createSampleStandings();
    const html = generateStandingsPrintHTML(standings);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('<head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</html>');
  });

  it('should include tournament name in title', () => {
    const standings = createSampleStandings();
    const html = generateStandingsPrintHTML(standings, { tournamentName: 'Nationals 2024' });

    expect(html).toContain('Nationals 2024');
    expect(html).toContain('<title>Nationals 2024 - Standings</title>');
  });

  it('should include standings data in table', () => {
    const standings = createSampleStandings();
    const html = generateStandingsPrintHTML(standings);

    expect(html).toContain('John Smith');
    expect(html).toContain('Central High School');
    expect(html).toContain('5-0');
  });

  it('should hide speaker points when option is false', () => {
    const standings = createSampleStandings();
    const html = generateStandingsPrintHTML(standings, { showSpeakerPoints: false });

    expect(html).not.toContain('<th>Speaks</th>');
    expect(html).not.toContain('<th>Avg</th>');
  });

  it('should escape HTML characters', () => {
    const standings = [
      createStandingWithTeam(
        { wins: 1, losses: 0, total_speaks: 28, avg_speaks: 28, opp_wins: 3 },
        {
          participant_name: '<script>alert("xss")</script>',
          school_organization: 'Test & School',
        }
      ),
    ];

    const html = generateStandingsPrintHTML(standings);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Test &amp; School');
  });
});

// ============================================================================
// Additional Tests: Validation edge cases
// ============================================================================
describe('validateImportData - edge cases', () => {
  it('should warn on teams without speakers', () => {
    const teams: ParsedTeam[] = [
      { name: 'TeamA', institution: 'School A', speakers: [] },
    ];

    const result = validateImportData(teams, 'teams');

    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.field === 'speakers')).toBe(true);
  });

  it('should handle case-insensitive duplicate detection', () => {
    const teams: ParsedTeam[] = [
      { name: 'TeamA', institution: 'School A', speakers: ['S1'] },
      { name: 'TEAMA', institution: 'School B', speakers: ['S2'] },
    ];

    const result = validateImportData(teams, 'teams');

    expect(result.warnings.some((w) => w.message.includes('Duplicate'))).toBe(true);
  });

  it('should handle negative round numbers', () => {
    const results: ParsedResult[] = [
      { roundNumber: -1, affTeam: 'TeamA', negTeam: 'TeamB', winner: 'aff' },
    ];

    const result = validateImportData(results, 'results');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'roundNumber')).toBe(true);
  });

  it('should not warn on missing speaks when no winner', () => {
    const results: ParsedResult[] = [
      { roundNumber: 1, affTeam: 'TeamA', negTeam: 'TeamB', winner: null },
    ];

    const result = validateImportData(results, 'results');

    // No warnings about missing speaks since round isn't complete
    expect(result.warnings.filter((w) => w.field.includes('Speaks'))).toHaveLength(0);
  });
});
