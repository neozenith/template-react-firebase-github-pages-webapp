/**
 * Factory Function Tests
 *
 * Tests for the main entry point and factory function.
 */

import { describe, it, expect } from 'vitest';
import {
  googleApiClient,
  createGoogleApiClients,
  GoogleDriveClient,
  GoogleSheetsClient,
  GoogleCalendarClient,
  GoogleApiError,
  TokenExpiredError,
  RateLimitError,
  API_RATE_LIMITS,
  API_ENDPOINTS,
} from './index';

describe('googleApiClient factory', () => {
  const config = { accessToken: 'test-token' };

  it('creates GoogleDriveClient for "drive"', () => {
    const client = googleApiClient('drive', config);
    expect(client).toBeInstanceOf(GoogleDriveClient);
  });

  it('creates GoogleSheetsClient for "sheets"', () => {
    const client = googleApiClient('sheets', config);
    expect(client).toBeInstanceOf(GoogleSheetsClient);
  });

  it('creates GoogleCalendarClient for "calendar"', () => {
    const client = googleApiClient('calendar', config);
    expect(client).toBeInstanceOf(GoogleCalendarClient);
  });

  it('throws for invalid API type', () => {
    expect(() => {
      // @ts-expect-error - Testing runtime error for invalid type
      googleApiClient('invalid', config);
    }).toThrow('Unknown API type');
  });

  it('passes config to client', () => {
    const client = googleApiClient('drive', config);
    // Client should have rate limiter stats available
    const stats = client.getRateLimiterStats();
    expect(stats).toBeDefined();
    expect(stats.tokens).toBe(API_RATE_LIMITS.drive.burstSize);
  });
});

describe('createGoogleApiClients', () => {
  const config = { accessToken: 'test-token' };

  it('creates all three clients', () => {
    const clients = createGoogleApiClients(config);
    expect(clients.drive).toBeInstanceOf(GoogleDriveClient);
    expect(clients.sheets).toBeInstanceOf(GoogleSheetsClient);
    expect(clients.calendar).toBeInstanceOf(GoogleCalendarClient);
  });

  it('each client has independent rate limiter', () => {
    const clients = createGoogleApiClients(config);

    // Each client has its own rate limiter with API-specific burst size
    expect(clients.drive.getRateLimiterStats().tokens).toBe(
      API_RATE_LIMITS.drive.burstSize
    );
    expect(clients.sheets.getRateLimiterStats().tokens).toBe(
      API_RATE_LIMITS.sheets.burstSize
    );
    expect(clients.calendar.getRateLimiterStats().tokens).toBe(
      API_RATE_LIMITS.calendar.burstSize
    );
  });
});

describe('exports', () => {
  it('exports error classes', () => {
    expect(GoogleApiError).toBeDefined();
    expect(TokenExpiredError).toBeDefined();
    expect(RateLimitError).toBeDefined();
  });

  it('exports constants', () => {
    expect(API_RATE_LIMITS).toBeDefined();
    expect(API_ENDPOINTS).toBeDefined();
  });

  it('exports client classes', () => {
    expect(GoogleDriveClient).toBeDefined();
    expect(GoogleSheetsClient).toBeDefined();
    expect(GoogleCalendarClient).toBeDefined();
  });
});

describe('TypeScript type safety', () => {
  const config = { accessToken: 'test-token' };

  it('drive client has drive-specific methods', () => {
    const client = googleApiClient('drive', config);
    // These should exist on DriveClient
    expect(typeof client.listFiles).toBe('function');
    expect(typeof client.getFile).toBe('function');
    expect(typeof client.downloadFile).toBe('function');
  });

  it('sheets client has sheets-specific methods', () => {
    const client = googleApiClient('sheets', config);
    // These should exist on SheetsClient
    expect(typeof client.listSpreadsheets).toBe('function');
    expect(typeof client.getValues).toBe('function');
    expect(typeof client.updateValues).toBe('function');
  });

  it('calendar client has calendar-specific methods', () => {
    const client = googleApiClient('calendar', config);
    // These should exist on CalendarClient
    expect(typeof client.listCalendars).toBe('function');
    expect(typeof client.listEvents).toBe('function');
    expect(typeof client.createEvent).toBe('function');
  });
});

describe('client configuration', () => {
  it('accepts onTokenExpired callback', () => {
    const refreshCallback = () => Promise.resolve('new-token');
    const client = googleApiClient('drive', {
      accessToken: 'test-token',
      onTokenExpired: refreshCallback,
    });
    expect(client).toBeInstanceOf(GoogleDriveClient);
  });

  it('accepts custom rate limits', () => {
    const client = googleApiClient('sheets', {
      accessToken: 'test-token',
      rateLimits: { burstSize: 2 },
    });
    // Custom burst size should be applied
    const stats = client.getRateLimiterStats();
    expect(stats.tokens).toBe(2);
  });

  it('setAccessToken updates token', () => {
    const client = googleApiClient('drive', { accessToken: 'old-token' });
    client.setAccessToken('new-token');
    // No error means success - we can't easily verify the private token
    expect(client).toBeInstanceOf(GoogleDriveClient);
  });
});
