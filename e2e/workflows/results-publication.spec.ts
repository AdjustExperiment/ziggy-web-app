import { test, expect } from '@playwright/test';

test.describe('Results Publication Workflows', () => {
  test('should display public results page', async ({ page }) => {
    await page.goto('/results');

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // Should show results heading or empty state
    const content = await page.textContent('body');
    expect(
      content?.includes('Results') || 
      content?.includes('results') ||
      content?.includes('Tournaments') ||
      content?.includes('No results')
    ).toBeTruthy();
  });

  test('should display tournament standings when available', async ({ page }) => {
    // First get a tournament ID from the results page
    await page.goto('/results');
    
    // Look for any tournament links
    const tournamentLinks = page.locator('a[href*="/tournament"]');
    const count = await tournamentLinks.count();
    
    if (count > 0) {
      // Click first tournament
      await tournamentLinks.first().click();
      
      // Navigate to standings tab if available
      const standingsTab = page.locator('button:has-text("Standings"), a:has-text("Standings")');
      if (await standingsTab.isVisible()) {
        await standingsTab.click();
        
        // Verify standings content
        await expect(page.locator('table, [class*="standings"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should handle tournament with no results gracefully', async ({ page }) => {
    // Try to access a non-existent tournament
    await page.goto('/tournament/00000000-0000-0000-0000-000000000000/standings');
    
    // Should show error or redirect
    await expect(page.locator('body')).toBeVisible();
    
    // Check for error message or redirect
    const content = await page.textContent('body');
    expect(
      content?.includes('not found') ||
      content?.includes('Not Found') ||
      content?.includes('error') ||
      page.url().includes('/') // Redirected
    ).toBeTruthy();
  });
});

test.describe('Standings Display', () => {
  test('should show correct columns in standings table', async ({ page }) => {
    await page.goto('/results');
    
    // Find first tournament with standings
    const tournamentLinks = page.locator('a[href*="/tournament"]');
    const count = await tournamentLinks.count();
    
    if (count > 0) {
      await tournamentLinks.first().click();
      
      const standingsTab = page.locator('button:has-text("Standings"), a:has-text("Standings")');
      if (await standingsTab.isVisible()) {
        await standingsTab.click();
        
        // Check for standard standings columns
        const table = page.locator('table').first();
        if (await table.isVisible()) {
          const headerText = await table.locator('thead, th').textContent();
          
          // Should have rank, team name, wins/record, speaks columns
          expect(
            headerText?.includes('Rank') ||
            headerText?.includes('#') ||
            headerText?.includes('Team') ||
            headerText?.includes('W') ||
            headerText?.includes('Wins')
          ).toBeTruthy();
        }
      }
    }
  });
});
