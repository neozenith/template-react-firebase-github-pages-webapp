/**
 * Constants Tests
 *
 * Tests for API configuration constants.
 */

import { describe, it, expect } from 'vitest';
import {
  API_RATE_LIMITS,
  API_ENDPOINTS,
  HTTP_STATUS,
  RETRY_CONFIG,
  GOOGLE_MIME_TYPES,
} from './constants';
import type { ApiType } from './constants';

describe('API_RATE_LIMITS', () => {
  const apiTypes: ApiType[] = ['drive', 'sheets', 'calendar'];

  it.each(apiTypes)('has rate limits for %s', (api) => {
    const limits = API_RATE_LIMITS[api];
    expect(limits).toBeDefined();
    expect(limits.requestsPerMinute).toBeGreaterThan(0);
    expect(limits.requestsPerUserPerMinute).toBeGreaterThan(0);
    expect(limits.burstSize).toBeGreaterThan(0);
    expect(limits.windowMs).toBeGreaterThan(0);
  });

  it('sheets has stricter limits than drive', () => {
    expect(API_RATE_LIMITS.sheets.requestsPerUserPerMinute).toBeLessThan(
      API_RATE_LIMITS.drive.requestsPerUserPerMinute
    );
  });

  it('all APIs have 60 second window', () => {
    expect(API_RATE_LIMITS.drive.windowMs).toBe(60_000);
    expect(API_RATE_LIMITS.sheets.windowMs).toBe(60_000);
    expect(API_RATE_LIMITS.calendar.windowMs).toBe(60_000);
  });
});

describe('API_ENDPOINTS', () => {
  it('has endpoint for drive', () => {
    expect(API_ENDPOINTS.drive).toBe('https://www.googleapis.com/drive/v3');
  });

  it('has endpoint for sheets', () => {
    expect(API_ENDPOINTS.sheets).toBe('https://sheets.googleapis.com/v4');
  });

  it('has endpoint for calendar', () => {
    expect(API_ENDPOINTS.calendar).toBe(
      'https://www.googleapis.com/calendar/v3'
    );
  });

  it('all endpoints use HTTPS', () => {
    for (const endpoint of Object.values(API_ENDPOINTS)) {
      expect(endpoint.startsWith('https://')).toBe(true);
    }
  });
});

describe('HTTP_STATUS', () => {
  it('has standard HTTP status codes', () => {
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.RATE_LIMITED).toBe(429);
    expect(HTTP_STATUS.SERVER_ERROR).toBe(500);
    expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
  });
});

describe('RETRY_CONFIG', () => {
  it('has reasonable retry settings', () => {
    expect(RETRY_CONFIG.maxRetries).toBeGreaterThanOrEqual(1);
    expect(RETRY_CONFIG.maxRetries).toBeLessThanOrEqual(10);
  });

  it('has exponential backoff settings', () => {
    expect(RETRY_CONFIG.initialBackoffMs).toBeGreaterThan(0);
    expect(RETRY_CONFIG.maxBackoffMs).toBeGreaterThan(
      RETRY_CONFIG.initialBackoffMs
    );
    expect(RETRY_CONFIG.backoffMultiplier).toBeGreaterThan(1);
  });

  it('has jitter factor between 0 and 1', () => {
    expect(RETRY_CONFIG.jitterFactor).toBeGreaterThanOrEqual(0);
    expect(RETRY_CONFIG.jitterFactor).toBeLessThanOrEqual(1);
  });

  it('max backoff is reasonable for user experience', () => {
    // Max backoff should not exceed 1 minute for good UX
    expect(RETRY_CONFIG.maxBackoffMs).toBeLessThanOrEqual(60_000);
  });
});

describe('GOOGLE_MIME_TYPES', () => {
  it('has spreadsheet MIME type', () => {
    expect(GOOGLE_MIME_TYPES.SPREADSHEET).toBe(
      'application/vnd.google-apps.spreadsheet'
    );
  });

  it('has document MIME type', () => {
    expect(GOOGLE_MIME_TYPES.DOCUMENT).toBe(
      'application/vnd.google-apps.document'
    );
  });

  it('has folder MIME type', () => {
    expect(GOOGLE_MIME_TYPES.FOLDER).toBe('application/vnd.google-apps.folder');
  });

  it('all MIME types follow google-apps pattern', () => {
    for (const mimeType of Object.values(GOOGLE_MIME_TYPES)) {
      expect(mimeType).toContain('vnd.google-apps');
    }
  });
});
