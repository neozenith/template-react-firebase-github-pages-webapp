/**
 * Base Google API Client
 *
 * Abstract base class for all Google API clients. Provides:
 * - Rate limiting with token bucket algorithm
 * - Automatic token refresh on 401
 * - Retry with exponential backoff on 429
 * - Typed error handling
 *
 * This class is framework-agnostic and can be used in React, Node.js, or CLI.
 */

import {
  API_ENDPOINTS,
  API_RATE_LIMITS,
  HTTP_STATUS,
  RETRY_CONFIG,
  type ApiType,
  type RateLimitConfig,
} from './constants';
import { RateLimiter } from './rate-limiter';
import {
  createApiError,
  RateLimitError,
  TokenExpiredError,
  type ClientConfig,
} from './types';

/**
 * Abstract base class for Google API clients
 */
export abstract class GoogleApiClient {
  protected accessToken: string;
  protected readonly rateLimiter: RateLimiter;
  protected readonly apiType: ApiType;
  protected readonly baseUrl: string;
  private readonly onTokenExpired?: () => Promise<string>;
  private retryCount = 0;

  constructor(config: ClientConfig, apiType: ApiType) {
    this.accessToken = config.accessToken;
    this.apiType = apiType;
    this.baseUrl = API_ENDPOINTS[apiType];
    this.onTokenExpired = config.onTokenExpired;

    // Create rate limiter with merged config
    const rateLimitConfig: RateLimitConfig = {
      ...API_RATE_LIMITS[apiType],
      ...config.rateLimits,
    };
    this.rateLimiter = new RateLimiter(rateLimitConfig);
  }

  /**
   * Make an authenticated API request
   *
   * @param path - API path (relative to base URL)
   * @param options - Fetch options
   * @returns Parsed JSON response
   */
  protected async request<T>(path: string, options?: RequestInit): Promise<T> {
    // Acquire rate limit token
    await this.rateLimiter.acquire();

    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    // Merge additional headers if provided
    if (options?.headers) {
      const additionalHeaders = options.headers as Record<string, string>;
      Object.assign(headers, additionalHeaders);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle success
    if (response.ok) {
      this.rateLimiter.resetBackoff();
      this.retryCount = 0;
      return response.json() as Promise<T>;
    }

    // Handle errors
    const body = await response.text();
    return this.handleError(response.status, body, path, options);
  }

  /**
   * Handle error responses with retry logic
   */
  private async handleError<T>(
    status: number,
    body: string,
    path: string,
    options?: RequestInit
  ): Promise<T> {
    // Token expired - try to refresh
    if (status === HTTP_STATUS.UNAUTHORIZED) {
      if (this.onTokenExpired) {
        this.accessToken = await this.onTokenExpired();
        return this.request<T>(path, options);
      }
      throw new TokenExpiredError();
    }

    // Rate limited - backoff and retry
    if (status === HTTP_STATUS.RATE_LIMITED) {
      if (this.retryCount >= RETRY_CONFIG.maxRetries) {
        this.retryCount = 0;
        throw new RateLimitError(
          undefined,
          'Max retries exceeded for rate limit'
        );
      }

      this.retryCount += 1;
      await this.rateLimiter.backoff();
      return this.request<T>(path, options);
    }

    // Server errors - retry with backoff
    if (
      status === HTTP_STATUS.SERVER_ERROR ||
      status === HTTP_STATUS.SERVICE_UNAVAILABLE
    ) {
      if (this.retryCount >= RETRY_CONFIG.maxRetries) {
        this.retryCount = 0;
        throw createApiError(status, body, this.apiType);
      }

      this.retryCount += 1;
      await this.rateLimiter.backoff();
      return this.request<T>(path, options);
    }

    // Other errors - don't retry
    throw createApiError(status, body, this.apiType);
  }

  /**
   * Make a GET request
   */
  protected get<T>(path: string, params?: Record<string, string>): Promise<T> {
    let url = path;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url = `${path}?${searchParams.toString()}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * Make a POST request
   */
  protected post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  protected put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a PATCH request
   */
  protected patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  protected delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * Update the access token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get rate limiter stats for debugging
   */
  getRateLimiterStats(): ReturnType<RateLimiter['getStats']> {
    return this.rateLimiter.getStats();
  }
}

/**
 * Helper to build URL with query parameters
 */
export function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(path, base);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}
