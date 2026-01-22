/**
 * Google API Clients - Main Entry Point
 *
 * Factory function for creating typed Google API clients.
 * This is the main public API for the google-api module.
 *
 * @example
 * import { googleApiClient } from '@/lib/google-api';
 *
 * const sheets = googleApiClient('sheets', { accessToken: '...' });
 * const spreadsheets = await sheets.listSpreadsheets();
 *
 * const calendar = googleApiClient('calendar', { accessToken: '...' });
 * const events = await calendar.getUpcomingEvents();
 */

// Base types and utilities
export type { ApiType, RateLimitConfig } from './constants';
export { API_RATE_LIMITS, API_ENDPOINTS, GOOGLE_MIME_TYPES } from './constants';
export {
  GoogleApiError,
  TokenExpiredError,
  RateLimitError,
  PermissionDeniedError,
  NotFoundError,
  type ClientConfig,
} from './types';

// Client classes
export { GoogleApiClient } from './client';
export { RateLimiter } from './rate-limiter';

// API-specific clients and types
export { GoogleDriveClient } from './drive';
export type * from './drive/types';

export { GoogleSheetsClient } from './sheets';
export type * from './sheets/types';

export { GoogleCalendarClient } from './calendar';
export type * from './calendar/types';

// Import clients for factory
import { GoogleDriveClient } from './drive';
import { GoogleSheetsClient } from './sheets';
import { GoogleCalendarClient } from './calendar';
import type { ClientConfig } from './types';

/**
 * Factory function for creating typed Google API clients
 *
 * Returns a correctly-typed client based on the API type specified.
 * Each client includes self-throttling based on Google's rate limits.
 *
 * @param api - The API to create a client for
 * @param config - Client configuration including access token
 * @returns Typed API client
 *
 * @example
 * // Create a Sheets client
 * const sheets = googleApiClient('sheets', { accessToken: token });
 * const data = await sheets.getValues('spreadsheet-id', 'Sheet1!A1:B10');
 *
 * @example
 * // Create a Calendar client with token refresh
 * const calendar = googleApiClient('calendar', {
 *   accessToken: token,
 *   onTokenExpired: async () => {
 *     const newToken = await refreshToken();
 *     return newToken;
 *   },
 * });
 */
export function googleApiClient(
  api: 'drive',
  config: ClientConfig
): GoogleDriveClient;
export function googleApiClient(
  api: 'sheets',
  config: ClientConfig
): GoogleSheetsClient;
export function googleApiClient(
  api: 'calendar',
  config: ClientConfig
): GoogleCalendarClient;
export function googleApiClient(
  api: 'drive' | 'sheets' | 'calendar',
  config: ClientConfig
): GoogleDriveClient | GoogleSheetsClient | GoogleCalendarClient {
  switch (api) {
    case 'drive':
      return new GoogleDriveClient(config);
    case 'sheets':
      return new GoogleSheetsClient(config);
    case 'calendar':
      return new GoogleCalendarClient(config);
    default: {
      // Exhaustive check - this should never be reached
      const exhaustiveCheck: never = api;
      throw new Error(`Unknown API type: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * Create all three clients at once for convenience
 *
 * @param config - Client configuration
 * @returns Object with all three clients
 */
export function createGoogleApiClients(config: ClientConfig): {
  drive: GoogleDriveClient;
  sheets: GoogleSheetsClient;
  calendar: GoogleCalendarClient;
} {
  return {
    drive: googleApiClient('drive', config),
    sheets: googleApiClient('sheets', config),
    calendar: googleApiClient('calendar', config),
  };
}
