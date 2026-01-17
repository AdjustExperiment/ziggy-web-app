/**
 * Ziggy E2E Global Teardown
 * Runs after all tests to clean up test data
 */

import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting E2E Test Teardown...\n');

  try {
    // Clean up auth state files
    const authDir = '.auth';
    if (fs.existsSync(authDir)) {
      console.log('   Cleaning up auth state files...');
      const files = fs.readdirSync(authDir);
      for (const file of files) {
        fs.unlinkSync(path.join(authDir, file));
      }
      fs.rmdirSync(authDir);
      console.log('   ✅ Auth files cleaned');
    }

    // Generate test summary
    console.log('\n📊 Test Summary:');
    console.log('   - Test results available in: playwright-report/');
    console.log('   - Screenshots saved in: test-results/');
    console.log('   - JSON results in: test-results/results.json');

    console.log('\n✅ Global teardown complete!\n');

  } catch (error) {
    console.error('⚠️ Teardown encountered an issue:', error);
    // Don't throw - teardown errors shouldn't fail the test run
  }
}

export default globalTeardown;
