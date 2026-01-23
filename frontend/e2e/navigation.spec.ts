import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/dashboard');

    // User profile and Sign Out button
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
    // Google API panels (Sheets, Calendars, Drive)
    await expect(page.getByRole('heading', { name: 'Sheets' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Calendars' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Drive' })).toBeVisible();
  });

  test('unknown routes redirect to root', async ({ page }) => {
    await page.goto('/nonexistent-page');
    // With auth, should go to dashboard; without, to login
    // Since we have auth state, expect dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
