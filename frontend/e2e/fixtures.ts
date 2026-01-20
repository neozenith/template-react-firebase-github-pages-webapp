/**
 * Playwright test fixtures with Firebase auth injection.
 *
 * These fixtures handle injecting Firebase auth data from IndexedDB
 * captures into the test browser before each test runs.
 */
import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR = 'playwright/.auth';
const FIREBASE_AUTH_FILE = path.join(AUTH_DIR, 'firebase-auth.json');

interface FirebaseAuthData {
  indexedDB: {
    entries: { key: string; value: unknown }[];
    error: string | null;
  };
  localStorage: Record<string, string>;
  capturedAt: string;
  capturedFrom: string;
}

/**
 * Load Firebase auth data from the captured file
 */
function loadFirebaseAuth(): FirebaseAuthData | null {
  if (!fs.existsSync(FIREBASE_AUTH_FILE)) {
    return null;
  }

  try {
    const content = fs.readFileSync(FIREBASE_AUTH_FILE, 'utf-8');
    return JSON.parse(content) as FirebaseAuthData;
  } catch {
    console.error('Failed to parse Firebase auth file');
    return null;
  }
}

/**
 * Generate the injection script that will restore Firebase auth in IndexedDB
 */
function generateAuthInjectionScript(authData: FirebaseAuthData): string {
  const entries = authData.indexedDB.entries;
  const localStorageData = authData.localStorage;

  return `
    (async () => {
      // Restore localStorage
      const localStorageData = ${JSON.stringify(localStorageData)};
      for (const [key, value] of Object.entries(localStorageData)) {
        localStorage.setItem(key, value);
      }

      // Restore IndexedDB (Firebase auth)
      const entries = ${JSON.stringify(entries)};

      if (entries.length === 0) {
        console.log('[E2E] No Firebase auth entries to restore');
        return;
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.open('firebaseLocalStorageDb', 1);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
            db.createObjectStore('firebaseLocalStorage');
          }
        };

        request.onsuccess = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
            console.log('[E2E] No firebaseLocalStorage store found, creating...');
            resolve();
            return;
          }

          const transaction = db.transaction(['firebaseLocalStorage'], 'readwrite');
          const store = transaction.objectStore('firebaseLocalStorage');

          // Clear existing data first
          store.clear();

          // Add captured entries
          for (const entry of entries) {
            store.put(entry.value, entry.key);
          }

          transaction.oncomplete = () => {
            console.log('[E2E] Firebase auth restored:', entries.length, 'entries');
            resolve();
          };

          transaction.onerror = () => {
            console.error('[E2E] Failed to restore Firebase auth');
            reject(transaction.error);
          };
        };

        request.onerror = () => {
          console.error('[E2E] Failed to open IndexedDB');
          reject(request.error);
        };
      });
    })();
  `;
}

/**
 * Extended test fixture that injects Firebase auth before each test
 */
export const test = base.extend<{
  firebaseAuth: undefined;
}>({
  // Auto-fixture that injects Firebase auth before page navigation
  firebaseAuth: [
    async ({ page }, use) => {
      const authData = loadFirebaseAuth();

      if (!authData) {
        console.error('\n❌ Firebase auth file not found!');
        console.error(`   Expected: ${FIREBASE_AUTH_FILE}`);
        console.error('\nTo capture auth state:');
        console.error('  1. make dev         (start dev server)');
        console.error('  2. make e2e-chrome  (open Chrome)');
        console.error('  3. Sign in with Google');
        console.error('  4. make e2e-capture (save auth state)\n');
        throw new Error(
          'Firebase auth not found. Run "make e2e-chrome" then "make e2e-capture" first.'
        );
      }

      // Check if we have auth data (localStorage is where Firebase stores it with browserLocalPersistence)
      const hasLocalStorageAuth = Object.keys(authData.localStorage).some(
        (key) => key.startsWith('firebase:authUser:')
      );

      if (!hasLocalStorageAuth) {
        console.warn('\n⚠️  Warning: No Firebase auth found in captured data');
        console.warn('   Re-capture: make e2e-chrome && make e2e-capture\n');
      }

      // Inject the auth restoration script before any page loads
      await page.addInitScript(generateAuthInjectionScript(authData));

      await use();
    },
    { auto: true },
  ],
});

export { expect };
