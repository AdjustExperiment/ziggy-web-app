/**
 * Shared utility functions for formatting team names consistently across the application.
 */

export interface TeamInfo {
  participant_name: string;
  partner_name?: string | null;
  school_organization?: string | null;
}

/**
 * Formats a team name with partner and optional school.
 * Handles both individual and team formats.
 * 
 * @param team - The team information object
 * @param options - Formatting options
 * @returns Formatted team name string
 */
export function formatTeamName(
  team: TeamInfo | null | undefined,
  options: {
    includeSchool?: boolean;
    schoolSeparator?: string;
    partnerSeparator?: string;
  } = {}
): string {
  if (!team) return 'TBD';
  
  const {
    includeSchool = false,
    schoolSeparator = ' - ',
    partnerSeparator = ' & '
  } = options;
  
  const { participant_name, partner_name, school_organization } = team;
  
  // Build the name portion
  let name = participant_name || 'Unknown';
  
  if (partner_name) {
    name = `${name}${partnerSeparator}${partner_name}`;
  }
  
  // Optionally append school
  if (includeSchool && school_organization) {
    name = `${name}${schoolSeparator}${school_organization}`;
  }
  
  return name;
}

/**
 * Extracts last names from a team for conflict checking.
 * 
 * @param team - The team information object
 * @returns Array of last names
 */
export function getTeamLastNames(team: TeamInfo | null | undefined): string[] {
  if (!team) return [];
  
  const lastNames: string[] = [];
  
  if (team.participant_name) {
    const parts = team.participant_name.trim().split(' ');
    if (parts.length > 0) {
      lastNames.push(parts[parts.length - 1].toLowerCase());
    }
  }
  
  if (team.partner_name) {
    const parts = team.partner_name.trim().split(' ');
    if (parts.length > 0) {
      lastNames.push(parts[parts.length - 1].toLowerCase());
    }
  }
  
  return lastNames;
}

/**
 * Gets a short display name for a team (first name only or initials).
 * 
 * @param team - The team information object
 * @returns Short display name
 */
export function getTeamShortName(team: TeamInfo | null | undefined): string {
  if (!team?.participant_name) return 'TBD';
  
  const firstName = team.participant_name.split(' ')[0];
  
  if (team.partner_name) {
    const partnerFirstName = team.partner_name.split(' ')[0];
    return `${firstName} & ${partnerFirstName}`;
  }
  
  return firstName;
}

/**
 * Formats team name for bracket/tournament display.
 * Shows abbreviated format suitable for tight spaces.
 * 
 * @param team - The team information object
 * @returns Bracket-friendly team name
 */
export function formatBracketTeamName(team: TeamInfo | null | undefined): string {
  if (!team?.participant_name) return 'TBD';
  
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 3);
    return parts.map(p => p[0]).join('').toUpperCase();
  };
  
  if (team.partner_name) {
    const p1 = getInitials(team.participant_name);
    const p2 = getInitials(team.partner_name);
    return `${p1}/${p2}`;
  }
  
  // For individuals, show first initial + last name
  const parts = team.participant_name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}
