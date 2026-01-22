import type { UserCredential } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';

/**
 * Google OAuth tokens extracted from Firebase auth result
 */
export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Parsed scope information from OAuth result
 */
export interface GrantedScopes {
  scopes: string[];
  hasSheets: boolean;
  hasCalendar: boolean;
  hasDrive: boolean;
}

/**
 * Google Drive file metadata (for Sheets)
 */
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

/**
 * Google Calendar metadata
 */
export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  accessRole: string;
}

/**
 * Google Drive API response type
 */
interface DriveFilesResponse {
  files?: GoogleDriveFile[];
}

/**
 * Google Calendar API response type
 */
interface CalendarListResponse {
  items?: GoogleCalendar[];
}

/**
 * Extract Google OAuth tokens from Firebase credential result
 * @param credential - The result from signInWithPopup
 * @returns GoogleTokens or null if extraction fails
 */
export function extractTokens(credential: UserCredential): GoogleTokens | null {
  const oauthCredential = GoogleAuthProvider.credentialFromResult(credential);
  if (!oauthCredential?.accessToken) return null;

  return {
    accessToken: oauthCredential.accessToken,
  };
}

/**
 * Parse granted scopes from credential
 * Note: This relies on the additional user info which may not always be available
 * @param credential - The result from signInWithPopup
 */
export function parseGrantedScopes(credential: UserCredential): GrantedScopes {
  // Extract granted_scopes from additionalUserInfo.profile if available
  // Google OAuth returns granted scopes as a space-separated string
  // We cast through unknown to satisfy strict ESLint rules with Firebase's error-typed additionalUserInfo
  const additionalUserInfo = credential.additionalUserInfo as unknown as {
    profile?: { granted_scopes?: string } | null;
  } | null;
  const scopeString = additionalUserInfo?.profile?.granted_scopes ?? '';
  const scopes = scopeString.split(' ').filter(Boolean);

  return {
    scopes,
    hasSheets: scopes.some((s) => s.includes('spreadsheets')),
    hasCalendar: scopes.some((s) => s.includes('calendar')),
    hasDrive: scopes.some((s) => s.includes('drive')),
  };
}

/**
 * Storage keys for token persistence
 */
export const TOKEN_STORAGE_KEY = 'google_access_token';

export function storeToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Base URL for Google APIs
 */
const GOOGLE_API_BASE = 'https://www.googleapis.com';

/**
 * Fetch Google Sheets from Drive API
 * Uses Drive API to list files with mimeType filter for spreadsheets
 * @param accessToken - OAuth access token with drive.readonly scope
 * @returns Array of Google Drive files (spreadsheets)
 */
export async function fetchGoogleSheets(
  accessToken: string
): Promise<GoogleDriveFile[]> {
  const url = new URL(`${GOOGLE_API_BASE}/drive/v3/files`);
  url.searchParams.set(
    'q',
    "mimeType='application/vnd.google-apps.spreadsheet'"
  );
  url.searchParams.set(
    'fields',
    'files(id,name,mimeType,modifiedTime,webViewLink,iconLink)'
  );
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('pageSize', '25');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch sheets: ${String(response.status)} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const data = (await response.json()) as DriveFilesResponse;
  return data.files ?? [];
}

/**
 * Fetch Google Calendars from Calendar API
 * @param accessToken - OAuth access token with calendar.readonly scope
 * @returns Array of Google Calendars
 */
export async function fetchGoogleCalendars(
  accessToken: string
): Promise<GoogleCalendar[]> {
  const url = new URL(`${GOOGLE_API_BASE}/calendar/v3/users/me/calendarList`);
  url.searchParams.set('maxResults', '25');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch calendars: ${String(response.status)} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const data = (await response.json()) as CalendarListResponse;
  return data.items ?? [];
}

/**
 * Fetch recent Google Drive files (excluding spreadsheets which have their own panel)
 * @param accessToken - OAuth access token with drive.readonly scope
 * @returns Array of Google Drive files
 */
export async function fetchGoogleDriveFiles(
  accessToken: string
): Promise<GoogleDriveFile[]> {
  const url = new URL(`${GOOGLE_API_BASE}/drive/v3/files`);
  // Exclude spreadsheets (they have their own panel) and trashed files
  url.searchParams.set(
    'q',
    "mimeType!='application/vnd.google-apps.spreadsheet' and trashed=false"
  );
  url.searchParams.set(
    'fields',
    'files(id,name,mimeType,modifiedTime,webViewLink,iconLink)'
  );
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('pageSize', '25');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch drive files: ${String(response.status)} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const data = (await response.json()) as DriveFilesResponse;
  return data.files ?? [];
}
