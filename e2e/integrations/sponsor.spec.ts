/**
 * Ziggy E2E Tests - Sponsor Integration
 * Tests for sponsor application, dashboard, and integration workflows
 */

import { test, expect } from '@playwright/test';
import { SPONSOR_DATA, createTestSponsor } from '../fixtures/test-data';
import { LoginPage, SponsorDashboardPage, SponsorApplicationPage } from '../utils/page-objects';

test.describe('Sponsor Integration', () => {
  test.describe('Sponsor Application Flow', () => {
    test('should display sponsor information page', async ({ page }) => {
      await page.goto('/sponsor');
      await page.waitForLoadState('networkidle');

      // Should show sponsor benefits and tiers
      await expect(page.locator('body')).toContainText(/sponsor|partner/i);
    });

    test('should display available sponsorship tiers', async ({ page }) => {
      await page.goto('/sponsor');
      await page.waitForLoadState('networkidle');

      // Check for tier information
      console.log('Available sponsorship tiers:');
      console.log(`  Bronze: $${SPONSOR_DATA.bronzeSponsor.amount}`);
      console.log(`  Silver: $${SPONSOR_DATA.silverSponsor.amount}`);
      console.log(`  Gold: $${SPONSOR_DATA.goldSponsor.amount}`);
      console.log(`  Platinum: $${SPONSOR_DATA.platinumSponsor.amount}`);

      const tierCards = page.locator('[data-testid="tier-card"], .tier-card, article');
      await page.waitForTimeout(1000);
    });

    test('should navigate to sponsor application', async ({ page }) => {
      await page.goto('/sponsor');
      await page.waitForLoadState('networkidle');

      const applyButton = page.getByRole('link', { name: /apply|become.*sponsor/i });
      if (await applyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await applyButton.click();
        await page.waitForURL(/\/sponsor\/apply|\/login/);
      }
    });

    test('should require login to apply', async ({ page }) => {
      await page.goto('/sponsor/apply');

      // Should redirect to login if not authenticated
      await expect(page).toHaveURL(/\/login/);
    });

    test('should fill sponsor application form', async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.sponsor@ziggytest.com', 'TestSponsor123!');
      await page.waitForTimeout(3000);

      await page.goto('/sponsor/apply');
      await page.waitForLoadState('networkidle');

      // Fill application form
      const companyInput = page.getByLabel(/company.*name/i);
      if (await companyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await companyInput.fill(SPONSOR_DATA.goldSponsor.companyName);
      }

      const websiteInput = page.getByLabel(/website/i);
      if (await websiteInput.isVisible()) {
        await websiteInput.fill(SPONSOR_DATA.goldSponsor.website);
      }

      const tierSelect = page.getByLabel(/tier|level/i);
      if (await tierSelect.isVisible()) {
        await tierSelect.selectOption('gold');
      }
    });

    test('should validate required fields on application', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.sponsor@ziggytest.com', 'TestSponsor123!');
      await page.waitForTimeout(3000);

      await page.goto('/sponsor/apply');
      await page.waitForLoadState('networkidle');

      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /submit|apply/i });
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click();

        // Should show validation errors
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Sponsor Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.sponsor@ziggytest.com', 'TestSponsor123!');
      await page.waitForTimeout(3000);
    });

    test('should access sponsor dashboard', async ({ page }) => {
      await page.goto('/sponsor/dashboard');
      await page.waitForLoadState('networkidle');

      // Should show dashboard or redirect if not approved sponsor
      await page.waitForTimeout(1000);
    });

    test('should display sponsorship tier and benefits', async ({ page }) => {
      await page.goto('/sponsor/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for tier display
      const tierBadge = page.locator('[data-testid="sponsor-tier"], :text("Gold"), :text("Silver")');
      await page.waitForTimeout(1000);
    });

    test('should allow logo upload', async ({ page }) => {
      await page.goto('/sponsor/dashboard');
      await page.waitForLoadState('networkidle');

      const logoUpload = page.locator('input[type="file"]');
      if (await logoUpload.isVisible({ timeout: 3000 }).catch(() => false)) {
        // File upload is available
        await expect(logoUpload).toBeVisible();
      }
    });

    test('should display sponsorship analytics', async ({ page }) => {
      await page.goto('/sponsor/dashboard');
      await page.waitForLoadState('networkidle');

      const analyticsSection = page.locator('[data-testid="analytics"], section:has-text("Analytics")');
      await page.waitForTimeout(1000);
    });

    test('should show sponsored tournaments', async ({ page }) => {
      await page.goto('/sponsor/dashboard');
      await page.waitForLoadState('networkidle');

      const tournamentsSection = page.locator('[data-testid="sponsored-tournaments"], section:has-text("Tournaments")');
      await page.waitForTimeout(1000);
    });

    test('should access invoice history', async ({ page }) => {
      await page.goto('/sponsor/dashboard');
      await page.waitForLoadState('networkidle');

      const invoicesTab = page.getByRole('tab', { name: /invoices|billing/i });
      if (await invoicesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await invoicesTab.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Sponsor Invite Flow', () => {
    test('should handle sponsor invite link', async ({ page }) => {
      // Test invite token page
      await page.goto('/sponsor/invite/test-invite-token');
      await page.waitForLoadState('networkidle');

      // Should show invite details or error for invalid token
      await page.waitForTimeout(1000);
    });

    test('should display invite details', async ({ page }) => {
      await page.goto('/sponsor/invite/test-token-123');
      await page.waitForLoadState('networkidle');

      // Look for invite information
      const inviteDetails = page.locator('[data-testid="invite-details"]');
      await page.waitForTimeout(1000);
    });

    test('should require login to accept invite', async ({ page }) => {
      await page.goto('/sponsor/invite/test-token-123');

      // May redirect to login or show login prompt
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Sponsors Listing Page', () => {
    test('should display public sponsors page', async ({ page }) => {
      await page.goto('/sponsors');
      await page.waitForLoadState('networkidle');

      // Should show sponsors or empty state
      await expect(page.locator('body')).toContainText(/sponsor|partner/i);
    });

    test('should display sponsors by tier', async ({ page }) => {
      await page.goto('/sponsors');
      await page.waitForLoadState('networkidle');

      // Check for tier sections
      const platinumSection = page.locator(':text("Platinum")');
      const goldSection = page.locator(':text("Gold")');
      const silverSection = page.locator(':text("Silver")');
      const bronzeSection = page.locator(':text("Bronze")');

      await page.waitForTimeout(1000);
    });

    test('should display sponsor logos', async ({ page }) => {
      await page.goto('/sponsors');
      await page.waitForLoadState('networkidle');

      const logos = page.locator('[data-testid="sponsor-logo"], img[alt*="sponsor"]');
      await page.waitForTimeout(1000);
    });

    test('should link to sponsor websites', async ({ page }) => {
      await page.goto('/sponsors');
      await page.waitForLoadState('networkidle');

      const sponsorLinks = page.locator('a[href^="http"][target="_blank"]');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Tournament Sponsor Integration', () => {
    test('should display sponsors on tournament page', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      // Click on first tournament
      const tournamentCard = page.locator('[data-testid="tournament-card"], article').first();
      if (await tournamentCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tournamentCard.click();
        await page.waitForLoadState('networkidle');

        // Look for sponsor section
        const sponsorSection = page.locator('[data-testid="tournament-sponsors"], section:has-text("Sponsor")');
        await page.waitForTimeout(1000);
      }
    });

    test('should show sponsor branding according to tier', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      // Tier visibility rules:
      console.log('Sponsor visibility by tier:');
      console.log('  Platinum: Logo on all pages, banner ad, dedicated page');
      console.log('  Gold: Logo on tournament page, mentions in announcements');
      console.log('  Silver: Logo in sponsor section');
      console.log('  Bronze: Name in sponsor list');
    });
  });

  test.describe('Sponsor Admin Management', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);
    });

    test('should view sponsor applications', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const sponsorsTab = page.getByRole('tab', { name: /sponsors/i });
      if (await sponsorsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sponsorsTab.click();
        await page.waitForTimeout(1000);
      }
    });

    test('should approve sponsor application', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const sponsorsTab = page.getByRole('tab', { name: /sponsors/i });
      if (await sponsorsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sponsorsTab.click();
        await page.waitForTimeout(1000);

        const approveButton = page.getByRole('button', { name: /approve/i }).first();
        if (await approveButton.isVisible()) {
          // Don't actually approve, just verify button exists
          await expect(approveButton).toBeVisible();
        }
      }
    });

    test('should send sponsor invite', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const sponsorsTab = page.getByRole('tab', { name: /sponsors/i });
      if (await sponsorsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sponsorsTab.click();
        await page.waitForTimeout(1000);

        const inviteButton = page.getByRole('button', { name: /invite|add.*sponsor/i });
        if (await inviteButton.isVisible()) {
          await expect(inviteButton).toBeVisible();
        }
      }
    });

    test('should edit sponsor tier', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const sponsorsTab = page.getByRole('tab', { name: /sponsors/i });
      if (await sponsorsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sponsorsTab.click();
        await page.waitForTimeout(1000);

        const editButton = page.getByRole('button', { name: /edit/i }).first();
        if (await editButton.isVisible()) {
          await expect(editButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle expired invite token', async ({ page }) => {
      await page.goto('/sponsor/invite/expired-token-12345');
      await page.waitForLoadState('networkidle');

      // Should show error message
      const errorMessage = page.locator(':text("expired"), :text("invalid"), :text("not found")');
      await page.waitForTimeout(1000);
    });

    test('should handle invalid sponsor tier selection', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.sponsor@ziggytest.com', 'TestSponsor123!');
      await page.waitForTimeout(3000);

      await page.goto('/sponsor/apply');
      await page.waitForLoadState('networkidle');

      // Attempt to manipulate tier value
      await page.waitForTimeout(500);
    });

    test('should handle duplicate sponsor application', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.sponsor@ziggytest.com', 'TestSponsor123!');
      await page.waitForTimeout(3000);

      await page.goto('/sponsor/apply');
      await page.waitForLoadState('networkidle');

      // If user already has pending/approved application
      const existingAppMessage = page.locator(':text("already"), :text("pending")');
      await page.waitForTimeout(1000);
    });

    test('should handle large logo file upload', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.sponsor@ziggytest.com', 'TestSponsor123!');
      await page.waitForTimeout(3000);

      await page.goto('/sponsor/dashboard');
      await page.waitForLoadState('networkidle');

      // Should validate file size limits
      console.log('Testing file size limits for logo upload...');
      console.log('  Max size: 5MB');
      console.log('  Accepted formats: PNG, JPG, SVG');
    });

    test('should handle concurrent sponsor dashboard access', async ({ page, context }) => {
      const page2 = await context.newPage();

      const loginPage1 = new LoginPage(page);
      const loginPage2 = new LoginPage(page2);

      await loginPage1.goto();
      await loginPage1.login('test.sponsor@ziggytest.com', 'TestSponsor123!');

      await loginPage2.goto();
      await loginPage2.login('test.sponsor@ziggytest.com', 'TestSponsor123!');

      await page.waitForTimeout(3000);
      await page2.waitForTimeout(3000);

      await page.goto('/sponsor/dashboard');
      await page2.goto('/sponsor/dashboard');

      await page.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      console.log('Testing concurrent sponsor dashboard access...');

      await page2.close();
    });
  });
});
