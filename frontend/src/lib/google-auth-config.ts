import { GoogleAuthProvider } from 'firebase/auth';

/**
 * OAuth scopes for G Suite API access
 * These scopes are requested during Google sign-in to grant access to user's Sheets and Calendar
 */
export const GOOGLE_SCOPES = {
  /** Read-only access to Google Sheets */
  SHEETS_READONLY: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  /** Read-only access to Google Calendar */
  CALENDAR_READONLY: 'https://www.googleapis.com/auth/calendar.readonly',
  /** Read access to Google Drive file metadata (needed to list files) */
  DRIVE_READONLY: 'https://www.googleapis.com/auth/drive.readonly',
} as const;

/**
 * Default scopes requested during authentication
 * Using readonly scopes for listing - safer for initial implementation
 */
export const DEFAULT_SCOPES = [
  GOOGLE_SCOPES.SHEETS_READONLY,
  GOOGLE_SCOPES.CALENDAR_READONLY,
  GOOGLE_SCOPES.DRIVE_READONLY,
];

/**
 * Create a GoogleAuthProvider with the specified OAuth scopes
 * @param scopes - Array of Google OAuth scope URIs
 * @returns Configured GoogleAuthProvider instance
 */
export function createGoogleProvider(
  scopes: string[] = DEFAULT_SCOPES
): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();

  // Add each scope to the provider
  scopes.forEach((scope) => provider.addScope(scope));

  // Force consent screen to ensure we get the access token
  // This is important for getting the OAuth token that includes our custom scopes
  provider.setCustomParameters({
    prompt: 'consent',
  });

  return provider;
}
