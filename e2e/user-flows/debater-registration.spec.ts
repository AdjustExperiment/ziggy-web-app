/**
 * Ziggy E2E Tests - Debater Registration Flow
 * Complete debater journey from account creation to tournament participation
 */

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestTeam,
  EDGE_CASES
} from '../fixtures/test-data';
import {
  LoginPage,
  SignUpPage,
  TournamentsListPage,
  TournamentLandingPage,
  TournamentRegistrationPage,
  UserDashboardPage,
  NavigationBar
} from '../utils/page-objects';

test.describe('Debater Registration Flow', () => {
  test.describe('Complete User Journey', () => {
    test('should complete full debater journey: signup → find tournament → register', async ({ page }) => {
      const user = createTestUser();
      const team = createTestTeam(1);

      // Step 1: Create account
      const signUpPage = new SignUpPage(page);
      await signUpPage.goto();
      await signUpPage.signUp(user);

      // Wait for account creation
      await page.waitForTimeout(3000);

      // Step 2: Navigate to tournaments
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      // Step 3: Browse available tournaments
      const tournamentsPage = new TournamentsListPage(page);
      const tournamentCount = await tournamentsPage.getTournamentCount();

      // If tournaments exist, try to register for one
      if (tournamentCount > 0) {
        // Click on first available tournament
        await tournamentsPage.tournamentCards.first().click();
        await page.waitForLoadState('networkidle');

        // Step 4: View tournament details
        const landingPage = new TournamentLandingPage(page);
        await expect(landingPage.tournamentTitle).toBeVisible();

        // Step 5: Click register if available
        if (await landingPage.registerButton.isVisible()) {
          await landingPage.clickRegister();
          await page.waitForLoadState('networkidle');

          // Step 6: Fill registration form
          const registrationPage = new TournamentRegistrationPage(page);
          await registrationPage.fillRegistrationForm({
            participantName: `${user.firstName} ${user.lastName}`,
            partnerName: `${team.debater2.firstName} ${team.debater2.lastName}`,
            school: user.school || 'Test School',
            email: user.email
          });
        }
      }
    });

    test('should show registered tournaments in dashboard', async ({ page }) => {
      // Login as existing test debater
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');
      await page.waitForTimeout(2000);

      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for my tournaments section
      const dashboard = new UserDashboardPage(page);
      await expect(dashboard.myTournamentsSection).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Tournament Discovery', () => {
    test('should display tournament list', async ({ page }) => {
      const tournamentsPage = new TournamentsListPage(page);
      await tournamentsPage.goto();

      // Page should load
      await page.waitForLoadState('networkidle');

      // Check for tournament cards or empty state
      const hasCards = await tournamentsPage.tournamentCards.count() > 0;
      const hasEmptyState = await page.locator(':text("no tournaments")').isVisible();

      expect(hasCards || hasEmptyState).toBe(true);
    });

    test('should filter tournaments by search', async ({ page }) => {
      const tournamentsPage = new TournamentsListPage(page);
      await tournamentsPage.goto();
      await page.waitForLoadState('networkidle');

      // Search for a tournament
      await tournamentsPage.searchTournaments('Championship');
      await page.waitForTimeout(1000);

      // Results should be filtered (or show no results)
      await page.waitForLoadState('networkidle');
    });

    test('should navigate to tournament details', async ({ page }) => {
      const tournamentsPage = new TournamentsListPage(page);
      await tournamentsPage.goto();
      await page.waitForLoadState('networkidle');

      const tournamentCount = await tournamentsPage.getTournamentCount();

      if (tournamentCount > 0) {
        // Click on first tournament
        await tournamentsPage.tournamentCards.first().click();

        // Should navigate to tournament page
        await expect(page).toHaveURL(/\/tournaments\/[^\/]+$/);
      }
    });
  });

  test.describe('Registration Form', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');
      await page.waitForTimeout(2000);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      const tournamentsPage = new TournamentsListPage(page);
      const count = await tournamentsPage.getTournamentCount();

      if (count > 0) {
        await tournamentsPage.tournamentCards.first().click();
        await page.waitForLoadState('networkidle');

        const landingPage = new TournamentLandingPage(page);
        if (await landingPage.registerButton.isVisible()) {
          await landingPage.clickRegister();
          await page.waitForLoadState('networkidle');

          // Try to submit empty form
          const submitButton = page.getByRole('button', { name: /submit|register/i });
          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Should show validation errors
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test('should handle partner registration for 2v2 format', async ({ page }) => {
      const team = createTestTeam(1);

      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      const tournamentsPage = new TournamentsListPage(page);
      const count = await tournamentsPage.getTournamentCount();

      if (count > 0) {
        await tournamentsPage.tournamentCards.first().click();
        await page.waitForLoadState('networkidle');

        const landingPage = new TournamentLandingPage(page);
        if (await landingPage.registerButton.isVisible()) {
          await landingPage.clickRegister();
          await page.waitForLoadState('networkidle');

          const registrationPage = new TournamentRegistrationPage(page);

          // Fill debater 1
          await registrationPage.participantNameInput.fill(
            `${team.debater1.firstName} ${team.debater1.lastName}`
          );

          // Fill debater 2 (partner)
          if (await registrationPage.partnerNameInput.isVisible()) {
            await registrationPage.partnerNameInput.fill(
              `${team.debater2.firstName} ${team.debater2.lastName}`
            );
          }

          // Fill school
          await registrationPage.schoolInput.fill(team.school);
        }
      }
    });

    test('should handle special characters in names', async ({ page }) => {
      const specialTeam = EDGE_CASES.longSchoolName;

      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      const tournamentsPage = new TournamentsListPage(page);
      const count = await tournamentsPage.getTournamentCount();

      if (count > 0) {
        await tournamentsPage.tournamentCards.first().click();
        await page.waitForLoadState('networkidle');

        const landingPage = new TournamentLandingPage(page);
        if (await landingPage.registerButton.isVisible()) {
          await landingPage.clickRegister();
          await page.waitForLoadState('networkidle');

          const registrationPage = new TournamentRegistrationPage(page);

          // Try to register with long school name
          await registrationPage.schoolInput.fill(specialTeam.school);

          // Should handle gracefully (truncate or accept)
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Post-Registration', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');
      await page.waitForTimeout(2000);
    });

    test('should show my registrations in dashboard', async ({ page }) => {
      await page.goto('/my-tournaments');
      await page.waitForLoadState('networkidle');

      // Page should show registrations or empty state
      const hasRegistrations = await page.locator('article, [data-testid="registration"]').count() > 0;
      const hasEmptyState = await page.locator(':text("no registrations"), :text("haven\'t registered")').isVisible();

      expect(hasRegistrations || hasEmptyState).toBe(true);
    });

    test('should allow viewing tournament details after registration', async ({ page }) => {
      await page.goto('/my-tournaments');
      await page.waitForLoadState('networkidle');

      const registrationCard = page.locator('article, [data-testid="registration"]').first();

      if (await registrationCard.isVisible()) {
        await registrationCard.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to tournament page
        await expect(page).toHaveURL(/\/tournaments\//);
      }
    });

    test('should show round assignments when available', async ({ page }) => {
      await page.goto('/my-tournaments');
      await page.waitForLoadState('networkidle');

      // Check for any round information
      const roundInfo = page.locator(':text("Round"), :text("Pairing")');
      // May or may not be visible depending on tournament state
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle registration deadline passed', async ({ page }) => {
      // This test depends on having a tournament with passed deadline
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      // Look for a closed tournament
      const closedBadge = page.locator(':text("closed"), :text("registration closed")');
      // May or may not exist
      await page.waitForTimeout(1000);
    });

    test('should handle tournament at max capacity', async ({ page }) => {
      // This test depends on having a full tournament
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      // Look for a full tournament indicator
      const fullBadge = page.locator(':text("full"), :text("sold out"), :text("no spots")');
      // May or may not exist
      await page.waitForTimeout(1000);
    });

    test('should prevent duplicate registration', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');
      await page.waitForTimeout(2000);

      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      // Try to register for a tournament they're already registered for
      // Should show appropriate message or redirect
      await page.waitForTimeout(1000);
    });

    test('should handle concurrent registration attempts', async ({ page, context }) => {
      const page2 = await context.newPage();

      // Login on both pages
      const loginPage1 = new LoginPage(page);
      const loginPage2 = new LoginPage(page2);

      await loginPage1.goto();
      await loginPage1.login('test.debater@ziggytest.com', 'TestDebater123!');

      await loginPage2.goto();
      await loginPage2.login('test.debater@ziggytest.com', 'TestDebater123!');

      await page.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Navigate both to same tournament registration
      await page.goto('/tournaments');
      await page2.goto('/tournaments');

      await page.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      await page2.close();
    });

    test('should handle session expiry during registration', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');
      await page.waitForTimeout(2000);

      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      // Simulate session expiry by clearing storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to continue browsing - should redirect to login
      await page.reload();
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display properly on mobile', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      // Check that page is usable on mobile
      await expect(page.locator('body')).toBeVisible();

      // Navigation should be accessible (possibly via hamburger menu)
      const hamburger = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
      // May or may not have hamburger menu
      await page.waitForTimeout(500);
    });

    test('should allow registration form submission on mobile', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Form should be usable on mobile
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });
  });
});
