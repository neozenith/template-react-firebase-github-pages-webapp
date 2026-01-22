/**
 * Token Bucket Rate Limiter
 *
 * Implements a token bucket algorithm for rate limiting API requests.
 * The bucket starts full and tokens are consumed per request. Tokens
 * are replenished at a steady rate based on the configured limits.
 *
 * @see https://en.wikipedia.org/wiki/Token_bucket
 */

import { RETRY_CONFIG, type RateLimitConfig } from './constants';

/**
 * Rate limiter state
 */
interface RateLimiterState {
  tokens: number;
  lastRefill: number;
  backoffUntil: number;
}

/**
 * Token bucket rate limiter
 *
 * Features:
 * - Smooth rate limiting with burst allowance
 * - Automatic token replenishment
 * - Exponential backoff on 429 responses
 * - Non-blocking with async acquire
 */
export class RateLimiter {
  private state: RateLimiterState;
  private readonly config: RateLimitConfig;
  private readonly tokensPerMs: number;
  private currentBackoffAttempt = 0;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Calculate token replenishment rate: tokens per millisecond
    this.tokensPerMs = config.requestsPerUserPerMinute / config.windowMs;
    // Start with a full bucket
    this.state = {
      tokens: config.burstSize,
      lastRefill: Date.now(),
      backoffUntil: 0,
    };
  }

  /**
   * Acquire a token, waiting if necessary
   *
   * @returns Promise that resolves when a token is acquired
   */
  async acquire(): Promise<void> {
    // First check if we're in backoff
    await this.waitForBackoff();

    // Refill tokens based on elapsed time
    this.refillTokens();

    // If we have tokens, consume one
    if (this.state.tokens >= 1) {
      this.state.tokens -= 1;
      return;
    }

    // No tokens available, calculate wait time
    const waitTime = this.calculateWaitTime();
    await this.sleep(waitTime);

    // Retry after waiting
    return this.acquire();
  }

  /**
   * Try to acquire a token without waiting
   *
   * @returns true if token acquired, false if would need to wait
   */
  tryAcquire(): boolean {
    if (this.isInBackoff()) {
      return false;
    }

    this.refillTokens();

    if (this.state.tokens >= 1) {
      this.state.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Signal that a rate limit response was received
   * Triggers exponential backoff
   *
   * @param retryAfterMs - Optional retry-after hint from API
   */
  async backoff(retryAfterMs?: number): Promise<void> {
    this.currentBackoffAttempt += 1;

    const baseDelay = retryAfterMs ?? this.calculateBackoffDelay();
    const jitter = baseDelay * RETRY_CONFIG.jitterFactor * Math.random();
    const totalDelay = baseDelay + jitter;

    this.state.backoffUntil = Date.now() + totalDelay;
    await this.sleep(totalDelay);
  }

  /**
   * Reset backoff state (call on successful request)
   */
  resetBackoff(): void {
    this.currentBackoffAttempt = 0;
    this.state.backoffUntil = 0;
  }

  /**
   * Check if currently in backoff period
   */
  isInBackoff(): boolean {
    return Date.now() < this.state.backoffUntil;
  }

  /**
   * Get remaining backoff time in milliseconds
   */
  getRemainingBackoff(): number {
    return Math.max(0, this.state.backoffUntil - Date.now());
  }

  /**
   * Get current token count
   */
  getTokenCount(): number {
    this.refillTokens();
    return this.state.tokens;
  }

  /**
   * Get current rate limiter stats for debugging
   */
  getStats(): {
    tokens: number;
    isInBackoff: boolean;
    remainingBackoffMs: number;
    backoffAttempt: number;
  } {
    return {
      tokens: this.getTokenCount(),
      isInBackoff: this.isInBackoff(),
      remainingBackoffMs: this.getRemainingBackoff(),
      backoffAttempt: this.currentBackoffAttempt,
    };
  }

  /**
   * Refill tokens based on elapsed time since last refill
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.state.lastRefill;
    const tokensToAdd = elapsed * this.tokensPerMs;

    this.state.tokens = Math.min(
      this.config.burstSize,
      this.state.tokens + tokensToAdd
    );
    this.state.lastRefill = now;
  }

  /**
   * Calculate wait time until next token is available
   */
  private calculateWaitTime(): number {
    const tokensNeeded = 1 - this.state.tokens;
    return Math.ceil(tokensNeeded / this.tokensPerMs);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(): number {
    const delay =
      RETRY_CONFIG.initialBackoffMs *
      Math.pow(RETRY_CONFIG.backoffMultiplier, this.currentBackoffAttempt);
    return Math.min(delay, RETRY_CONFIG.maxBackoffMs);
  }

  /**
   * Wait until backoff period ends
   */
  private async waitForBackoff(): Promise<void> {
    const remaining = this.getRemainingBackoff();
    if (remaining > 0) {
      await this.sleep(remaining);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a rate limiter for a specific API type
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}
