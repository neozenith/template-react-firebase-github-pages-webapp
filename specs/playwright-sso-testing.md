# Playwright E2E Testing with SSO Specification

## Overview

Set up Playwright for end-to-end testing of the React + Firebase application using **real Google SSO authentication** with manual auth state capture.

## Strategy: Auth State Reuse

Authenticate once manually at the start of each testing session, save browser state, reuse in all tests.

**How it works:**
1. Run `make e2e-auth` to open an interactive browser
2. Sign in with Google manually
3. Auth state saved to `playwright/.auth/user.json`
4. All subsequent tests reuse this auth state
5. If tests fail due to expired auth, re-run `make e2e-auth`

**Pros:**
- Tests real OAuth flow end-to-end
- No mocking required
- Catches real integration issues
- Simple mental model

**Cons:**
- Requires manual setup at start of session
- Auth state expires (typically 1 hour for access tokens)
- Cannot run in CI without stored credentials

---

## Workflow

### Starting a Test Session

```bash
# 1. Start the dev server (in a separate terminal or let Playwright start it)
make dev

# 2. Capture auth state manually
make e2e-auth

# 3. Run tests (uses saved auth state)
make e2e
```

### When Auth Expires

If you see tests failing with redirect to login or "unauthenticated" errors:

```bash
# Re-capture auth state
make e2e-auth

# Re-run tests
make e2e
```

### Quick Reference

| Command | Description |
|---------|-------------|
| `make e2e-auth` | Interactive auth capture (run first) |
| `make e2e` | Run all E2E tests |
| `make e2e-ui` | Run with Playwright UI |
| `make e2e-headed` | Run with visible browser |
| `make e2e-debug` | Run in debug mode |

---

## Implementation Plan

### Phase 1: Install and Configure Playwright

**Install dependencies:**
```bash
npm --prefix frontend install -D @playwright/test
npx --prefix frontend playwright install chromium
```

**File:** `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

const AUTH_FILE = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Use saved auth state for all tests
    storageState: AUTH_FILE,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
```

### Phase 2: Auth Capture Script

**File:** `frontend/e2e/auth-capture.ts`

```typescript
/**
 * Interactive auth capture script.
 * Run with: npx playwright test e2e/auth-capture.ts --headed --project=chromium
 *
 * This opens a browser, waits for you to sign in manually,
 * then saves the auth state for subsequent test runs.
 */
import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = 'playwright/.auth/user.json';

test('capture auth state', async ({ page }) => {
  // Ensure auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to app
  await page.goto('/');

  console.log('\n========================================');
  console.log('MANUAL AUTH CAPTURE');
  console.log('========================================');
  console.log('1. Sign in with Google in the browser');
  console.log('2. Wait for redirect to /dashboard');
  console.log('3. Auth state will be saved automatically');
  console.log('========================================\n');

  // Wait for user to complete sign-in (max 2 minutes)
  await page.waitForURL('**/dashboard', { timeout: 120000 });

  // Verify we're authenticated
  await page.waitForSelector('text=Dashboard', { timeout: 5000 });

  // Save auth state
  await page.context().storageState({ path: AUTH_FILE });

  console.log('\n✅ Auth state saved to:', AUTH_FILE);
  console.log('You can now run: make e2e\n');
});
```

### Phase 3: Test Fixtures

**File:** `frontend/e2e/fixtures.ts`

```typescript
import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';

const AUTH_FILE = 'playwright/.auth/user.json';

// Check if auth file exists and warn if not
function checkAuthFile() {
  if (!fs.existsSync(AUTH_FILE)) {
    console.error('\n❌ Auth state not found!');
    console.error('Run: make e2e-auth');
    console.error('Then retry: make e2e\n');
    throw new Error('Auth state file not found. Run "make e2e-auth" first.');
  }
}

export const test = base.extend<{
  authCheck: void;
}>({
  authCheck: [async ({}, use) => {
    checkAuthFile();
    await use();
  }, { auto: true }],
});

export { expect };
```

### Phase 4: Write E2E Tests

**File:** `frontend/e2e/auth.spec.ts`

```typescript
import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('authenticated user sees dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
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

  test('login page redirects authenticated user to dashboard', async ({ page }) => {
    await page.goto('/');
    // Should auto-redirect to dashboard since we're authenticated
    await expect(page).toHaveURL('/dashboard');
  });
});
```

**File:** `frontend/e2e/navigation.spec.ts`

```typescript
import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
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
```

**File:** `frontend/e2e/unauthenticated.spec.ts`

```typescript
import { test as base, expect } from '@playwright/test';

// Tests that run WITHOUT auth state
const test = base.extend({});
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Unauthenticated flows', () => {
  test('login page renders for unauthenticated user', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await expect(page.getByText('Sign in with your Google account')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
  });

  test('dashboard redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });

  test('sign in button triggers Google OAuth popup', async ({ page }) => {
    await page.goto('/');

    const popupPromise = page.waitForEvent('popup');
    await page.click('text=Sign in with Google');
    const popup = await popupPromise;

    expect(popup.url()).toContain('accounts.google.com');
    await popup.close();
  });
});
```

### Phase 5: Makefile Targets

**Add to `Makefile`:**

```makefile
e2e:
	npm --prefix frontend run e2e

e2e-auth:
	@echo "Opening browser for manual Google sign-in..."
	@echo "Sign in, then close the browser when redirected to /dashboard"
	npm --prefix frontend run e2e:auth

e2e-ui:
	npm --prefix frontend run e2e:ui

e2e-headed:
	npm --prefix frontend run e2e:headed

e2e-debug:
	npm --prefix frontend run e2e:debug
```

**Add to `frontend/package.json` scripts:**

```json
{
  "scripts": {
    "e2e": "playwright test --ignore-snapshots",
    "e2e:auth": "playwright test e2e/auth-capture.ts --headed --project=chromium",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug"
  }
}
```

### Phase 6: Git Ignore

**Add to `frontend/.gitignore`:**

```
# Playwright
playwright/.auth/
playwright-report/
test-results/
```

---

## File Structure

```
frontend/
├── playwright.config.ts         # Playwright configuration
├── e2e/
│   ├── fixtures.ts              # Test fixtures with auth check
│   ├── auth-capture.ts          # Manual auth capture script
│   ├── auth.spec.ts             # Authenticated user tests
│   ├── navigation.spec.ts       # Navigation tests
│   └── unauthenticated.spec.ts  # Tests without auth
└── playwright/
    └── .auth/                   # Saved auth state (gitignored)
        └── user.json
```

---

## Test Cases

| Test | File | Auth | Description |
|------|------|------|-------------|
| Dashboard visible | `auth.spec.ts` | ✅ | Authenticated user sees dashboard |
| Profile info shown | `auth.spec.ts` | ✅ | Email and UID displayed |
| Sign out works | `auth.spec.ts` | ✅ | Logout redirects to login |
| Auto-redirect to dashboard | `auth.spec.ts` | ✅ | Login page redirects if auth'd |
| Dashboard renders | `navigation.spec.ts` | ✅ | UI elements present |
| Unknown routes handled | `navigation.spec.ts` | ✅ | Catch-all route works |
| Login page renders | `unauthenticated.spec.ts` | ❌ | UI elements present |
| Protected route redirect | `unauthenticated.spec.ts` | ❌ | Dashboard requires auth |
| OAuth popup opens | `unauthenticated.spec.ts` | ❌ | Google popup triggered |

---

## Troubleshooting

### "Auth state file not found"

```bash
make e2e-auth  # Capture auth state first
make e2e       # Then run tests
```

### Tests fail with redirect to login

Auth token expired. Re-capture:

```bash
make e2e-auth
make e2e
```

### Google shows CAPTCHA or blocks login

- Use a dedicated test Google account
- Don't run auth capture too frequently
- Try from a different network if blocked

### Tests hang waiting for dashboard

During `make e2e-auth`:
1. Ensure you complete sign-in within 2 minutes
2. Wait for the `/dashboard` URL to load
3. Browser will close automatically when done

---

## Implementation Checklist

### Setup
- [ ] Install `@playwright/test` dev dependency
- [ ] Run `npx playwright install chromium`
- [ ] Create `playwright.config.ts`
- [ ] Create `e2e/` directory structure
- [ ] Add playwright paths to `.gitignore`

### Auth Capture
- [ ] Create `e2e/auth-capture.ts` script
- [ ] Create `e2e/fixtures.ts` with auth check
- [ ] Test manual auth capture workflow

### Tests
- [ ] Write `auth.spec.ts` (4 tests)
- [ ] Write `navigation.spec.ts` (2 tests)
- [ ] Write `unauthenticated.spec.ts` (3 tests)
- [ ] Verify all tests pass locally

### Makefile
- [ ] Add npm scripts to `package.json`
- [ ] Add Makefile targets
- [ ] Document workflow in help target

### Verification
- [ ] `make e2e-auth` captures auth state
- [ ] `make e2e` runs all tests with auth
- [ ] `make e2e-ui` opens interactive UI
- [ ] `make e2e-headed` shows browser
- [ ] Tests fail gracefully when auth expires

---

## CI Considerations

This strategy uses **manual auth capture** which doesn't work automatically in CI. Options for CI:

1. **Skip E2E in CI** - Run locally only, rely on unit tests for CI
2. **Store auth state as secret** - Capture locally, encrypt and store in CI secrets (tokens expire)
3. **Use service account** - Google Workspace service account with domain-wide delegation
4. **Add mock strategy later** - Keep this for local dev, add mocking for CI when needed

For now, this spec focuses on **local development workflow**.

---

## References

- [Playwright Authentication](https://playwright.dev/docs/auth)
- [Playwright codegen](https://playwright.dev/docs/codegen)
- [Google Auth with Playwright](https://adequatica.medium.com/google-authentication-with-playwright-8233b207b71a)
