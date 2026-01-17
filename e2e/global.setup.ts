/**
 * Ziggy E2E Global Setup
 * Runs before all tests to set up test data and authentication states
 */

import { chromium, FullConfig } from '@playwright/test';
import { SEEDED_ACCOUNTS } from './fixtures/test-data';

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting E2E Test Setup...\n');

  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173';

  // Create browser for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Verify the app is running
    console.log('📡 Verifying application is accessible...');
    const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    if (!response || response.status() >= 400) {
      throw new Error(`Application not accessible at ${baseURL}. Status: ${response?.status()}`);
    }
    console.log('✅ Application is running\n');

    // Set up authenticated sessions for each test account type
    const accounts = [
      { name: 'debater', ...SEEDED_ACCOUNTS.testDebater, path: '.auth/debater.json' },
      { name: 'judge', ...SEEDED_ACCOUNTS.testJudge, path: '.auth/judge.json' },
      { name: 'admin', ...SEEDED_ACCOUNTS.testAdmin, path: '.auth/admin.json' },
      { name: 'sponsor', ...SEEDED_ACCOUNTS.testSponsor, path: '.auth/sponsor.json' },
    ];

    console.log('🔐 Setting up authenticated sessions...');

    for (const account of accounts) {
      try {
        console.log(`   Authenticating ${account.name}...`);

        await page.goto(`${baseURL}/login`);
        await page.waitForLoadState('networkidle');

        // Fill login form
        const emailInput = page.getByLabel(/email/i);
        const passwordInput = page.locator('input[type="password"]').first();
        const loginButton = page.getByRole('button', { name: /sign in|log in/i });

        if (await emailInput.isVisible({ timeout: 5000 })) {
          await emailInput.fill(account.email);
          await passwordInput.fill(account.password);
          await loginButton.click();

          // Wait for login to complete
          await page.waitForTimeout(3000);

          // Check if login was successful (not still on login page)
          const currentUrl = page.url();
          if (!currentUrl.includes('/login')) {
            // Save authenticated state
            await context.storageState({ path: account.path });
            console.log(`   ✅ ${account.name} session saved`);
          } else {
            console.log(`   ⚠️ ${account.name} login may have failed (test account may not exist)`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Could not authenticate ${account.name}: ${error}`);
      }
    }

    console.log('\n✅ Global setup complete!\n');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
