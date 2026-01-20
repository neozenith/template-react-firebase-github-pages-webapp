import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
    await expect(page.getByText('About This App')).toBeVisible();
  });

  test('unknown routes redirect to root', async ({ page }) => {
    await page.goto('/nonexistent-page');
    // With auth, should go to dashboard; without, to login
    // Since we have auth state, expect dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
