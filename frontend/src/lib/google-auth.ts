/**
 * Google OAuth Authentication Utilities
 *
 * Handles token extraction from Firebase auth and session storage.
 * This module is separate from the API clients and focuses on authentication.
 */

import type { UserCredential } from 'firebase/auth';
import { getAdditionalUserInfo, GoogleAuthProvider } from 'firebase/auth';

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
  const additionalUserInfo = getAdditionalUserInfo(credential);
  const profile = additionalUserInfo?.profile as
    | { granted_scopes?: string }
    | null
    | undefined;
  const scopeString = profile?.granted_scopes ?? '';
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
