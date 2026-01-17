/**
 * Ziggy E2E Test Helpers
 * Utility functions for common test operations
 */

import { Page, BrowserContext, expect } from '@playwright/test';
import { TestUser, TestTeam, TestTournament } from '../fixtures/test-data';
import { LoginPage, SignUpPage, NavigationBar } from './page-objects';

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Creates a new user account via the signup flow
 */
export async function createAccount(page: Page, user: TestUser): Promise<void> {
  const signUpPage = new SignUpPage(page);
  await signUpPage.goto();
  await signUpPage.signUp(user);

  // Wait for redirect or success indicator
  await page.waitForURL(/\/(dashboard|account|verify|login)/, { timeout: 15000 });
}

/**
 * Logs in a user via the login form
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAsUser(user);
  await loginPage.expectLoggedIn();
}

/**
 * Logs in or creates account if needed
 */
export async function ensureLoggedIn(page: Page, user: TestUser): Promise<void> {
  const nav = new NavigationBar(page);
  await page.goto('/');

  if (await nav.isLoggedIn()) {
    return;
  }

  try {
    await loginUser(page, user);
  } catch {
    // Account might not exist, try creating it
    await createAccount(page, user);
    await loginUser(page, user);
  }
}

/**
 * Logs out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  const nav = new NavigationBar(page);
  if (await nav.isLoggedIn()) {
    await nav.logout();
    await page.waitForURL(/\/(login|\/)/);
  }
}

/**
 * Stores authentication state for reuse across tests
 */
export async function saveAuthState(page: Page, path: string): Promise<void> {
  await page.context().storageState({ path });
}

/**
 * Creates a new context with saved authentication state
 */
export async function createAuthenticatedContext(
  context: BrowserContext,
  storageStatePath: string
): Promise<BrowserContext> {
  return await context.browser()!.newContext({
    storageState: storageStatePath
  });
}

// ============================================================================
// TOURNAMENT HELPERS
// ============================================================================

/**
 * Navigates to a tournament's page
 */
export async function navigateToTournament(page: Page, tournamentId: string): Promise<void> {
  await page.goto(`/tournaments/${tournamentId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Registers a team for a tournament
 */
export async function registerTeamForTournament(
  page: Page,
  tournamentId: string,
  team: TestTeam
): Promise<void> {
  await page.goto(`/tournaments/${tournamentId}/register`);
  await page.waitForLoadState('networkidle');

  // Fill registration form
  await page.getByLabel(/participant.*name|your.*name/i).fill(
    `${team.debater1.firstName} ${team.debater1.lastName}`
  );

  const partnerInput = page.getByLabel(/partner|teammate/i);
  if (await partnerInput.isVisible()) {
    await partnerInput.fill(`${team.debater2.firstName} ${team.debater2.lastName}`);
  }

  await page.getByLabel(/school|organization/i).fill(team.school);

  // Submit
  await page.getByRole('button', { name: /submit|register|add to cart/i }).click();
}

/**
 * Waits for tournament standings to update
 */
export async function waitForStandingsUpdate(page: Page, timeout = 30000): Promise<void> {
  await page.waitForResponse(
    response => response.url().includes('standings') && response.status() === 200,
    { timeout }
  );
}

// ============================================================================
// ADMIN HELPERS
// ============================================================================

/**
 * Creates a new tournament via the admin interface
 */
export async function createTournamentAsAdmin(
  page: Page,
  tournament: TestTournament
): Promise<string> {
  await page.goto('/admin');
  await page.getByRole('button', { name: /create.*tournament/i }).click();

  // Fill tournament details
  await page.getByLabel(/name/i).fill(tournament.name);
  await page.getByLabel(/format/i).selectOption(tournament.format);
  await page.getByLabel(/venue|location/i).fill(tournament.venue);
  await page.getByLabel(/entry.*fee|registration.*fee/i).fill(tournament.entryFee.toString());
  await page.getByLabel(/max.*teams/i).fill(tournament.maxTeams.toString());
  await page.getByLabel(/rounds/i).fill(tournament.rounds.toString());

  // Submit
  await page.getByRole('button', { name: /create|submit/i }).click();

  // Wait for tournament to be created and get ID from URL
  await page.waitForURL(/\/admin\/tournaments\/([^\/]+)/);
  const url = page.url();
  const match = url.match(/\/admin\/tournaments\/([^\/]+)/);
  return match ? match[1] : '';
}

/**
 * Generates pairings for a round
 */
export async function generateRoundPairings(
  page: Page,
  tournamentId: string,
  roundNumber: number
): Promise<void> {
  await page.goto(`/admin/tournaments/${tournamentId}/tabulation`);

  // Select round
  await page.getByRole('tab', { name: /pairings/i }).click();
  await page.getByText(`Round ${roundNumber}`).click();

  // Generate pairings
  await page.getByRole('button', { name: /generate.*pairings/i }).click();

  // Wait for success
  await expect(page.locator('[data-sonner-toast]')).toContainText(/generated|success/i, {
    timeout: 15000
  });
}

/**
 * Posts pairings for a round
 */
export async function postRoundPairings(
  page: Page,
  tournamentId: string,
  roundNumber: number
): Promise<void> {
  await page.goto(`/admin/tournaments/${tournamentId}/tabulation`);

  await page.getByRole('tab', { name: /pairings/i }).click();
  await page.getByText(`Round ${roundNumber}`).click();

  await page.getByRole('button', { name: /post.*round|release/i }).click();

  await expect(page.locator('[data-sonner-toast]')).toContainText(/posted|released|success/i, {
    timeout: 10000
  });
}

/**
 * Submits a ballot as admin/tab staff
 */
export async function submitBallotAsAdmin(
  page: Page,
  pairingId: string,
  ballot: {
    winner: 'aff' | 'neg';
    affPoints: [number, number];
    negPoints: [number, number];
    feedback?: string;
  }
): Promise<void> {
  await page.goto(`/admin/pairings/${pairingId}/ballot`);

  // Select winner
  await page.getByLabel(/winner/i).selectOption(ballot.winner);

  // Fill points
  await page.locator('[data-speaker="aff1"]').fill(ballot.affPoints[0].toString());
  await page.locator('[data-speaker="aff2"]').fill(ballot.affPoints[1].toString());
  await page.locator('[data-speaker="neg1"]').fill(ballot.negPoints[0].toString());
  await page.locator('[data-speaker="neg2"]').fill(ballot.negPoints[1].toString());

  if (ballot.feedback) {
    await page.getByLabel(/feedback|rfd/i).fill(ballot.feedback);
  }

  await page.getByRole('button', { name: /submit.*ballot/i }).click();

  await expect(page.locator('[data-sonner-toast]')).toContainText(/submitted|success/i, {
    timeout: 10000
  });
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Waits for a notification to appear
 */
export async function waitForNotification(
  page: Page,
  titlePattern: RegExp | string,
  timeout = 30000
): Promise<void> {
  const pattern = typeof titlePattern === 'string'
    ? new RegExp(titlePattern, 'i')
    : titlePattern;

  await expect(page.locator('[data-testid="notification"]')).toContainText(pattern, { timeout });
}

/**
 * Gets all visible notifications
 */
export async function getNotifications(page: Page): Promise<string[]> {
  const notifications = page.locator('[data-testid="notification-item"]');
  return await notifications.allTextContents();
}

/**
 * Clears all notifications
 */
export async function clearAllNotifications(page: Page): Promise<void> {
  const clearButton = page.getByRole('button', { name: /clear.*all|dismiss/i });
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }
}

// ============================================================================
// CHAT HELPERS
// ============================================================================

/**
 * Sends a chat message
 */
export async function sendChatMessage(page: Page, message: string): Promise<void> {
  const input = page.getByPlaceholder(/message|type/i);
  await input.fill(message);
  await page.getByRole('button', { name: /send/i }).click();

  // Wait for message to appear in chat
  await expect(page.locator('.messages-container, [data-testid="messages"]')).toContainText(
    message,
    { timeout: 10000 }
  );
}

/**
 * Opens chat panel if not already open
 */
export async function openChatPanel(page: Page): Promise<void> {
  const chatToggle = page.getByRole('button', { name: /chat|message/i });
  const chatPanel = page.locator('[data-testid="chat-panel"], .chat-panel');

  if (!(await chatPanel.isVisible())) {
    await chatToggle.click();
    await expect(chatPanel).toBeVisible();
  }
}

// ============================================================================
// SCREENSHOT & DEBUGGING HELPERS
// ============================================================================

/**
 * Takes a labeled screenshot for debugging
 */
export async function debugScreenshot(page: Page, label: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/debug/${label}-${timestamp}.png`,
    fullPage: true
  });
}

/**
 * Logs current page state for debugging
 */
export async function logPageState(page: Page): Promise<void> {
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());

  const visibleText = await page.locator('body').textContent();
  console.log('Page content preview:', visibleText?.slice(0, 500));
}

/**
 * Waits for API calls to complete
 */
export async function waitForApiCalls(page: Page, timeout = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Asserts that user is on a specific page
 */
export async function expectOnPage(page: Page, pathPattern: RegExp | string): Promise<void> {
  const pattern = typeof pathPattern === 'string'
    ? new RegExp(pathPattern)
    : pathPattern;

  await expect(page).toHaveURL(pattern);
}

/**
 * Asserts that an element contains specific text
 */
export async function expectTextVisible(
  page: Page,
  text: string | RegExp,
  timeout = 10000
): Promise<void> {
  const pattern = typeof text === 'string' ? new RegExp(text, 'i') : text;
  await expect(page.locator('body')).toContainText(pattern, { timeout });
}

/**
 * Asserts that a toast message appears
 */
export async function expectToast(
  page: Page,
  message: string | RegExp,
  timeout = 10000
): Promise<void> {
  const pattern = typeof message === 'string' ? new RegExp(message, 'i') : message;
  await expect(page.locator('[data-sonner-toast]')).toContainText(pattern, { timeout });
}

// ============================================================================
// DATA VERIFICATION HELPERS
// ============================================================================

/**
 * Verifies standings data matches expected values
 */
export async function verifyStandingsIntegrity(
  page: Page,
  expectedTeamCount: number
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Get all team rows
  const rows = await page.locator('tbody tr').all();

  if (rows.length !== expectedTeamCount) {
    errors.push(`Expected ${expectedTeamCount} teams, found ${rows.length}`);
  }

  // Verify ranking order
  let previousRank = 0;
  for (const row of rows) {
    const cells = await row.locator('td').allTextContents();
    const rank = parseInt(cells[0], 10);

    if (rank < previousRank) {
      errors.push(`Rank order violation: ${rank} came after ${previousRank}`);
    }
    previousRank = rank;

    // Verify record format (e.g., "3-2")
    const record = cells[2];
    if (!/^\d+-\d+$/.test(record)) {
      errors.push(`Invalid record format: ${record}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculates expected standings from ballot data
 */
export function calculateExpectedStandings(
  ballots: Array<{
    affTeam: string;
    negTeam: string;
    winner: 'aff' | 'neg';
    affPoints: number;
    negPoints: number;
  }>
): Map<string, { wins: number; losses: number; speaks: number }> {
  const standings = new Map<string, { wins: number; losses: number; speaks: number }>();

  for (const ballot of ballots) {
    // Initialize teams if needed
    if (!standings.has(ballot.affTeam)) {
      standings.set(ballot.affTeam, { wins: 0, losses: 0, speaks: 0 });
    }
    if (!standings.has(ballot.negTeam)) {
      standings.set(ballot.negTeam, { wins: 0, losses: 0, speaks: 0 });
    }

    const affStats = standings.get(ballot.affTeam)!;
    const negStats = standings.get(ballot.negTeam)!;

    if (ballot.winner === 'aff') {
      affStats.wins++;
      negStats.losses++;
    } else {
      negStats.wins++;
      affStats.losses++;
    }

    affStats.speaks += ballot.affPoints;
    negStats.speaks += ballot.negPoints;
  }

  return standings;
}

// ============================================================================
// TIMING HELPERS
// ============================================================================

/**
 * Waits for a specific amount of time (use sparingly)
 */
export async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an action until it succeeds or times out
 */
export async function retry<T>(
  action: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(delayMs);
      }
    }
  }

  throw lastError;
}
