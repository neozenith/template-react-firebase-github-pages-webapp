import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('authenticated user sees dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible();
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });

  test('dashboard shows user profile info', async ({ page }) => {
    await page.goto('/dashboard');
    // User email should be visible
    await expect(page.locator('text=@')).toBeVisible();
    // User ID should be visible
    await expect(page.locator('code')).toBeVisible();
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
