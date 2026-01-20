/**
 * Interactive auth setup script for Google OAuth.
 *
 * This opens a browser with the Playwright Inspector, allowing you to:
 * 1. Click "Sign in with Google"
 * 2. Complete Google OAuth manually
 * 3. Wait for redirect to /dashboard
 * 4. Press "Resume" in the Inspector to save auth state
 *
 * Run with: make e2e-auth
 */
import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = 'playwright/.auth/user.json';

setup('authenticate via Google OAuth', async ({ page }) => {
  // Ensure auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to login page
  await page.goto('/');

  // Verify we're on the login page
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           MANUAL GOOGLE SIGN-IN REQUIRED                 ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  1. Click "Sign in with Google" in the browser           ║');
  console.log('║  2. Complete Google OAuth in the popup                   ║');
  console.log('║  3. Wait for redirect to /dashboard                      ║');
  console.log('║  4. Click "Resume" (▶) in the Playwright Inspector       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Pause execution - opens Playwright Inspector for manual interaction
  // User completes OAuth, then clicks "Resume" to continue
  await page.pause();

  // After resume, verify we're on the dashboard (auth succeeded)
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Save auth state for subsequent test runs
  await page.context().storageState({ path: AUTH_FILE });

  console.log('\n✅ Auth state saved to:', AUTH_FILE);
  console.log('You can now run: make e2e\n');
});
