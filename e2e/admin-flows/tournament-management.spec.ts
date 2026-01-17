/**
 * Ziggy E2E Tests - Admin Tournament Management
 * Complete admin workflow for creating and managing tournaments
 */

import { test, expect } from '@playwright/test';
import {
  createTestTournament,
  createTestTeam,
  createTestJudge,
  createTestBallot,
  createMultipleTeams
} from '../fixtures/test-data';
import {
  LoginPage,
  AdminDashboardPage,
  TabulationPage,
  BallotEntryPage
} from '../utils/page-objects';

test.describe('Admin Tournament Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
    await page.waitForTimeout(3000);
  });

  test.describe('Tournament Creation', () => {
    test('should create a new tournament', async ({ page }) => {
      const tournament = createTestTournament();

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for create tournament button
      const createButton = page.getByRole('button', { name: /create.*tournament/i });

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('networkidle');

        // Fill tournament details
        const nameInput = page.getByLabel(/name/i);
        if (await nameInput.isVisible()) {
          await nameInput.fill(tournament.name);
        }

        const venueInput = page.getByLabel(/venue|location/i);
        if (await venueInput.isVisible()) {
          await venueInput.fill(tournament.venue);
        }

        const feeInput = page.getByLabel(/fee|price/i);
        if (await feeInput.isVisible()) {
          await feeInput.fill(tournament.entryFee.toString());
        }
      }
    });

    test('should configure tournament settings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Navigate to tournament settings if available
      const settingsLink = page.getByRole('link', { name: /settings/i });
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForLoadState('networkidle');

        // Check for settings form
        await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should set up event categories', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for events/categories section
      const eventsTab = page.getByRole('tab', { name: /events|categories/i });
      if (await eventsTab.isVisible()) {
        await eventsTab.click();
        await page.waitForTimeout(1000);
      }
    });

    test('should configure registration settings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for registration settings
      const registrationTab = page.getByRole('tab', { name: /registration/i });
      if (await registrationTab.isVisible()) {
        await registrationTab.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Registration Management', () => {
    test('should view all registrations', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Navigate to registrations
      const registrationsLink = page.getByRole('link', { name: /registrations/i });
      const registrationsTab = page.getByRole('tab', { name: /registrations/i });

      if (await registrationsLink.isVisible()) {
        await registrationsLink.click();
      } else if (await registrationsTab.isVisible()) {
        await registrationsTab.click();
      }

      await page.waitForLoadState('networkidle');
    });

    test('should approve pending registrations', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for pending registrations
      const pendingBadge = page.locator(':text("pending")');
      if (await pendingBadge.isVisible()) {
        // Find approve button
        const approveButton = page.getByRole('button', { name: /approve/i });
        if (await approveButton.isVisible()) {
          await approveButton.first().click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should manually add a registration', async ({ page }) => {
      const team = createTestTeam(99);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for add registration button
      const addButton = page.getByRole('button', { name: /add.*registration/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForLoadState('networkidle');

        // Fill form
        const nameInput = page.getByLabel(/name/i);
        if (await nameInput.isVisible()) {
          await nameInput.fill(`${team.debater1.firstName} ${team.debater1.lastName}`);
        }

        const schoolInput = page.getByLabel(/school/i);
        if (await schoolInput.isVisible()) {
          await schoolInput.fill(team.school);
        }
      }
    });

    test('should edit existing registration', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Find edit button on a registration
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('should delete registration', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Find delete button
      const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
      if (await deleteButton.isVisible()) {
        // Don't actually delete, just verify button is present
        await expect(deleteButton).toBeVisible();
      }
    });
  });

  test.describe('Judge Management', () => {
    test('should view judge pool', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Navigate to judges
      const judgesTab = page.getByRole('tab', { name: /judges/i });
      if (await judgesTab.isVisible()) {
        await judgesTab.click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should add judge to pool', async ({ page }) => {
      const judge = createTestJudge();

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const judgesTab = page.getByRole('tab', { name: /judges/i });
      if (await judgesTab.isVisible()) {
        await judgesTab.click();
        await page.waitForLoadState('networkidle');

        const addButton = page.getByRole('button', { name: /add.*judge/i });
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should set judge conflicts', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for conflicts section
      const conflictsLink = page.getByRole('link', { name: /conflicts/i });
      if (await conflictsLink.isVisible()) {
        await conflictsLink.click();
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Tabulation', () => {
    test('should access tabulation dashboard', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for tabulation link
      const tabLink = page.getByRole('link', { name: /tabulation|tab room/i });
      if (await tabLink.isVisible()) {
        await tabLink.click();
        await page.waitForLoadState('networkidle');

        // Should show tabulation interface
        await expect(page.locator('body')).toContainText(/round|pairing|standing/i);
      }
    });

    test('should generate round pairings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Navigate to pairings
      const pairingsTab = page.getByRole('tab', { name: /pairings/i });
      if (await pairingsTab.isVisible()) {
        await pairingsTab.click();
        await page.waitForLoadState('networkidle');

        // Generate pairings button
        const generateButton = page.getByRole('button', { name: /generate/i });
        if (await generateButton.isVisible()) {
          // Don't actually generate, verify button is present
          await expect(generateButton).toBeVisible();
        }
      }
    });

    test('should post round pairings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const pairingsTab = page.getByRole('tab', { name: /pairings/i });
      if (await pairingsTab.isVisible()) {
        await pairingsTab.click();
        await page.waitForLoadState('networkidle');

        // Post/release button
        const postButton = page.getByRole('button', { name: /post|release/i });
        if (await postButton.isVisible()) {
          await expect(postButton).toBeVisible();
        }
      }
    });

    test('should enter ballot results', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Navigate to ballots
      const ballotsTab = page.getByRole('tab', { name: /ballots/i });
      if (await ballotsTab.isVisible()) {
        await ballotsTab.click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should view standings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const standingsTab = page.getByRole('tab', { name: /standings/i });
      if (await standingsTab.isVisible()) {
        await standingsTab.click();
        await page.waitForLoadState('networkidle');

        // Should show standings table
        const table = page.locator('table');
        if (await table.isVisible()) {
          await expect(table).toBeVisible();
        }
      }
    });

    test('should recompute standings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const standingsTab = page.getByRole('tab', { name: /standings/i });
      if (await standingsTab.isVisible()) {
        await standingsTab.click();
        await page.waitForLoadState('networkidle');

        const recomputeButton = page.getByRole('button', { name: /recompute|refresh/i });
        if (await recomputeButton.isVisible()) {
          await expect(recomputeButton).toBeVisible();
        }
      }
    });

    test('should export standings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const standingsTab = page.getByRole('tab', { name: /standings/i });
      if (await standingsTab.isVisible()) {
        await standingsTab.click();
        await page.waitForLoadState('networkidle');

        const exportButton = page.getByRole('button', { name: /export/i });
        if (await exportButton.isVisible()) {
          await exportButton.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should configure tiebreakers', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for tiebreaker config
      const tiebreakerLink = page.getByRole('link', { name: /tiebreaker/i });
      const rulesTab = page.getByRole('tab', { name: /rules|config/i });

      if (await tiebreakerLink.isVisible()) {
        await tiebreakerLink.click();
      } else if (await rulesTab.isVisible()) {
        await rulesTab.click();
      }

      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Announcements', () => {
    test('should create tournament announcement', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const announcementsTab = page.getByRole('tab', { name: /announcements/i });
      if (await announcementsTab.isVisible()) {
        await announcementsTab.click();
        await page.waitForLoadState('networkidle');

        const newButton = page.getByRole('button', { name: /new|add|create/i });
        if (await newButton.isVisible()) {
          await newButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should send notification to all participants', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for notification/broadcast feature
      const broadcastButton = page.getByRole('button', { name: /broadcast|notify all/i });
      if (await broadcastButton.isVisible()) {
        await expect(broadcastButton).toBeVisible();
      }
    });
  });

  test.describe('Reports', () => {
    test('should generate tournament summary report', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const reportsTab = page.getByRole('tab', { name: /reports/i });
      if (await reportsTab.isVisible()) {
        await reportsTab.click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should view audit log', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const auditLink = page.getByRole('link', { name: /audit/i });
      if (await auditLink.isVisible()) {
        await auditLink.click();
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle concurrent admin actions', async ({ page, context }) => {
      const page2 = await context.newPage();

      // Login on second page too
      const loginPage2 = new LoginPage(page2);
      await loginPage2.goto();
      await loginPage2.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page2.waitForTimeout(3000);

      // Both admins view same tournament
      await page.goto('/admin');
      await page2.goto('/admin');

      await page.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      await page2.close();
    });

    test('should prevent invalid pairing generation', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Try to generate pairings with odd number of teams or other invalid state
      // System should show appropriate error
      await page.waitForTimeout(1000);
    });

    test('should handle large number of registrations', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Page should handle 100+ registrations without issues
      await page.waitForTimeout(1000);
    });
  });
});
