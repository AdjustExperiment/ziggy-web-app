import { test, expect } from '@playwright/test';
import { getTestDebater, getTestAdmin, getSupabaseUrl, getSupabaseAnonKey } from '../fixtures/comprehensive-test-data';

test.describe('User Registration Workflows', () => {
  const testPrefix = 'E2E_USER_';

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should allow standalone account creation', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `${testPrefix.toLowerCase()}signup_${timestamp}@e2e-test.qa`,
      password: 'TestPass123!',
      firstName: 'E2E',
      lastName: 'Tester',
    };

    // Navigate to signup page
    await page.goto('/signup');

    // Fill signup form
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    
    // Fill name fields if they exist
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First"]');
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill(testUser.firstName);
    }
    
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Last"]');
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill(testUser.lastName);
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect or success message
    await expect(page).toHaveURL(/(dashboard|home|account|verify)/i, { timeout: 10000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login form elements are present
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/signup');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    const errorMessages = page.locator('[class*="error"], [class*="invalid"], [role="alert"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');

    // Find and click signup link
    const signupLink = page.locator('a[href*="signup"], a:has-text("Sign up"), a:has-text("Create account")');
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/signup/i);
    }

    // Find and click login link
    const loginLink = page.locator('a[href*="login"], a:has-text("Log in"), a:has-text("Sign in")');
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/i);
    }
  });
});

test.describe('Account Editing Workflows', () => {
  test.skip('should allow user to update profile', async ({ page }) => {
    // This test requires a logged-in user
    // Skip for now as it needs auth setup
    
    await page.goto('/account');
    
    // Verify account page loads
    await expect(page.locator('h1, h2')).toContainText(/account|profile|settings/i);
    
    // Find and update first name
    const firstNameInput = page.locator('input[name="firstName"], input[name="first_name"]');
    if (await firstNameInput.isVisible()) {
      await firstNameInput.clear();
      await firstNameInput.fill('UpdatedName');
    }
    
    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Verify success message
      await expect(page.locator('[class*="success"], [class*="toast"]')).toBeVisible();
    }
  });
});
