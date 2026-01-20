# G Suite API Access Specification

## Overview

Extend the existing Firebase Google SSO to request additional OAuth scopes for Google Sheets and Calendar APIs. This enables the app to read/write user's G Suite data after authentication.

## OAuth Scopes

### Required Scopes

| API | Scope URI | Access Level |
|-----|-----------|--------------|
| Google Sheets | `https://www.googleapis.com/auth/spreadsheets` | Read/write spreadsheets |
| Google Calendar | `https://www.googleapis.com/auth/calendar` | Full calendar access |

### Scope Selection Rationale

- **Sheets**: Full `spreadsheets` scope (not `.readonly`) for data entry use cases
- **Calendar**: Full `calendar` scope for event creation/modification

### Google Cloud Console Setup Required

1. Enable APIs: Sheets API, Calendar API
2. Configure OAuth consent screen with these scopes
3. Add authorized domains for GitHub Pages

---

## Implementation Plan

### Phase 1: Extend Auth Provider

**File:** `frontend/src/lib/google-auth-config.ts` (NEW)

```typescript
// OAuth scopes configuration
export const GOOGLE_SCOPES = {
  SHEETS: 'https://www.googleapis.com/auth/spreadsheets',
  CALENDAR: 'https://www.googleapis.com/auth/calendar',
} as const;

export const DEFAULT_SCOPES = [
  GOOGLE_SCOPES.SHEETS,
  GOOGLE_SCOPES.CALENDAR,
];

export function createGoogleProvider(scopes: string[] = DEFAULT_SCOPES) {
  const provider = new GoogleAuthProvider();
  scopes.forEach(scope => provider.addScope(scope));

  // Request offline access for refresh tokens
  provider.setCustomParameters({
    access_type: 'offline',
    prompt: 'consent',  // Force consent to get refresh token
  });

  return provider;
}
```

**Modify:** `frontend/src/lib/firebase.ts`

```typescript
// Replace static googleProvider with factory
import { createGoogleProvider } from './google-auth-config';

export const googleProvider = createGoogleProvider();
```

### Phase 2: Token Management

**File:** `frontend/src/lib/google-api.ts` (NEW)

Core logic for token extraction and validation (non-UI, fully testable):

```typescript
import type { UserCredential } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface GrantedScopes {
  scopes: string[];
  hasSheets: boolean;
  hasCalendar: boolean;
}

/**
 * Extract Google OAuth tokens from Firebase credential result
 */
export function extractTokens(credential: UserCredential): GoogleTokens | null {
  const oauthCredential = GoogleAuthProvider.credentialFromResult(credential);
  if (!oauthCredential?.accessToken) return null;

  return {
    accessToken: oauthCredential.accessToken,
    // Note: refreshToken only available with offline access + consent prompt
  };
}

/**
 * Parse granted scopes from credential
 * Google returns space-separated scope string in additionalUserInfo
 */
export function parseGrantedScopes(credential: UserCredential): GrantedScopes {
  const profile = credential.additionalUserInfo?.profile as Record<string, unknown> | undefined;
  const scopeString = (profile?.granted_scopes as string) ?? '';
  const scopes = scopeString.split(' ').filter(Boolean);

  return {
    scopes,
    hasSheets: scopes.some(s => s.includes('spreadsheets')),
    hasCalendar: scopes.some(s => s.includes('calendar')),
  };
}

/**
 * Check if all required scopes were granted
 */
export function validateScopes(
  granted: GrantedScopes,
  required: string[]
): { valid: boolean; missing: string[] } {
  const missing = required.filter(req =>
    !granted.scopes.some(g => g.includes(req) || req.includes(g))
  );
  return { valid: missing.length === 0, missing };
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
```

### Phase 3: Update AuthContext

**Modify:** `frontend/src/contexts/AuthContext.tsx`

```typescript
// Add to context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;      // NEW
  grantedScopes: GrantedScopes;    // NEW
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// In signInWithGoogle handler:
const result = await signInWithPopup(auth, googleProvider);
const tokens = extractTokens(result);
const scopes = parseGrantedScopes(result);

if (tokens?.accessToken) {
  storeToken(tokens.accessToken);
  setAccessToken(tokens.accessToken);
}
setGrantedScopes(scopes);
```

---

## File Structure

```
frontend/src/lib/
├── firebase.ts              # Firebase init (modified)
├── google-auth-config.ts    # Scope constants, provider factory (NEW)
├── google-api.ts            # Token extraction/validation (NEW)
├── google-api.test.ts       # Unit tests (NEW)
└── utils.ts                 # Existing utilities
```

---

## Testing Plan

### Unit Tests (`frontend/src/lib/google-api.test.ts`)

| Test | Description |
|------|-------------|
| `extractTokens` returns null for missing credential | Handle edge case |
| `extractTokens` extracts accessToken from valid credential | Happy path |
| `parseGrantedScopes` parses space-separated scope string | Core parsing |
| `parseGrantedScopes` handles empty/missing scopes | Edge case |
| `parseGrantedScopes` sets boolean flags correctly | Sheets/Calendar detection |
| `validateScopes` returns valid:true when all scopes granted | Happy path |
| `validateScopes` returns missing scopes array | Partial grant |
| `storeToken/getStoredToken/clearStoredToken` roundtrip | Storage CRUD |

**Mock Strategy:**
- Mock `GoogleAuthProvider.credentialFromResult` return value
- Mock `sessionStorage` for token storage tests
- No Firebase network calls needed

### E2E Tests

**Prerequisite:** Complete [Playwright SSO Testing](./playwright-sso-testing.md) setup first (v0.3.0).

Additional E2E tests specific to G Suite scopes:

| Test | Description |
|------|-------------|
| Login consent shows Sheets/Calendar scopes | Verify scope request UI |
| `accessToken` stored after login | Token available in sessionStorage |
| `grantedScopes` includes Sheets | Scope parsing detects spreadsheets |
| `grantedScopes` includes Calendar | Scope parsing detects calendar |
| Partial scope grant handled | User denies some scopes gracefully |

---

## Implementation Checklist

### Pre-Implementation
- [ ] Enable Sheets API and Calendar API in Google Cloud Console
- [ ] Add scopes to OAuth consent screen
- [ ] Complete [Playwright SSO Testing](./playwright-sso-testing.md) (v0.3.0)

### Implementation Order
1. [ ] Create `google-auth-config.ts` with scope constants
2. [ ] Create `google-api.ts` with token utilities
3. [ ] Write unit tests for `google-api.ts` (TDD)
4. [ ] Update `firebase.ts` to use new provider
5. [ ] Update `AuthContext.tsx` with token state
6. [ ] Write E2E tests for scope consent flow
7. [ ] Update dashboard to show granted scopes (optional)

### Verification
- [ ] `make test` passes (unit tests)
- [ ] `make check` passes (lint/types)
- [ ] `make e2e` passes (E2E tests)
- [ ] Manual test: login shows Sheets/Calendar consent
- [ ] Manual test: dashboard shows access token exists

---

## References

- [Firebase Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [GoogleAuthProvider.addScope](https://firebase.google.com/docs/reference/js/v8/firebase.auth.GoogleAuthProvider)
- [Google OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Google Sheets API Scopes](https://developers.google.com/workspace/sheets/api/scopes)
- [Google Calendar API Scopes](https://developers.google.com/workspace/calendar/api/auth)
