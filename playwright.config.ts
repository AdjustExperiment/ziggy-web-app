/**
 * Ziggy Online Debate Platform - Playwright E2E Test Configuration
 * Comprehensive testing for user flows, admin workflows, and tournament simulation
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration for Playwright E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8080',

    // Collect trace when retrying failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',

    // Default timeout for actions
    actionTimeout: 15000,

    // Default navigation timeout
    navigationTimeout: 30000,
  },

  // Global timeout for each test
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Projects for different browsers/configurations
  projects: [
    // Setup project - runs first to create test data
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'cleanup',
    },

    // Cleanup project - runs after all tests
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/,
    },

    // Desktop Chrome - Primary testing browser
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },

    // Mobile Chrome - Responsive testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },

    // Tablet - iPad testing
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
      dependencies: ['setup'],
    },
  ],

  // Web server configuration - starts dev server before tests
  webServer: {
    command: 'npm run dev',
    url: process.env.E2E_BASE_URL || 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 120000,
  },

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Global setup file
  globalSetup: undefined, // Using setup project instead

  // Global teardown file
  globalTeardown: undefined, // Using teardown project instead
});
