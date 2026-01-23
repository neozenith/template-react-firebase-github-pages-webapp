import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('authenticated user sees dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Dashboard shows user's name as main heading and profile image
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByAltText('Profile')).toBeVisible();
  });

  test('dashboard shows user profile info', async ({ page }) => {
    await page.goto('/dashboard');
    // User email should be visible (contains @)
    await expect(page.locator('text=@')).toBeVisible();
    // Sign Out button should be present
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('sign out redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Sign Out');
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Sign in with Google')).toBeVisible();
  });

  test('login page redirects authenticated user to dashboard', async ({
    page,
  }) => {
    await page.goto('/');
    // Should auto-redirect to dashboard since we're authenticated
    await expect(page).toHaveURL('/dashboard');
  });
});
