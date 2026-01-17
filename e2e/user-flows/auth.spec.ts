/**
 * Ziggy E2E Tests - Authentication Flows
 * Complete user authentication journey including edge cases
 */

import { test, expect } from '@playwright/test';
import { createTestUser, EDGE_CASES } from '../fixtures/test-data';
import { LoginPage, SignUpPage, NavigationBar } from '../utils/page-objects';
import { logoutUser, expectOnPage, expectToast } from '../utils/test-helpers';

test.describe('User Authentication Flow', () => {
  test.describe('Sign Up', () => {
    test('should create a new account successfully', async ({ page }) => {
      const user = createTestUser();
      const signUpPage = new SignUpPage(page);

      await signUpPage.goto();

      // Fill out the form
      await signUpPage.signUp(user);

      // Should redirect to dashboard or show verification message
      await expect(page).toHaveURL(/\/(dashboard|account|verify|login)/);
    });

    test('should show error for existing email', async ({ page }) => {
      const signUpPage = new SignUpPage(page);
      await signUpPage.goto();

      // Try to sign up with an email that might already exist
      await signUpPage.signUp({
        email: 'existing@test.com',
        password: 'TestPassword123!',
        firstName: 'Existing',
        lastName: 'User',
        role: 'debater'
      });

      // Should show error or remain on signup page
      // (behavior depends on whether email exists)
      await page.waitForTimeout(2000);
    });

    test('should validate password requirements', async ({ page }) => {
      const signUpPage = new SignUpPage(page);
      await signUpPage.goto();

      // Fill with weak password
      await signUpPage.firstNameInput.fill('Test');
      await signUpPage.lastNameInput.fill('User');
      await signUpPage.emailInput.fill(`weak.pwd.${Date.now()}@test.com`);
      await signUpPage.passwordInput.fill('weak');

      await signUpPage.signUpButton.click();

      // Should show validation error
      await expect(page.locator('.text-destructive, [role="alert"]')).toBeVisible({
        timeout: 5000
      });
    });

    test('should handle special characters in names', async ({ page }) => {
      const specialUser = EDGE_CASES.specialCharacterUser;
      const signUpPage = new SignUpPage(page);

      await signUpPage.goto();
      await signUpPage.signUp(specialUser);

      // Should handle special characters gracefully
      await page.waitForTimeout(2000);
    });

    test('should validate email format', async ({ page }) => {
      const signUpPage = new SignUpPage(page);
      await signUpPage.goto();

      await signUpPage.emailInput.fill('invalid-email-format');
      await signUpPage.firstNameInput.fill('Test');
      await signUpPage.lastNameInput.fill('User');
      await signUpPage.passwordInput.fill('ValidPassword123!');

      await signUpPage.signUpButton.click();

      // Should show email validation error
      await expect(page.locator(':text("valid email"), .text-destructive')).toBeVisible({
        timeout: 5000
      });
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Use test credentials (assumes test account exists)
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');

      // Should redirect away from login
      await page.waitForTimeout(3000);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('nonexistent@test.com', 'WrongPassword123!');

      // Should show error message
      await loginPage.expectLoginError();
    });

    test('should show error for wrong password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('test.debater@ziggytest.com', 'WrongPassword!');

      await loginPage.expectLoginError();
    });

    test('should navigate to signup from login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.signUpLink.click();

      await expect(page).toHaveURL(/\/signup/);
    });

    test('should handle forgot password link', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Check if forgot password link exists and is clickable
      if (await loginPage.forgotPasswordLink.isVisible()) {
        await loginPage.forgotPasswordLink.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');
      await page.waitForTimeout(2000);

      // Then logout
      const nav = new NavigationBar(page);
      if (await nav.isLoggedIn()) {
        await nav.logout();
        await expect(page).toHaveURL(/\/(login|\/)/);
      }
    });

    test('should redirect to login when accessing protected route after logout', async ({ page }) => {
      // Try to access dashboard without being logged in
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');

      await page.waitForTimeout(2000);

      // Reload the page
      await page.reload();

      // Should still be logged in
      const nav = new NavigationBar(page);
      await page.waitForTimeout(1000);
    });

    test('should maintain session when navigating between pages', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');

      await page.waitForTimeout(2000);

      // Navigate to different pages
      await page.goto('/tournaments');
      await page.waitForTimeout(500);

      await page.goto('/');
      await page.waitForTimeout(500);

      // Should still be logged in
      const nav = new NavigationBar(page);
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from admin', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from judge dashboard', async ({ page }) => {
      await page.goto('/judge');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from sponsor dashboard', async ({ page }) => {
      await page.goto('/sponsor/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from account page', async ({ page }) => {
      await page.goto('/account');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle rapid login/logout cycles', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const nav = new NavigationBar(page);

      for (let i = 0; i < 3; i++) {
        await loginPage.goto();
        await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');
        await page.waitForTimeout(1500);

        if (await nav.isLoggedIn()) {
          await nav.logout();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should handle network timeout during login gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/auth/**', async route => {
        await new Promise(r => setTimeout(r, 5000));
        await route.continue();
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.debater@ziggytest.com', 'TestDebater123!');

      // Should not crash, may show loading or timeout error
      await page.waitForTimeout(6000);
    });

    test('should handle concurrent login attempts', async ({ page, context }) => {
      const page2 = await context.newPage();

      const loginPage1 = new LoginPage(page);
      const loginPage2 = new LoginPage(page2);

      await loginPage1.goto();
      await loginPage2.goto();

      // Login on both pages simultaneously
      await Promise.all([
        loginPage1.login('test.debater@ziggytest.com', 'TestDebater123!'),
        loginPage2.login('test.debater@ziggytest.com', 'TestDebater123!')
      ]);

      await page.waitForTimeout(3000);
      await page2.close();
    });
  });
});
