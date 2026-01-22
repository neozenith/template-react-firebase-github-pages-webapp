/**
 * Rate Limiter Tests
 *
 * Tests for the token bucket rate limiter implementation.
 * These tests verify rate limiting behavior without mocking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from './rate-limiter';
import type { RateLimitConfig } from './constants';

describe('RateLimiter', () => {
  // Fast config for testing (avoids long delays)
  const testConfig: RateLimitConfig = {
    requestsPerMinute: 600, // 10 per second
    requestsPerUserPerMinute: 60, // 1 per second
    burstSize: 5,
    windowMs: 60_000,
  };

  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    rateLimiter = new RateLimiter(testConfig);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('initializes with full token bucket', () => {
      const stats = rateLimiter.getStats();
      expect(stats.tokens).toBe(testConfig.burstSize);
    });

    it('starts with no backoff', () => {
      const stats = rateLimiter.getStats();
      expect(stats.isInBackoff).toBe(false);
      expect(stats.remainingBackoffMs).toBe(0);
      expect(stats.backoffAttempt).toBe(0);
    });
  });

  describe('tryAcquire', () => {
    it('succeeds when tokens are available', () => {
      expect(rateLimiter.tryAcquire()).toBe(true);
      expect(rateLimiter.getTokenCount()).toBe(testConfig.burstSize - 1);
    });

    it('consumes one token per call', () => {
      const initialTokens = rateLimiter.getTokenCount();
      rateLimiter.tryAcquire();
      expect(rateLimiter.getTokenCount()).toBe(initialTokens - 1);
    });

    it('fails when no tokens available', () => {
      // Exhaust all tokens
      for (let i = 0; i < testConfig.burstSize; i++) {
        rateLimiter.tryAcquire();
      }
      expect(rateLimiter.tryAcquire()).toBe(false);
    });

    it('returns false during backoff', () => {
      // Start backoff without awaiting (we just want to check isInBackoff)
      void rateLimiter.backoff(100);
      expect(rateLimiter.isInBackoff()).toBe(true);
      expect(rateLimiter.tryAcquire()).toBe(false);
    });
  });

  describe('acquire', () => {
    it('resolves immediately when tokens available', async () => {
      const promise = rateLimiter.acquire();
      await vi.runAllTimersAsync();
      await expect(promise).resolves.toBeUndefined();
    });

    it('waits for tokens when none available', async () => {
      // Exhaust all tokens
      for (let i = 0; i < testConfig.burstSize; i++) {
        await rateLimiter.acquire();
      }

      // Next acquire should wait
      let resolved = false;
      const promise = rateLimiter.acquire().then(() => {
        resolved = true;
      });

      // Should not resolve immediately
      await vi.advanceTimersByTimeAsync(100);
      expect(resolved).toBe(false);

      // Advance enough time for token replenishment
      // With 60 requests/min = 1/second, wait 1 second for 1 token
      await vi.advanceTimersByTimeAsync(1000);
      await vi.runAllTimersAsync();
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe('token refill', () => {
    it('refills tokens over time', async () => {
      // Exhaust all tokens
      for (let i = 0; i < testConfig.burstSize; i++) {
        rateLimiter.tryAcquire();
      }
      expect(rateLimiter.getTokenCount()).toBe(0);

      // Advance 1 second (60 requests/min = 1/second)
      await vi.advanceTimersByTimeAsync(1000);

      // Should have ~1 token
      expect(rateLimiter.getTokenCount()).toBeCloseTo(1, 0);
    });

    it('does not exceed burst size', async () => {
      // Wait a long time
      await vi.advanceTimersByTimeAsync(120_000);

      // Should be capped at burst size
      expect(rateLimiter.getTokenCount()).toBe(testConfig.burstSize);
    });
  });

  describe('backoff', () => {
    it('enters backoff state immediately', () => {
      // Start backoff (don't await)
      void rateLimiter.backoff(1000);
      expect(rateLimiter.isInBackoff()).toBe(true);
    });

    it('respects retry-after hint', async () => {
      const backoffMs = 2000;
      const backoffPromise = rateLimiter.backoff(backoffMs);

      // Should be in backoff
      expect(rateLimiter.isInBackoff()).toBe(true);
      // Allow for 10% jitter
      expect(rateLimiter.getRemainingBackoff()).toBeLessThanOrEqual(
        backoffMs * 1.1
      );

      // Advance past backoff
      await vi.advanceTimersByTimeAsync(backoffMs * 1.2);
      await backoffPromise;
    });

    it('increments backoff attempt counter', async () => {
      expect(rateLimiter.getStats().backoffAttempt).toBe(0);

      // First backoff
      const p1 = rateLimiter.backoff(100);
      await vi.advanceTimersByTimeAsync(200);
      await p1;
      expect(rateLimiter.getStats().backoffAttempt).toBe(1);

      // Second backoff
      const p2 = rateLimiter.backoff(100);
      await vi.advanceTimersByTimeAsync(200);
      await p2;
      expect(rateLimiter.getStats().backoffAttempt).toBe(2);
    });

    it('calculates exponential backoff when no hint provided', () => {
      // First backoff - since counter increments before calculation:
      // delay = 1000 * 2^1 = 2000ms + jitter
      void rateLimiter.backoff();
      const remaining1 = rateLimiter.getRemainingBackoff();
      // Should be around 2000ms +/- 10% jitter
      expect(remaining1).toBeGreaterThanOrEqual(1800);
      expect(remaining1).toBeLessThanOrEqual(2400);
    });
  });

  describe('resetBackoff', () => {
    it('resets backoff attempt counter', async () => {
      // Start and complete some backoffs
      const p1 = rateLimiter.backoff(100);
      await vi.advanceTimersByTimeAsync(200);
      await p1;

      const p2 = rateLimiter.backoff(100);
      await vi.advanceTimersByTimeAsync(200);
      await p2;

      expect(rateLimiter.getStats().backoffAttempt).toBe(2);

      rateLimiter.resetBackoff();
      expect(rateLimiter.getStats().backoffAttempt).toBe(0);
    });

    it('clears backoff state', () => {
      void rateLimiter.backoff(10000); // Long backoff
      expect(rateLimiter.isInBackoff()).toBe(true);

      rateLimiter.resetBackoff();
      expect(rateLimiter.isInBackoff()).toBe(false);
      expect(rateLimiter.getRemainingBackoff()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('returns all stat properties', () => {
      const stats = rateLimiter.getStats();
      expect(stats).toHaveProperty('tokens');
      expect(stats).toHaveProperty('isInBackoff');
      expect(stats).toHaveProperty('remainingBackoffMs');
      expect(stats).toHaveProperty('backoffAttempt');
    });

    it('tokens are numeric', () => {
      expect(typeof rateLimiter.getStats().tokens).toBe('number');
    });

    it('backoffAttempt starts at zero', () => {
      expect(rateLimiter.getStats().backoffAttempt).toBe(0);
    });
  });

  describe('isInBackoff', () => {
    it('returns false initially', () => {
      expect(rateLimiter.isInBackoff()).toBe(false);
    });

    it('returns true during backoff', () => {
      void rateLimiter.backoff(5000);
      expect(rateLimiter.isInBackoff()).toBe(true);
    });

    it('returns false after backoff completes', async () => {
      const p = rateLimiter.backoff(1000);
      await vi.advanceTimersByTimeAsync(1500);
      await p;
      expect(rateLimiter.isInBackoff()).toBe(false);
    });
  });

  describe('getRemainingBackoff', () => {
    it('returns 0 when not in backoff', () => {
      expect(rateLimiter.getRemainingBackoff()).toBe(0);
    });

    it('returns positive value during backoff', () => {
      void rateLimiter.backoff(5000);
      expect(rateLimiter.getRemainingBackoff()).toBeGreaterThan(0);
    });

    it('decreases over time', async () => {
      void rateLimiter.backoff(5000);
      const initial = rateLimiter.getRemainingBackoff();

      await vi.advanceTimersByTimeAsync(1000);
      const later = rateLimiter.getRemainingBackoff();

      expect(later).toBeLessThan(initial);
    });
  });
});
