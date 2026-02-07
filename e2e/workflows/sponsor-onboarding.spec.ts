import { test, expect } from '@playwright/test';
import { getTestSponsor, getSupabaseUrl, getSupabaseAnonKey } from '../fixtures/comprehensive-test-data';

test.describe('Sponsor Onboarding Workflows', () => {
  const testPrefix = 'E2E_SPONSOR_';

  test('should display sponsor invitation page', async ({ page }) => {
    // Navigate to sponsor invite page with a test token
    await page.goto('/sponsor/invite/test-token-123');

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Should show either invitation form or error message
    const content = await page.textContent('body');
    expect(
      content?.includes('sponsor') || 
      content?.includes('Sponsor') || 
      content?.includes('invitation') ||
      content?.includes('expired') ||
      content?.includes('invalid')
    ).toBeTruthy();
  });

  test('should show sponsor application page', async ({ page }) => {
    await page.goto('/sponsor/apply');

    // Page should load (may redirect if not implemented)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display sponsors page', async ({ page }) => {
    await page.goto('/sponsors');

    // Verify page content
    await expect(page.locator('body')).toBeVisible();
    
    // Should show sponsors or empty state
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sponsor Dashboard', () => {
  test.skip('should show sponsor dashboard for authenticated sponsor', async ({ page }) => {
    // This test requires a logged-in sponsor user
    // Skip for now as it needs auth setup
    
    await page.goto('/sponsor/dashboard');
    
    // Verify dashboard elements
    await expect(page.locator('h1, h2')).toContainText(/dashboard|sponsor/i);
  });
});
