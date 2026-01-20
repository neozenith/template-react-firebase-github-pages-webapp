import { test as base, expect } from '@playwright/test';

// Tests that run WITHOUT auth state
const test = base.extend({});
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Unauthenticated flows', () => {
  test('login page renders for unauthenticated user', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await expect(
      page.getByText('Sign in with your Google account')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Sign in with Google/i })
    ).toBeVisible();
  });

  test('dashboard redirects unauthenticated user to login', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });

  test('sign in button triggers Google OAuth popup', async ({ page }) => {
    await page.goto('/');

    const popupPromise = page.waitForEvent('popup');
    await page.click('text=Sign in with Google');
    const popup = await popupPromise;

    // Firebase first opens its auth handler, which then redirects to Google
    // Check for either Firebase's auth handler or Google's login page
    const popupUrl = popup.url();
    const isFirebaseAuthHandler = popupUrl.includes('firebaseapp.com/__/auth/');
    const isGoogleAuth = popupUrl.includes('accounts.google.com');

    expect(isFirebaseAuthHandler || isGoogleAuth).toBe(true);
    await popup.close();
  });
});
