/**
 * Shared types for Google API clients
 *
 * These types define the common interfaces used across all API clients,
 * including error types, configuration, and shared response structures.
 */

import type { ApiType, RateLimitConfig } from './constants';

/**
 * Configuration for creating an API client
 */
export interface ClientConfig {
  /** OAuth access token for API authentication */
  accessToken: string;
  /** Optional callback when token expires (for refresh) */
  onTokenExpired?: () => Promise<string>;
  /** Optional custom rate limit configuration */
  rateLimits?: Partial<RateLimitConfig>;
}

/**
 * Base error class for Google API errors
 */
export class GoogleApiError extends Error {
  /** HTTP status code */
  readonly status: number;
  /** API type that threw the error */
  readonly apiType?: ApiType;
  /** Original response body for debugging */
  readonly responseBody?: string;

  constructor(
    status: number,
    message: string,
    apiType?: ApiType,
    responseBody?: string
  ) {
    super(message);
    this.name = 'GoogleApiError';
    this.status = status;
    this.apiType = apiType;
    this.responseBody = responseBody;
    // Maintains proper stack trace for where error was thrown (V8 engines)
    if ('captureStackTrace' in Error) {
      (
        Error.captureStackTrace as (
          target: object,
          constructor?: NewableFunction
        ) => void
      )(this, GoogleApiError);
    }
  }
}

/**
 * Error thrown when OAuth token has expired
 */
export class TokenExpiredError extends GoogleApiError {
  constructor(message = 'Access token has expired') {
    super(401, message);
    this.name = 'TokenExpiredError';
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends GoogleApiError {
  /** Suggested retry delay in milliseconds */
  readonly retryAfterMs?: number;

  constructor(retryAfterMs?: number, message = 'Rate limit exceeded') {
    super(429, message);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Error thrown when user lacks permission
 */
export class PermissionDeniedError extends GoogleApiError {
  constructor(message = 'Permission denied') {
    super(403, message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Error thrown when resource is not found
 */
export class NotFoundError extends GoogleApiError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} not found: ${id}`
      : `${resource} not found`;
    super(404, message);
    this.name = 'NotFoundError';
  }
}

/**
 * Google API error response structure
 */
export interface GoogleApiErrorResponse {
  error: {
    code: number;
    message: string;
    status?: string;
    errors?: {
      domain: string;
      reason: string;
      message: string;
    }[];
  };
}

/**
 * Pagination parameters for list operations
 */
export interface PaginationParams {
  /** Maximum number of items to return */
  pageSize?: number;
  /** Token for fetching the next page */
  pageToken?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextPageToken?: string;
}

/**
 * Common file fields returned by Drive API
 */
export interface DriveFileBase {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

/**
 * Parse Google API error response
 */
export function parseErrorResponse(
  body: string
): GoogleApiErrorResponse | null {
  try {
    return JSON.parse(body) as GoogleApiErrorResponse;
  } catch {
    return null;
  }
}

/**
 * Create appropriate error based on status code
 */
export function createApiError(
  status: number,
  body: string,
  apiType?: ApiType
): GoogleApiError {
  const parsed = parseErrorResponse(body);
  const message = parsed?.error.message ?? `API error: ${String(status)}`;

  switch (status) {
    case 401:
      return new TokenExpiredError(message);
    case 403:
      return new PermissionDeniedError(message);
    case 404:
      return new NotFoundError('Resource', undefined);
    case 429: {
      // Try to parse retry-after from response
      const errorMessage = parsed?.error.errors?.[0]?.message;
      const retryMatch = errorMessage?.match(/(\d+)/);
      const retryMs = retryMatch?.[1];
      return new RateLimitError(
        retryMs ? parseInt(retryMs, 10) * 1000 : undefined,
        message
      );
    }
    default:
      return new GoogleApiError(status, message, apiType, body);
  }
}
