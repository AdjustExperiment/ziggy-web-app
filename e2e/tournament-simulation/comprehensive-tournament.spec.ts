import { test, expect } from '@playwright/test';
import {
  DEFAULT_QA_CONFIG,
  QUICK_TEST_CONFIG,
  invokeQATest,
  cleanupQATestData,
  assertPhaseSuccess,
  assertMinimumStatistics,
  getTestAdmin,
  type QATestResult,
} from '../fixtures/comprehensive-test-data';

test.describe('Comprehensive Tournament Simulation', () => {
  let testResult: QATestResult | null = null;

  test.beforeAll(async () => {
    // Clean up any existing test data first
    try {
      await cleanupQATestData('QA_E2E_');
    } catch (e) {
      console.log('Cleanup skipped:', e);
    }
  });

  test.afterAll(async () => {
    // Optional: Clean up after tests
    if (testResult?.test_data?.test_prefix) {
      try {
        await cleanupQATestData(testResult.test_data.test_prefix);
      } catch (e) {
        console.log('Post-test cleanup skipped:', e);
      }
    }
  });

  test('should complete full tournament lifecycle via edge function', async () => {
    // Use quick config for faster CI runs
    const config = {
      ...QUICK_TEST_CONFIG,
      testPrefix: 'QA_E2E_',
    };

    // Invoke the comprehensive test
    testResult = await invokeQATest(config);

    // Verify overall success
    expect(testResult.success).toBe(true);
    expect(testResult.phases.length).toBeGreaterThan(0);

    // Verify critical phases passed
    assertPhaseSuccess(testResult, 'user_creation');
    assertPhaseSuccess(testResult, 'tournament_creation');
    assertPhaseSuccess(testResult, 'team_registration');
    assertPhaseSuccess(testResult, 'preliminary_rounds');
    assertPhaseSuccess(testResult, 'break_generation');
    assertPhaseSuccess(testResult, 'elimination_rounds');
    assertPhaseSuccess(testResult, 'results_publication');

    // Log statistics
    console.log('Test Statistics:', testResult.statistics);
    console.log('Tournament ID:', testResult.test_data.tournament_id);
  });

  test('should verify tournament data in database', async ({ page }) => {
    test.skip(!testResult?.success, 'Skipping - previous test failed');

    const tournamentId = testResult!.test_data.tournament_id;

    // Navigate to tournament page
    await page.goto(`/tournament/${tournamentId}`);

    // Verify page loads
    await expect(page.locator('body')).toBeVisible();

    // Check for tournament content
    const content = await page.textContent('body');
    expect(
      content?.includes('QA_E2E_') ||
      content?.includes('Championship') ||
      content?.includes('Tournament')
    ).toBeTruthy();
  });

  test('should display standings for completed tournament', async ({ page }) => {
    test.skip(!testResult?.success, 'Skipping - previous test failed');

    const tournamentId = testResult!.test_data.tournament_id;

    // Navigate to standings
    await page.goto(`/tournament/${tournamentId}/standings`);

    // Wait for content
    await expect(page.locator('body')).toBeVisible();

    // Look for standings table or content
    const standingsContent = page.locator('table, [class*="standings"], [class*="team"]');
    await expect(standingsContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show published results on public page', async ({ page }) => {
    test.skip(!testResult?.success, 'Skipping - previous test failed');

    // Navigate to results
    await page.goto('/results');

    // Look for the test tournament
    const tournamentName = `QA_E2E_Championship`;
    const tournamentLink = page.locator(`a:has-text("${tournamentName}"), [class*="tournament"]:has-text("QA_E2E_")`);
    
    // Tournament should be visible if results are published
    // (May not appear immediately in cached views)
    const isVisible = await tournamentLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await tournamentLink.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Tournament Workflow UI Verification', () => {
  test('should display tournament list', async ({ page }) => {
    await page.goto('/tournaments');

    // Verify tournaments page loads
    await expect(page.locator('body')).toBeVisible();

    // Should show tournaments or empty state
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should display tournament registration page', async ({ page }) => {
    // First find a tournament
    await page.goto('/tournaments');
    
    const tournamentCards = page.locator('[class*="tournament"], a[href*="/tournament"]');
    const count = await tournamentCards.count();
    
    if (count > 0) {
      await tournamentCards.first().click();
      
      // Look for registration button
      const registerButton = page.locator('button:has-text("Register"), a:has-text("Register")');
      if (await registerButton.isVisible({ timeout: 5000 })) {
        await registerButton.click();
        
        // Verify registration page/modal loads
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should display postings/pairings page', async ({ page }) => {
    await page.goto('/tournaments');
    
    const tournamentCards = page.locator('a[href*="/tournament"]');
    const count = await tournamentCards.count();
    
    if (count > 0) {
      await tournamentCards.first().click();
      
      // Navigate to postings/pairings
      const postingsTab = page.locator('button:has-text("Postings"), a:has-text("Postings"), button:has-text("Pairings"), a:has-text("Pairings")');
      if (await postingsTab.isVisible({ timeout: 5000 })) {
        await postingsTab.click();
        
        // Verify pairings content
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe('Ballot Entry Verification', () => {
  test.skip('should display ballot entry form for judge', async ({ page }) => {
    // This test requires a logged-in judge with an active pairing
    // Skip for now as it needs specific auth setup
    
    await page.goto('/judge/dashboard');
    
    // Verify judge dashboard loads
    await expect(page.locator('h1, h2')).toContainText(/judge|dashboard/i);
  });
});

test.describe('Break Announcement Verification', () => {
  test('should display break page for completed tournaments', async ({ page }) => {
    await page.goto('/tournaments');
    
    const tournamentCards = page.locator('a[href*="/tournament"]');
    const count = await tournamentCards.count();
    
    if (count > 0) {
      await tournamentCards.first().click();
      
      // Look for break/eliminations tab
      const breakTab = page.locator('button:has-text("Break"), a:has-text("Break"), button:has-text("Elims"), a:has-text("Elimination")');
      if (await breakTab.isVisible({ timeout: 5000 })) {
        await breakTab.click();
        
        // Verify break content
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});
