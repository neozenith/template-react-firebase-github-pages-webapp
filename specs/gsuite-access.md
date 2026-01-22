# G Suite API Access Specification

## Overview

Extend the existing Firebase Google SSO to request additional OAuth scopes for Google Sheets and Calendar APIs. This enables the app to read/write user's G Suite data after authentication.

## OAuth Scopes

### Required Scopes

| API | Scope URI | Access Level |
|-----|-----------|--------------|
| Google Sheets | `https://www.googleapis.com/auth/spreadsheets.readonly` | Read spreadsheets |
| Google Calendar | `https://www.googleapis.com/auth/calendar.readonly` | Read calendar access |
| Google Drive | `https://www.googleapis.com/auth/drive.readonly` | Read drive files |

### Full Access Scopes (Optional)

| API | Scope URI | Access Level |
|-----|-----------|--------------|
| Google Sheets | `https://www.googleapis.com/auth/spreadsheets` | Read/write spreadsheets |
| Google Calendar | `https://www.googleapis.com/auth/calendar` | Full calendar access |
| Google Drive | `https://www.googleapis.com/auth/drive` | Full drive access |

### Scope Selection Rationale

- **Readonly first**: Start with `.readonly` scopes for listing/viewing
- **Upgrade on demand**: Request full scopes only when write operations needed
- **Principle of least privilege**: Don't ask for permissions you don't use

### Google Cloud Console Setup Required

1. Enable APIs: Sheets API, Calendar API, Drive API
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

### Current (Phase 1-3)

```
frontend/src/lib/
├── firebase.ts              # Firebase init (modified)
├── google-auth-config.ts    # Scope constants, provider factory (NEW)
├── google-api.ts            # Token extraction/validation (NEW)
├── google-api.test.ts       # Unit tests (NEW)
└── utils.ts                 # Existing utilities
```

### Target Architecture (Phase 4+): ClientSideAPIClient

```
frontend/src/lib/google-api/
├── index.ts                 # Public exports, factory function
├── client.ts                # Base GoogleApiClient class
├── constants.ts             # Rate limits, quotas, endpoints
├── types.ts                 # Shared types
├── calendar/
│   ├── index.ts             # GoogleCalendarClient
│   ├── types.ts             # Calendar types (GoogleCalendar, CalendarEvent, etc.)
│   └── calendar.test.ts     # Tests (no mocks, >80% coverage)
├── sheets/
│   ├── index.ts             # GoogleSheetsClient
│   ├── types.ts             # Sheets types (Spreadsheet, Sheet, Cell, etc.)
│   └── sheets.test.ts       # Tests (no mocks, >80% coverage)
└── drive/
    ├── index.ts             # GoogleDriveClient
    ├── types.ts             # Drive types (DriveFile, Permission, etc.)
    └── drive.test.ts        # Tests (no mocks, >80% coverage)
```

---

## Phase 4: ClientSideAPIClient Refactor

### Overview

Refactor `google-api.ts` into a modular, self-throttling client architecture that:
- Is **pure TypeScript** (no React dependencies)
- Can be wrapped in a **CLI interface**
- Has **comprehensive testing** (no mocks, >80% coverage)
- Provides **typed factory pattern** for each API

### Design Goals

1. **Framework Agnostic**: The client layer contains zero React code
2. **Self-Throttling**: Clients enforce their own rate limits
3. **Type-Safe**: Factory returns correctly-typed client per API
4. **Testable**: All logic testable without browser/DOM
5. **CLI-Ready**: Same code can power CLI tools

### Factory Pattern

```typescript
// Factory function with discriminated union return type
function googleApiClient(api: 'sheets', config: ClientConfig): GoogleSheetsClient;
function googleApiClient(api: 'calendar', config: ClientConfig): GoogleCalendarClient;
function googleApiClient(api: 'drive', config: ClientConfig): GoogleDriveClient;

// Usage
const sheetsClient = googleApiClient('sheets', { accessToken });
const spreadsheets = await sheetsClient.listSpreadsheets();
```

### Base Client (`client.ts`)

```typescript
interface ClientConfig {
  accessToken: string;
  onTokenExpired?: () => Promise<string>;  // Refresh callback
  rateLimits?: RateLimitConfig;            // Override defaults
}

abstract class GoogleApiClient {
  protected accessToken: string;
  protected rateLimiter: RateLimiter;

  constructor(config: ClientConfig, apiType: ApiType) {
    this.accessToken = config.accessToken;
    this.rateLimiter = new RateLimiter(
      config.rateLimits ?? DEFAULT_LIMITS[apiType]
    );
  }

  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    await this.rateLimiter.acquire();  // Self-throttle

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      // Token expired - attempt refresh
      if (this.config.onTokenExpired) {
        this.accessToken = await this.config.onTokenExpired();
        return this.request(endpoint, options);  // Retry
      }
      throw new TokenExpiredError();
    }

    if (response.status === 429) {
      // Rate limited - exponential backoff
      await this.rateLimiter.backoff();
      return this.request(endpoint, options);  // Retry
    }

    if (!response.ok) {
      throw new GoogleApiError(response.status, await response.text());
    }

    return response.json() as T;
  }
}
```

### Rate Limiting Constants (`constants.ts`)

```typescript
export const API_RATE_LIMITS = {
  drive: {
    requestsPerMinute: 12000,      // Project limit
    requestsPerUserPerMinute: 2400, // Per-user limit
    burstSize: 100,
  },
  sheets: {
    requestsPerMinute: 300,        // Read limit
    requestsPerUserPerMinute: 60,  // Per-user limit
    burstSize: 10,
  },
  calendar: {
    requestsPerMinute: 1800,       // Varies by operation
    requestsPerUserPerMinute: 600,
    burstSize: 50,
  },
} as const;

export const API_ENDPOINTS = {
  drive: 'https://www.googleapis.com/drive/v3',
  sheets: 'https://sheets.googleapis.com/v4',
  calendar: 'https://www.googleapis.com/calendar/v3',
} as const;
```

### API-Specific Clients

**GoogleSheetsClient (`sheets/index.ts`)**:
```typescript
class GoogleSheetsClient extends GoogleApiClient {
  listSpreadsheets(): Promise<Spreadsheet[]>;
  getSpreadsheet(id: string): Promise<Spreadsheet>;
  getValues(spreadsheetId: string, range: string): Promise<CellValue[][]>;
  updateValues(spreadsheetId: string, range: string, values: CellValue[][]): Promise<void>;
  appendRow(spreadsheetId: string, sheetName: string, values: CellValue[]): Promise<void>;
}
```

**GoogleCalendarClient (`calendar/index.ts`)**:
```typescript
class GoogleCalendarClient extends GoogleApiClient {
  listCalendars(): Promise<Calendar[]>;
  listEvents(calendarId: string, options?: EventListOptions): Promise<CalendarEvent[]>;
  createEvent(calendarId: string, event: NewEvent): Promise<CalendarEvent>;
  updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
}
```

**GoogleDriveClient (`drive/index.ts`)**:
```typescript
class GoogleDriveClient extends GoogleApiClient {
  listFiles(options?: FileListOptions): Promise<DriveFile[]>;
  getFile(fileId: string): Promise<DriveFile>;
  downloadFile(fileId: string): Promise<Blob>;
  uploadFile(file: File, metadata?: FileMetadata): Promise<DriveFile>;
  deleteFile(fileId: string): Promise<void>;
  shareFile(fileId: string, permission: Permission): Promise<void>;
}
```

### Testing Requirements

**Rules:**
1. **No mocks ever** - test real implementations with fixtures
2. **>80% coverage** - enforced in CI
3. **Isolated tests** - each client module independently testable
4. **No DOM/browser** - tests run in Node.js

**Test Fixtures:**
```typescript
// fixtures/sheets.ts
export const MOCK_SPREADSHEETS: Spreadsheet[] = [
  { id: '1', name: 'Test Sheet', modifiedTime: '2026-01-01T00:00:00Z' },
];

// sheets/sheets.test.ts
import { GoogleSheetsClient } from './index';
import { MOCK_SPREADSHEETS } from '../fixtures/sheets';

describe('GoogleSheetsClient', () => {
  it('parses spreadsheet list response', () => {
    const client = new GoogleSheetsClient({ accessToken: 'test' });
    // Test actual parsing logic, not HTTP calls
  });
});
```

### React Hook Integration

React hooks become thin wrappers:

```typescript
// hooks/useGoogleSheets.ts
export function useGoogleSheets() {
  const { accessToken } = useAuth();
  const [state, setState] = useState<...>();

  useEffect(() => {
    if (!accessToken) return;

    const client = googleApiClient('sheets', { accessToken });
    client.listSpreadsheets()
      .then(sheets => setState({ sheets, loading: false }))
      .catch(error => setState({ error, loading: false }));
  }, [accessToken]);

  return state;
}
```

### Implementation Checklist (Phase 4)

- [ ] Create `frontend/src/lib/google-api/` directory structure
- [ ] Implement `constants.ts` with rate limits and endpoints
- [ ] Implement `types.ts` with shared error types
- [ ] Implement `client.ts` base class with throttling
- [ ] Implement `RateLimiter` class (token bucket algorithm)
- [ ] Implement `drive/index.ts` - GoogleDriveClient
- [ ] Implement `sheets/index.ts` - GoogleSheetsClient
- [ ] Implement `calendar/index.ts` - GoogleCalendarClient
- [ ] Implement factory function in `index.ts`
- [ ] Write tests for each client (>80% coverage)
- [ ] Migrate existing hooks to use new clients
- [ ] Remove old `google-api.ts` file
- [ ] Add coverage enforcement to CI

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
- [x] Enable Sheets API and Calendar API in Google Cloud Console
- [x] Enable Drive API in Google Cloud Console
- [ ] Add scopes to OAuth consent screen
- [x] Complete [Playwright SSO Testing](./playwright-sso-testing.md) (v0.3.0)

### Phase 1-3: Basic Integration (COMPLETE)
1. [x] Create `google-auth-config.ts` with scope constants
2. [x] Create `google-api.ts` with token utilities
3. [ ] Write unit tests for `google-api.ts` (TDD)
4. [x] Update `firebase.ts` to use new provider
5. [x] Update `AuthContext.tsx` with token state
6. [ ] Write E2E tests for scope consent flow
7. [x] Update dashboard with three-panel layout (Sheets, Calendar, Drive)

### Phase 4: ClientSideAPIClient Refactor
1. [ ] Create `frontend/src/lib/google-api/` directory structure
2. [ ] Implement `constants.ts` with rate limits and endpoints
3. [ ] Implement `types.ts` with shared error types
4. [ ] Implement `client.ts` base class with throttling
5. [ ] Implement `RateLimiter` class (token bucket algorithm)
6. [ ] Implement `drive/index.ts` - GoogleDriveClient
7. [ ] Implement `sheets/index.ts` - GoogleSheetsClient
8. [ ] Implement `calendar/index.ts` - GoogleCalendarClient
9. [ ] Implement factory function in `index.ts`
10. [ ] Write comprehensive tests (>80% coverage, no mocks)
11. [ ] Migrate existing hooks to use new clients
12. [ ] Remove old `google-api.ts` file
13. [ ] Add coverage enforcement to CI

### Verification
- [ ] `make test` passes (unit tests, >80% coverage)
- [ ] `make check` passes (lint/types)
- [ ] `make e2e` passes (E2E tests)
- [ ] Manual test: login shows Sheets/Calendar/Drive consent
- [ ] Manual test: dashboard shows all three panels with data
- [ ] Rate limiting works under load (manual test)

---

## References

- [Firebase Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [GoogleAuthProvider.addScope](https://firebase.google.com/docs/reference/js/v8/firebase.auth.GoogleAuthProvider)
- [Google OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Google Sheets API Scopes](https://developers.google.com/workspace/sheets/api/scopes)
- [Google Calendar API Scopes](https://developers.google.com/workspace/calendar/api/auth)
