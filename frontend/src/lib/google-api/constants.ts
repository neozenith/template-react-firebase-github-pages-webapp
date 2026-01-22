/**
 * Google API Constants
 *
 * Rate limits, quotas, and endpoint configurations for each Google API.
 * These values are based on Google's published quotas and should be updated
 * if Google changes their limits.
 *
 * @see https://developers.google.com/drive/api/guides/limits
 * @see https://developers.google.com/sheets/api/limits
 * @see https://developers.google.com/calendar/api/guides/quota
 */

/**
 * API type identifiers
 */
export type ApiType = 'drive' | 'sheets' | 'calendar';

/**
 * Rate limit configuration for an API
 */
export interface RateLimitConfig {
  /** Requests allowed per minute (project-wide) */
  requestsPerMinute: number;
  /** Requests allowed per minute per user */
  requestsPerUserPerMinute: number;
  /** Maximum burst size for token bucket */
  burstSize: number;
  /** Time window in milliseconds for rate tracking */
  windowMs: number;
}

/**
 * Default rate limits per API type.
 *
 * These are conservative estimates based on Google's documentation.
 * The per-user limits are most relevant for client-side apps.
 */
export const API_RATE_LIMITS: Record<ApiType, RateLimitConfig> = {
  drive: {
    requestsPerMinute: 12000, // Project limit: 20,000 queries/100 seconds
    requestsPerUserPerMinute: 2400, // Per-user: ~40/second typical
    burstSize: 100,
    windowMs: 60_000,
  },
  sheets: {
    requestsPerMinute: 300, // Read limit: 300 per minute per project
    requestsPerUserPerMinute: 60, // Per-user: 60 per minute
    burstSize: 10,
    windowMs: 60_000,
  },
  calendar: {
    requestsPerMinute: 1800, // Varies by operation type
    requestsPerUserPerMinute: 600, // Per-user: ~10/second
    burstSize: 50,
    windowMs: 60_000,
  },
} as const;

/**
 * Base URLs for Google APIs
 */
export const API_ENDPOINTS: Record<ApiType, string> = {
  drive: 'https://www.googleapis.com/drive/v3',
  sheets: 'https://sheets.googleapis.com/v4',
  calendar: 'https://www.googleapis.com/calendar/v3',
} as const;

/**
 * HTTP status codes that trigger specific behaviors
 */
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Retry configuration for failed requests
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  maxRetries: 3,
  /** Initial backoff delay in milliseconds */
  initialBackoffMs: 1000,
  /** Maximum backoff delay in milliseconds */
  maxBackoffMs: 30_000,
  /** Backoff multiplier for exponential increase */
  backoffMultiplier: 2,
  /** Jitter factor (0-1) to add randomness to backoff */
  jitterFactor: 0.1,
} as const;

/**
 * MIME types for Google Workspace documents
 */
export const GOOGLE_MIME_TYPES = {
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  DOCUMENT: 'application/vnd.google-apps.document',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  FOLDER: 'application/vnd.google-apps.folder',
  FORM: 'application/vnd.google-apps.form',
  DRAWING: 'application/vnd.google-apps.drawing',
  SCRIPT: 'application/vnd.google-apps.script',
  SITE: 'application/vnd.google-apps.site',
  SHORTCUT: 'application/vnd.google-apps.shortcut',
} as const;
