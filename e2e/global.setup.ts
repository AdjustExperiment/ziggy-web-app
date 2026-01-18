/**
 * Ziggy E2E Global Setup
 * Runs before all tests to set up test data and authentication states
 * Creates test accounts if they don't exist
 */

import { chromium, FullConfig, Page } from '@playwright/test';
import { SEEDED_ACCOUNTS } from './fixtures/test-data';
import * as fs from 'fs';
import * as path from 'path';

interface TestAccount {
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  path: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  {
    name: 'debater',
    ...SEEDED_ACCOUNTS.testDebater,
    firstName: 'Test',
    lastName: 'Debater',
    path: '.auth/debater.json'
  },
  {
    name: 'judge',
    ...SEEDED_ACCOUNTS.testJudge,
    firstName: 'Test',
    lastName: 'Judge',
    path: '.auth/judge.json'
  },
  {
    name: 'admin',
    ...SEEDED_ACCOUNTS.testAdmin,
    firstName: 'Test',
    lastName: 'Admin',
    path: '.auth/admin.json'
  },
  {
    name: 'sponsor',
    ...SEEDED_ACCOUNTS.testSponsor,
    firstName: 'Test',
    lastName: 'Sponsor',
    path: '.auth/sponsor.json'
  },
];

async function createAccount(page: Page, baseURL: string, account: TestAccount): Promise<boolean> {
  try {
    console.log(`   Creating account for ${account.name}...`);

    await page.goto(`${baseURL}/signup`);

    // Wait for signup form to be ready
    try {
      await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });
    } catch {
      console.log(`   ⚠️ Signup form not found`);
      return false;
    }

    // Fill signup form using placeholder-based selectors
    const firstNameInput = page.locator('input[placeholder*="First"], input[placeholder="John"]').first();
    const lastNameInput = page.locator('input[placeholder*="Last"], input[placeholder="Doe"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1);

    if (await firstNameInput.isVisible({ timeout: 5000 })) {
      await firstNameInput.fill(account.firstName);
      await lastNameInput.fill(account.lastName);
      await emailInput.fill(account.email);
      await passwordInput.fill(account.password);

      // Fill confirm password if it exists
      if (await confirmPasswordInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmPasswordInput.fill(account.password);
      }

      // Submit form
      const submitButton = page.getByRole('button', { name: /create account/i });
      await submitButton.click();

      // Wait for response
      await page.waitForTimeout(3000);

      // Check for success message or redirect
      const successIndicator = page.locator('text=Check Your Email, text=verification, text=Account Created');
      const errorIndicator = page.locator('[role="alert"], .text-destructive, [data-sonner-toast]');

      if (await successIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`   ✅ Account created for ${account.name} (check email for verification)`);
        return true;
      } else if (await errorIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await errorIndicator.textContent().catch(() => '');
        if (errorText?.toLowerCase().includes('already')) {
          console.log(`   ℹ️ Account for ${account.name} already exists`);
          return true;
        }
        console.log(`   ⚠️ Error creating ${account.name}: ${errorText}`);
        return false;
      }

      // Might have succeeded without clear indicator
      console.log(`   ℹ️ Account creation attempted for ${account.name}`);
      return true;
    }

    console.log(`   ⚠️ Could not find signup form fields`);
    return false;
  } catch (error) {
    console.log(`   ⚠️ Error creating account for ${account.name}: ${error}`);
    return false;
  }
}

async function loginAndSaveSession(page: Page, context: any, baseURL: string, account: TestAccount): Promise<boolean> {
  try {
    await page.goto(`${baseURL}/login`);

    // Wait for login form to be ready (not in loading state)
    try {
      await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });
    } catch {
      console.log(`   ⚠️ Login form not found (page may still be loading)`);
      return false;
    }

    // Fill login form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.getByRole('button', { name: /sign in|access/i }).first();

    await emailInput.fill(account.email);
    await passwordInput.fill(account.password);
    await loginButton.click();

    // Wait for login to complete
    await page.waitForTimeout(3000);

    // Check if login was successful (not still on login page or no error shown)
    const currentUrl = page.url();
    const errorVisible = await page.locator('[role="alert"], [data-sonner-toast]:has-text("error"), [data-sonner-toast]:has-text("Error")')
      .isVisible({ timeout: 1000 }).catch(() => false);

    if (!currentUrl.includes('/login') && !errorVisible) {
      // Ensure auth directory exists
      const authDir = path.dirname(account.path);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      // Save authenticated state
      await context.storageState({ path: account.path });
      console.log(`   ✅ ${account.name} session saved`);
      return true;
    }

    // Check for specific error messages
    if (errorVisible) {
      const errorText = await page.locator('[role="alert"], [data-sonner-toast]').textContent().catch(() => '');
      console.log(`   ⚠️ Login failed for ${account.name}: ${errorText}`);
    }

    return false;
  } catch (error) {
    console.log(`   ⚠️ Login error for ${account.name}: ${error}`);
    return false;
  }
}

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting E2E Test Setup...\n');

  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:8080';

  // Ensure .auth directory exists
  if (!fs.existsSync('.auth')) {
    fs.mkdirSync('.auth', { recursive: true });
  }

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

    console.log('🔐 Setting up test accounts and sessions...\n');

    for (const account of TEST_ACCOUNTS) {
      console.log(`\n📝 Processing ${account.name} account...`);

      // Try to login first
      const loginSuccess = await loginAndSaveSession(page, context, baseURL, account);

      if (!loginSuccess) {
        // Account doesn't exist or login failed - try to create it
        console.log(`   Login failed, attempting to create account...`);
        await createAccount(page, baseURL, account);

        // Try to login again after account creation
        // Note: Account may need email verification first
        console.log(`   Attempting login after account creation...`);
        const retryLogin = await loginAndSaveSession(page, context, baseURL, account);

        if (!retryLogin) {
          console.log(`   ⚠️ Could not authenticate ${account.name}`);
          console.log(`   Note: Account may require email verification before login`);
        }
      }
    }

    console.log('\n\n✅ Global setup complete!\n');
    console.log('Note: Some test accounts may require email verification.');
    console.log('For local testing, you can disable email confirmation in Supabase dashboard.\n');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
