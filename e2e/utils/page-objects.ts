/**
 * Ziggy E2E Page Objects
 * Encapsulates page interactions for cleaner, more maintainable tests
 */

import { Page, Locator, expect } from '@playwright/test';
import { TestUser, TestTeam, TestTournament, TestBallot } from '../fixtures/test-data';

// ============================================================================
// BASE PAGE OBJECT
// ============================================================================

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getToast(): Promise<string | null> {
    const toast = this.page.locator('[data-sonner-toast]').first();
    if (await toast.isVisible({ timeout: 5000 }).catch(() => false)) {
      return toast.textContent();
    }
    return null;
  }

  async expectToastMessage(message: string | RegExp) {
    await expect(this.page.locator('[data-sonner-toast]')).toContainText(message, {
      timeout: 10000
    });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }
}

// ============================================================================
// AUTHENTICATION PAGE OBJECTS
// ============================================================================

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly createAccountButton: Locator;
  readonly userTab: Locator;
  readonly adminTab: Locator;

  constructor(page: Page) {
    super(page);
    // Use multiple selector strategies for robustness
    this.emailInput = page.locator('input[type="email"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.getByRole('button', { name: /sign in|log in|access/i }).first();
    this.signUpLink = page.locator('button:has-text("Need an account"), a:has-text("sign up"), a:has-text("create account")');
    this.forgotPasswordLink = page.locator('button:has-text("Forgot password")');
    this.errorMessage = page.locator('[role="alert"], .text-destructive, [data-sonner-toast]');
    this.createAccountButton = page.getByRole('button', { name: /create new account/i });
    this.userTab = page.getByRole('tab', { name: /user/i });
    this.adminTab = page.getByRole('tab', { name: /admin/i });
  }

  async goto() {
    await super.goto('/login');
    // Wait for the page to fully load (not in loading state)
    await this.page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });
  }

  async selectUserTab() {
    if (await this.userTab.isVisible()) {
      await this.userTab.click();
      await this.page.waitForTimeout(300);
    }
  }

  async selectAdminTab() {
    if (await this.adminTab.isVisible()) {
      await this.adminTab.click();
      await this.page.waitForTimeout(300);
    }
  }

  async login(email: string, password: string) {
    // Wait for form to be ready
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsUser(user: TestUser) {
    await this.login(user.email, user.password);
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
  }

  async expectLoggedIn() {
    // Should redirect away from login page
    await expect(this.page).not.toHaveURL(/\/login/);
  }

  async clickCreateAccount() {
    await this.createAccountButton.click();
  }
}

export class SignUpPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signUpButton: Locator;
  readonly loginLink: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    // Use placeholder-based selectors for more robustness
    this.firstNameInput = page.locator('input[placeholder*="First"], input[placeholder="John"]').first();
    this.lastNameInput = page.locator('input[placeholder*="Last"], input[placeholder="Doe"]').first();
    this.emailInput = page.locator('input[type="email"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.signUpButton = page.getByRole('button', { name: /create account/i });
    this.loginLink = page.locator('a:has-text("Sign in"), a:has-text("Log in")');
    this.successMessage = page.locator('text=Check Your Email, text=verification, text=Account Created');
  }

  async goto() {
    await super.goto('/signup');
    // Wait for the form to load
    await this.page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });
  }

  async signUp(user: TestUser) {
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    // Check if confirm password field exists (some forms have it)
    if (await this.confirmPasswordInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.confirmPasswordInput.fill(user.password);
    }
    await this.signUpButton.click();
  }

  async expectSignUpSuccess() {
    // Wait for success message or redirect
    await expect(this.successMessage.or(this.page.locator('text=Check Your Email'))).toBeVisible({ timeout: 15000 });
  }
}

// ============================================================================
// NAVIGATION PAGE OBJECT
// ============================================================================

export class NavigationBar extends BasePage {
  readonly homeLink: Locator;
  readonly tournamentsLink: Locator;
  readonly dashboardLink: Locator;
  readonly accountMenu: Locator;
  readonly logoutButton: Locator;
  readonly loginButton: Locator;
  readonly searchButton: Locator;
  readonly notificationBell: Locator;

  constructor(page: Page) {
    super(page);
    this.homeLink = page.getByRole('link', { name: /^home$|ziggy/i }).first();
    this.tournamentsLink = page.getByRole('link', { name: /tournaments/i }).first();
    this.dashboardLink = page.getByRole('link', { name: /dashboard/i }).first();
    this.accountMenu = page.locator('[data-testid="account-menu"], button:has-text("Account")');
    this.logoutButton = page.getByRole('menuitem', { name: /log out|sign out/i });
    this.loginButton = page.getByRole('link', { name: /log in|sign in/i });
    this.searchButton = page.locator('[data-testid="search-button"], button:has([class*="search"])');
    this.notificationBell = page.locator('[data-testid="notifications"], button:has([class*="bell"])');
  }

  async navigateToTournaments() {
    await this.tournamentsLink.click();
    await this.page.waitForURL(/\/tournaments/);
  }

  async navigateToDashboard() {
    await this.dashboardLink.click();
    await this.page.waitForURL(/\/dashboard/);
  }

  async logout() {
    await this.accountMenu.click();
    await this.logoutButton.click();
  }

  async openNotifications() {
    await this.notificationBell.click();
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.accountMenu.isVisible().catch(() => false);
  }
}

// ============================================================================
// TOURNAMENT PAGE OBJECTS
// ============================================================================

export class TournamentsListPage extends BasePage {
  readonly tournamentCards: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly createTournamentButton: Locator;

  constructor(page: Page) {
    super(page);
    this.tournamentCards = page.locator('[data-testid="tournament-card"], .tournament-card, article');
    this.searchInput = page.getByPlaceholder(/search/i);
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.createTournamentButton = page.getByRole('link', { name: /host|create/i });
  }

  async goto() {
    await super.goto('/tournaments');
  }

  async selectTournament(name: string) {
    await this.page.getByText(name).first().click();
  }

  async searchTournaments(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async getTournamentCount(): Promise<number> {
    return await this.tournamentCards.count();
  }
}

export class TournamentLandingPage extends BasePage {
  readonly registerButton: Locator;
  readonly standingsLink: Locator;
  readonly scheduleSection: Locator;
  readonly rulesSection: Locator;
  readonly tournamentTitle: Locator;
  readonly registrationDeadline: Locator;

  constructor(page: Page) {
    super(page);
    this.registerButton = page.getByRole('link', { name: /register/i });
    this.standingsLink = page.getByRole('link', { name: /standings/i });
    this.scheduleSection = page.locator('[data-testid="schedule"], section:has-text("Schedule")');
    this.rulesSection = page.locator('[data-testid="rules"], section:has-text("Rules")');
    this.tournamentTitle = page.locator('h1');
    this.registrationDeadline = page.locator('[data-testid="deadline"], :text("deadline")');
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  async viewStandings() {
    await this.standingsLink.click();
    await this.page.waitForURL(/\/standings/);
  }
}

export class TournamentRegistrationPage extends BasePage {
  readonly participantNameInput: Locator;
  readonly partnerNameInput: Locator;
  readonly schoolInput: Locator;
  readonly emailInput: Locator;
  readonly eventSelect: Locator;
  readonly submitButton: Locator;
  readonly addToCartButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.participantNameInput = page.getByLabel(/participant name|your name/i);
    this.partnerNameInput = page.getByLabel(/partner|teammate/i);
    this.schoolInput = page.getByLabel(/school|organization/i);
    this.emailInput = page.getByLabel(/email/i);
    this.eventSelect = page.getByLabel(/event|category/i);
    this.submitButton = page.getByRole('button', { name: /submit|register/i });
    this.addToCartButton = page.getByRole('button', { name: /add to cart/i });
    this.checkoutButton = page.getByRole('button', { name: /checkout|pay/i });
  }

  async registerTeam(team: TestTeam) {
    await this.participantNameInput.fill(`${team.debater1.firstName} ${team.debater1.lastName}`);
    if (await this.partnerNameInput.isVisible()) {
      await this.partnerNameInput.fill(`${team.debater2.firstName} ${team.debater2.lastName}`);
    }
    await this.schoolInput.fill(team.school);
    await this.submitButton.click();
  }

  async fillRegistrationForm(data: {
    participantName: string;
    partnerName?: string;
    school: string;
    email?: string;
  }) {
    await this.participantNameInput.fill(data.participantName);
    if (data.partnerName && await this.partnerNameInput.isVisible()) {
      await this.partnerNameInput.fill(data.partnerName);
    }
    await this.schoolInput.fill(data.school);
    if (data.email && await this.emailInput.isVisible()) {
      await this.emailInput.fill(data.email);
    }
  }
}

// ============================================================================
// DASHBOARD PAGE OBJECTS
// ============================================================================

export class UserDashboardPage extends BasePage {
  readonly myTournamentsSection: Locator;
  readonly upcomingRoundsSection: Locator;
  readonly notificationsSection: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    super(page);
    this.myTournamentsSection = page.locator('[data-testid="my-tournaments"], section:has-text("My Tournaments")');
    this.upcomingRoundsSection = page.locator('[data-testid="upcoming"], section:has-text("Upcoming")');
    this.notificationsSection = page.locator('[data-testid="notifications"], section:has-text("Notifications")');
    this.quickActions = page.locator('[data-testid="quick-actions"], .quick-actions');
  }

  async goto() {
    await super.goto('/dashboard');
  }

  async getMyTournamentsList(): Promise<string[]> {
    const items = this.myTournamentsSection.locator('a, li');
    return await items.allTextContents();
  }
}

export class JudgeDashboardPage extends BasePage {
  readonly assignmentsTab: Locator;
  readonly availabilityTab: Locator;
  readonly ballotsTab: Locator;
  readonly assignmentsList: Locator;
  readonly submitBallotButton: Locator;

  constructor(page: Page) {
    super(page);
    this.assignmentsTab = page.getByRole('tab', { name: /assignments/i });
    this.availabilityTab = page.getByRole('tab', { name: /availability/i });
    this.ballotsTab = page.getByRole('tab', { name: /ballots/i });
    this.assignmentsList = page.locator('[data-testid="assignments-list"]');
    this.submitBallotButton = page.getByRole('button', { name: /submit ballot/i });
  }

  async goto() {
    await super.goto('/judge');
  }

  async selectAssignment(roomName: string) {
    await this.page.getByText(roomName).click();
  }
}

// ============================================================================
// ADMIN PAGE OBJECTS
// ============================================================================

export class AdminDashboardPage extends BasePage {
  readonly tournamentsTab: Locator;
  readonly usersTab: Locator;
  readonly reportsTab: Locator;
  readonly settingsTab: Locator;
  readonly createTournamentButton: Locator;

  constructor(page: Page) {
    super(page);
    this.tournamentsTab = page.getByRole('tab', { name: /tournaments/i });
    this.usersTab = page.getByRole('tab', { name: /users/i });
    this.reportsTab = page.getByRole('tab', { name: /reports/i });
    this.settingsTab = page.getByRole('tab', { name: /settings/i });
    this.createTournamentButton = page.getByRole('button', { name: /create.*tournament/i });
  }

  async goto() {
    await super.goto('/admin');
  }

  async navigateToTournamentManagement(tournamentId: string) {
    await this.page.goto(`/admin/tournaments/${tournamentId}`);
  }
}

export class TabulationPage extends BasePage {
  readonly roundsTab: Locator;
  readonly standingsTab: Locator;
  readonly pairingsTab: Locator;
  readonly ballotsTab: Locator;
  readonly generatePairingsButton: Locator;
  readonly postRoundButton: Locator;
  readonly recomputeStandingsButton: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    super(page);
    this.roundsTab = page.getByRole('tab', { name: /rounds/i });
    this.standingsTab = page.getByRole('tab', { name: /standings/i });
    this.pairingsTab = page.getByRole('tab', { name: /pairings/i });
    this.ballotsTab = page.getByRole('tab', { name: /ballots/i });
    this.generatePairingsButton = page.getByRole('button', { name: /generate.*pairings/i });
    this.postRoundButton = page.getByRole('button', { name: /post.*round/i });
    this.recomputeStandingsButton = page.getByRole('button', { name: /recompute|refresh/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
  }

  async selectRound(roundNumber: number) {
    await this.page.getByText(`Round ${roundNumber}`).click();
  }

  async generatePairings() {
    await this.generatePairingsButton.click();
    await this.waitForPageLoad();
  }

  async postRound() {
    await this.postRoundButton.click();
    await this.expectToastMessage(/posted|success/i);
  }

  async viewStandings() {
    await this.standingsTab.click();
  }

  async exportStandings(format: 'csv' | 'json' | 'excel') {
    await this.exportButton.click();
    await this.page.getByRole('menuitem', { name: new RegExp(format, 'i') }).click();
  }
}

export class BallotEntryPage extends BasePage {
  readonly winnerSelect: Locator;
  readonly affSpeaker1PointsInput: Locator;
  readonly affSpeaker2PointsInput: Locator;
  readonly negSpeaker1PointsInput: Locator;
  readonly negSpeaker2PointsInput: Locator;
  readonly feedbackTextarea: Locator;
  readonly submitButton: Locator;
  readonly saveAsDraftButton: Locator;

  constructor(page: Page) {
    super(page);
    this.winnerSelect = page.getByLabel(/winner/i);
    this.affSpeaker1PointsInput = page.locator('[name="aff_speaker1_points"], input[data-speaker="aff1"]');
    this.affSpeaker2PointsInput = page.locator('[name="aff_speaker2_points"], input[data-speaker="aff2"]');
    this.negSpeaker1PointsInput = page.locator('[name="neg_speaker1_points"], input[data-speaker="neg1"]');
    this.negSpeaker2PointsInput = page.locator('[name="neg_speaker2_points"], input[data-speaker="neg2"]');
    this.feedbackTextarea = page.getByLabel(/feedback|comments|rfd/i);
    this.submitButton = page.getByRole('button', { name: /submit.*ballot/i });
    this.saveAsDraftButton = page.getByRole('button', { name: /save.*draft/i });
  }

  async fillBallot(ballot: TestBallot) {
    // Select winner
    await this.winnerSelect.selectOption(ballot.winner);

    // Fill speaker points
    await this.affSpeaker1PointsInput.fill(ballot.affSpeaker1Points.toString());
    await this.affSpeaker2PointsInput.fill(ballot.affSpeaker2Points.toString());
    await this.negSpeaker1PointsInput.fill(ballot.negSpeaker1Points.toString());
    await this.negSpeaker2PointsInput.fill(ballot.negSpeaker2Points.toString());

    // Fill feedback if provided
    if (ballot.feedback) {
      await this.feedbackTextarea.fill(ballot.feedback);
    }
  }

  async submitBallot() {
    await this.submitButton.click();
    await this.expectToastMessage(/submitted|success/i);
  }
}

// ============================================================================
// CHAT PAGE OBJECT
// ============================================================================

export class ChatPanel extends BasePage {
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messagesList: Locator;
  readonly typingIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.messageInput = page.getByPlaceholder(/message|type/i);
    this.sendButton = page.getByRole('button', { name: /send/i });
    this.messagesList = page.locator('[data-testid="messages-list"], .messages-container');
    this.typingIndicator = page.locator('[data-testid="typing-indicator"]');
  }

  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async getMessages(): Promise<string[]> {
    const messages = this.messagesList.locator('.message-content, p');
    return await messages.allTextContents();
  }

  async expectMessageVisible(message: string) {
    await expect(this.messagesList).toContainText(message);
  }
}

// ============================================================================
// STANDINGS PAGE OBJECT
// ============================================================================

export class StandingsPage extends BasePage {
  readonly standingsTable: Locator;
  readonly refreshButton: Locator;
  readonly exportDropdown: Locator;
  readonly teamRows: Locator;

  constructor(page: Page) {
    super(page);
    this.standingsTable = page.locator('table, [data-testid="standings-table"]');
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    this.exportDropdown = page.getByRole('button', { name: /export/i });
    this.teamRows = page.locator('tbody tr');
  }

  async getTeamRank(teamName: string): Promise<number | null> {
    const row = this.page.locator(`tr:has-text("${teamName}")`);
    if (await row.isVisible()) {
      const rankCell = row.locator('td').first();
      const rankText = await rankCell.textContent();
      return rankText ? parseInt(rankText, 10) : null;
    }
    return null;
  }

  async getStandingsData(): Promise<Array<{
    rank: number;
    team: string;
    wins: number;
    losses: number;
    speaks: number;
  }>> {
    const rows = await this.teamRows.all();
    const data = [];

    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      if (cells.length >= 4) {
        data.push({
          rank: parseInt(cells[0], 10) || 0,
          team: cells[1] || '',
          wins: parseInt(cells[2]?.split('-')[0], 10) || 0,
          losses: parseInt(cells[2]?.split('-')[1], 10) || 0,
          speaks: parseFloat(cells[3]) || 0
        });
      }
    }

    return data;
  }

  async expectTeamInTopN(teamName: string, n: number) {
    const rank = await this.getTeamRank(teamName);
    expect(rank).toBeLessThanOrEqual(n);
  }
}

// ============================================================================
// SPONSOR PAGE OBJECTS
// ============================================================================

export class SponsorDashboardPage extends BasePage {
  readonly sponsorshipTier: Locator;
  readonly benefitsSection: Locator;
  readonly logoUpload: Locator;
  readonly analyticsSection: Locator;
  readonly invoicesSection: Locator;

  constructor(page: Page) {
    super(page);
    this.sponsorshipTier = page.locator('[data-testid="sponsor-tier"]');
    this.benefitsSection = page.locator('[data-testid="benefits"]');
    this.logoUpload = page.locator('input[type="file"]');
    this.analyticsSection = page.locator('[data-testid="analytics"]');
    this.invoicesSection = page.locator('[data-testid="invoices"]');
  }

  async goto() {
    await super.goto('/sponsor/dashboard');
  }
}

export class SponsorApplicationPage extends BasePage {
  readonly companyNameInput: Locator;
  readonly contactEmailInput: Locator;
  readonly tierSelect: Locator;
  readonly websiteInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.companyNameInput = page.getByLabel(/company.*name/i);
    this.contactEmailInput = page.getByLabel(/email/i);
    this.tierSelect = page.getByLabel(/tier|level/i);
    this.websiteInput = page.getByLabel(/website/i);
    this.submitButton = page.getByRole('button', { name: /submit|apply/i });
  }

  async goto() {
    await super.goto('/sponsor/apply');
  }

  async fillApplication(data: {
    companyName: string;
    email: string;
    tier: string;
    website: string;
  }) {
    await this.companyNameInput.fill(data.companyName);
    await this.contactEmailInput.fill(data.email);
    await this.tierSelect.selectOption(data.tier);
    await this.websiteInput.fill(data.website);
  }

  async submitApplication() {
    await this.submitButton.click();
  }
}
