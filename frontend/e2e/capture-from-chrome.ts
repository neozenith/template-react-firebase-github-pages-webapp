/**
 * Capture Firebase auth state from a real Chrome browser.
 *
 * This script connects to an existing Chrome instance via CDP and
 * extracts Firebase auth data from IndexedDB using Chrome DevTools Protocol.
 *
 * Usage:
 * 1. Start Chrome with remote debugging:
 *    make e2e-chrome
 *
 * 2. Sign in with Google manually in that browser
 *
 * 3. Run: make e2e-capture
 *
 * This bypasses Google's "browser not secure" error because you're
 * using your real Chrome, not Playwright's automated Chromium.
 */
import { chromium } from '@playwright/test';
import type { CDPSession } from '@playwright/test';
import * as fs from 'fs';

const AUTH_DIR = 'playwright/.auth';
const AUTH_FILE = `${AUTH_DIR}/user.json`;
const FIREBASE_AUTH_FILE = `${AUTH_DIR}/firebase-auth.json`;
const CDP_URL = 'http://localhost:9222';

interface IndexedDBEntry {
  key: unknown;
  value: unknown;
}

/**
 * Read IndexedDB data using Chrome DevTools Protocol
 * This is more reliable than page.evaluate() for CDP connections
 */
async function readIndexedDBViaCDP(
  cdp: CDPSession,
  securityOrigin: string,
  databaseName: string,
  objectStoreName: string
): Promise<IndexedDBEntry[]> {
  try {
    // Enable IndexedDB domain
    await cdp.send('IndexedDB.enable');

    // Get database names
    const { databaseNames } = await cdp.send('IndexedDB.requestDatabaseNames', {
      securityOrigin,
    });

    if (!databaseNames.includes(databaseName)) {
      console.log(`   Database '${databaseName}' not found`);
      console.log(`   Available databases:`, databaseNames);
      return [];
    }

    // Request database structure
    const { databaseWithObjectStores } = await cdp.send(
      'IndexedDB.requestDatabase',
      {
        securityOrigin,
        databaseName,
      }
    );

    const store = databaseWithObjectStores.objectStores.find(
      (s: { name: string }) => s.name === objectStoreName
    );

    if (!store) {
      console.log(`   Object store '${objectStoreName}' not found`);
      return [];
    }

    // Read all data from the object store
    const { objectStoreDataEntries } = await cdp.send('IndexedDB.requestData', {
      securityOrigin,
      databaseName,
      objectStoreName,
      indexName: '',
      skipCount: 0,
      pageSize: 100,
    });

    // Parse the entries
    const entries: IndexedDBEntry[] = objectStoreDataEntries.map(
      (entry: { key: { value: string }; value: { value: string } }) => ({
        key: JSON.parse(entry.key.value) as unknown,
        value: JSON.parse(entry.value.value) as unknown,
      })
    );

    return entries;
  } catch (error) {
    console.error('   CDP IndexedDB error:', (error as Error).message);
    return [];
  }
}

/**
 * Read localStorage using CDP
 */
async function readLocalStorageViaCDP(
  cdp: CDPSession
): Promise<Record<string, string>> {
  try {
    const { entries } = await cdp.send('DOMStorage.getDOMStorageItems', {
      storageId: {
        securityOrigin: 'http://localhost:5173',
        isLocalStorage: true,
      },
    });

    const data: Record<string, string> = {};
    for (const [key, value] of entries) {
      data[key] = value;
    }
    return data;
  } catch (error) {
    console.error('   CDP localStorage error:', (error as Error).message);
    return {};
  }
}

async function captureAuthState() {
  console.log('\n');
  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║           CAPTURE AUTH STATE FROM REAL CHROME                ║'
  );
  console.log(
    '╠══════════════════════════════════════════════════════════════╣'
  );
  console.log('║  Connecting to Chrome at', CDP_URL.padEnd(29), '║');
  console.log(
    '╚══════════════════════════════════════════════════════════════╝'
  );
  console.log('\n');

  try {
    // Connect to existing Chrome via CDP
    const browser = await chromium.connectOverCDP(CDP_URL);
    console.log('✓ Connected to Chrome');

    // Get the default context
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new Error(
        'No browser contexts found. Make sure Chrome has at least one tab open.'
      );
    }

    const context = contexts[0];
    const pages = context.pages();
    console.log(`✓ Found ${String(pages.length)} page(s)`);

    // Find the localhost page
    const page =
      pages.find((p) => p.url().includes('localhost:5173')) ?? pages[0];
    const currentUrl = page.url();
    console.log(`✓ Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/dashboard')) {
      console.log(
        '\n⚠️  WARNING: Not on /dashboard - you may not be authenticated'
      );
      console.log(
        '   Make sure you have signed in with Google before running this script.\n'
      );
    }

    // Ensure auth directory exists
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Create CDP session for direct protocol access
    console.log('\n📦 Extracting Firebase auth via CDP...');
    const cdp = await context.newCDPSession(page);

    // Enable required domains
    await cdp.send('DOMStorage.enable');

    // Read IndexedDB (Firebase auth)
    console.log('   Reading IndexedDB...');
    const indexedDBEntries = await readIndexedDBViaCDP(
      cdp,
      'http://localhost:5173',
      'firebaseLocalStorageDb',
      'firebaseLocalStorage'
    );

    // Read localStorage
    console.log('   Reading localStorage...');
    const localStorageData = await readLocalStorageViaCDP(cdp);

    // Save Firebase auth data
    const authData = {
      indexedDB: {
        entries: indexedDBEntries.map((e) => ({
          key: e.key,
          value: e.value,
        })),
        error: null,
      },
      localStorage: localStorageData,
      capturedAt: new Date().toISOString(),
      capturedFrom: currentUrl,
    };

    fs.writeFileSync(FIREBASE_AUTH_FILE, JSON.stringify(authData, null, 2));
    console.log(`✓ Firebase auth data saved to: ${FIREBASE_AUTH_FILE}`);

    // Also save standard storage state (cookies)
    await context.storageState({ path: AUTH_FILE });
    console.log(`✓ Cookies saved to: ${AUTH_FILE}`);

    // Verify we got auth data
    if (indexedDBEntries.length === 0) {
      console.log('\n⚠️  WARNING: No Firebase auth entries found in IndexedDB');
      console.log('   This might mean:');
      console.log('   - You are not signed in');
      console.log('   - Firebase is using a different storage mechanism');
      console.log('   - Try refreshing the page in Chrome and re-running\n');
    } else {
      console.log(
        `✓ Found ${String(indexedDBEntries.length)} Firebase auth entries`
      );
    }

    console.log('\n✅ Auth capture complete!');
    console.log('\nYou can now run tests with: make e2e');
    console.log(
      '(Note: Keep Chrome open or close it - tests use the saved state)\n'
    );

    // Disconnect (doesn't close Chrome)
    await browser.close();
  } catch (error) {
    if ((error as Error).message.includes('ECONNREFUSED')) {
      console.error('\n❌ Could not connect to Chrome at', CDP_URL);
      console.error('\nMake sure Chrome is running with remote debugging:');
      console.error('\n  macOS:');
      console.error('  make e2e-chrome');
      console.error('\n  Or manually:');
      console.error(
        '  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\'
      );
      console.error('    --remote-debugging-port=9222 \\');
      console.error('    --user-data-dir=/tmp/playwright-chrome-profile \\');
      console.error('    http://localhost:5173\n');
    } else {
      console.error('\n❌ Error:', (error as Error).message, '\n');
    }
    process.exit(1);
  }
}

void captureAuthState();
