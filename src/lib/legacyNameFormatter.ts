/**
 * Legacy Name Formatting Utilities
 * Converts between Ziggy's name format and NCFCA TP's "LastName/LastName" format
 */

export interface MatchResult {
  registration: any;
  confidence: number; // 0-1
  matchType: 'exact' | 'lastName' | 'fuzzy';
}

/**
 * Extract last name from full name
 * "John Smith" → "Smith"
 * "Mary Jane Watson" → "Watson"
 */
export function extractLastName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || '';
}

/**
 * Convert participant + partner names to "LastName/LastName" format
 * "John Smith" + "Jane Doe" → "Smith/Doe"
 * "John Smith" + null → "Smith"
 */
export function toLastNameFormat(participantName: string, partnerName?: string | null): string {
  const lastName1 = extractLastName(participantName);
  
  if (!partnerName) {
    return lastName1;
  }
  
  const lastName2 = extractLastName(partnerName);
  return `${lastName1}/${lastName2}`;
}

/**
 * Parse "LastName/LastName" format back to component parts
 * "Smith/Doe" → { last1: "Smith", last2: "Doe" }
 * "Smith" → { last1: "Smith", last2: undefined }
 */
export function parseLastNameFormat(formatted: string): { last1: string; last2?: string } {
  if (!formatted) return { last1: '' };
  
  const parts = formatted.split('/');
  return {
    last1: parts[0]?.trim() || '',
    last2: parts[1]?.trim() || undefined,
  };
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  
  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[bLower.length][aLower.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function calculateSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - (distance / maxLen);
}

/**
 * Match an input team name against registered teams
 * Returns matches sorted by confidence (highest first)
 */
export function fuzzyMatchTeam(
  input: string,
  registrations: any[]
): MatchResult[] {
  if (!input || !registrations.length) return [];
  
  const inputNormalized = input.trim().toLowerCase();
  const inputParsed = parseLastNameFormat(input);
  
  const results: MatchResult[] = [];
  
  for (const reg of registrations) {
    const participantName = reg.participant_name || '';
    const partnerName = reg.partner_name || '';
    
    // Generate various formats to match against
    const legacyFormat = toLastNameFormat(participantName, partnerName).toLowerCase();
    const fullFormat = partnerName 
      ? `${participantName} / ${partnerName}`.toLowerCase()
      : participantName.toLowerCase();
    const participantOnly = participantName.toLowerCase();
    
    // Check for exact match on legacy format
    if (inputNormalized === legacyFormat) {
      results.push({ registration: reg, confidence: 1.0, matchType: 'exact' });
      continue;
    }
    
    // Check for exact match on participant name
    if (inputNormalized === participantOnly) {
      results.push({ registration: reg, confidence: 0.99, matchType: 'exact' });
      continue;
    }
    
    // Check for exact match on full format
    if (inputNormalized === fullFormat) {
      results.push({ registration: reg, confidence: 0.98, matchType: 'exact' });
      continue;
    }
    
    // Check last name match
    const regLast1 = extractLastName(participantName).toLowerCase();
    const regLast2 = partnerName ? extractLastName(partnerName).toLowerCase() : '';
    
    if (inputParsed.last1.toLowerCase() === regLast1 && 
        (!inputParsed.last2 || inputParsed.last2.toLowerCase() === regLast2)) {
      results.push({ registration: reg, confidence: 0.95, matchType: 'lastName' });
      continue;
    }
    
    // Fuzzy match
    const legacySimilarity = calculateSimilarity(inputNormalized, legacyFormat);
    const fullSimilarity = calculateSimilarity(inputNormalized, fullFormat);
    const bestSimilarity = Math.max(legacySimilarity, fullSimilarity);
    
    if (bestSimilarity > 0.6) {
      results.push({ registration: reg, confidence: bestSimilarity, matchType: 'fuzzy' });
    }
  }
  
  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get the best match for a team name, or null if no good match found
 */
export function getBestMatch(
  input: string,
  registrations: any[],
  minConfidence: number = 0.7
): MatchResult | null {
  const matches = fuzzyMatchTeam(input, registrations);
  if (matches.length === 0) return null;
  if (matches[0].confidence < minConfidence) return null;
  return matches[0];
}

/**
 * Format team name for display in legacy format
 */
export function formatTeamForLegacy(registration: any): string {
  return toLastNameFormat(
    registration.participant_name || '',
    registration.partner_name
  );
}

/**
 * Extract state from school/organization string
 * "Central High School, TX" → "TX"
 * "Lincoln Academy - California" → "CA" (if mapping exists)
 */
export function extractState(schoolOrg: string | null): string {
  if (!schoolOrg) return '';
  
  // Check for state abbreviation at end after comma
  const commaMatch = schoolOrg.match(/,\s*([A-Z]{2})\s*$/i);
  if (commaMatch) return commaMatch[1].toUpperCase();
  
  // Check for state abbreviation at end after dash
  const dashMatch = schoolOrg.match(/-\s*([A-Z]{2})\s*$/i);
  if (dashMatch) return dashMatch[1].toUpperCase();
  
  return '';
}

/**
 * Extract club name (organization without state)
 * "Central High School, TX" → "Central High School"
 */
export function extractClub(schoolOrg: string | null): string {
  if (!schoolOrg) return '';
  
  // Remove state suffix
  return schoolOrg
    .replace(/,\s*[A-Z]{2}\s*$/i, '')
    .replace(/-\s*[A-Z]{2}\s*$/i, '')
    .trim();
}
