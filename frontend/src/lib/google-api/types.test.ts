/**
 * Types and Error Tests
 *
 * Tests for error types and parsing utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  GoogleApiError,
  TokenExpiredError,
  RateLimitError,
  PermissionDeniedError,
  NotFoundError,
  parseErrorResponse,
  createApiError,
} from './types';

describe('GoogleApiError', () => {
  it('creates error with status and message', () => {
    const error = new GoogleApiError(400, 'Bad request');
    expect(error.status).toBe(400);
    expect(error.message).toBe('Bad request');
    expect(error.name).toBe('GoogleApiError');
  });

  it('includes api type and response body', () => {
    const error = new GoogleApiError(
      500,
      'Server error',
      'drive',
      '{"error":"internal"}'
    );
    expect(error.apiType).toBe('drive');
    expect(error.responseBody).toBe('{"error":"internal"}');
  });

  it('is instanceof Error', () => {
    const error = new GoogleApiError(400, 'Bad request');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof GoogleApiError).toBe(true);
  });
});

describe('TokenExpiredError', () => {
  it('has correct status code', () => {
    const error = new TokenExpiredError();
    expect(error.status).toBe(401);
    expect(error.name).toBe('TokenExpiredError');
  });

  it('has default message', () => {
    const error = new TokenExpiredError();
    expect(error.message).toBe('Access token has expired');
  });

  it('accepts custom message', () => {
    const error = new TokenExpiredError('Token invalid');
    expect(error.message).toBe('Token invalid');
  });

  it('is instanceof GoogleApiError', () => {
    const error = new TokenExpiredError();
    expect(error instanceof GoogleApiError).toBe(true);
  });
});

describe('RateLimitError', () => {
  it('has correct status code', () => {
    const error = new RateLimitError();
    expect(error.status).toBe(429);
    expect(error.name).toBe('RateLimitError');
  });

  it('includes retry-after hint', () => {
    const error = new RateLimitError(5000, 'Too many requests');
    expect(error.retryAfterMs).toBe(5000);
    expect(error.message).toBe('Too many requests');
  });

  it('has default message', () => {
    const error = new RateLimitError();
    expect(error.message).toBe('Rate limit exceeded');
  });
});

describe('PermissionDeniedError', () => {
  it('has correct status code', () => {
    const error = new PermissionDeniedError();
    expect(error.status).toBe(403);
    expect(error.name).toBe('PermissionDeniedError');
  });

  it('accepts custom message', () => {
    const error = new PermissionDeniedError('Access denied to file');
    expect(error.message).toBe('Access denied to file');
  });
});

describe('NotFoundError', () => {
  it('has correct status code', () => {
    const error = new NotFoundError('File');
    expect(error.status).toBe(404);
    expect(error.name).toBe('NotFoundError');
  });

  it('includes resource type in message', () => {
    const error = new NotFoundError('Spreadsheet');
    expect(error.message).toBe('Spreadsheet not found');
  });

  it('includes resource ID when provided', () => {
    const error = new NotFoundError('Calendar', 'abc123');
    expect(error.message).toBe('Calendar not found: abc123');
  });
});

describe('parseErrorResponse', () => {
  it('parses valid error JSON', () => {
    const body = JSON.stringify({
      error: {
        code: 400,
        message: 'Invalid request',
        status: 'INVALID_ARGUMENT',
      },
    });
    const result = parseErrorResponse(body);
    expect(result?.error.code).toBe(400);
    expect(result?.error.message).toBe('Invalid request');
    expect(result?.error.status).toBe('INVALID_ARGUMENT');
  });

  it('parses error with nested errors array', () => {
    const body = JSON.stringify({
      error: {
        code: 429,
        message: 'Rate limit exceeded',
        errors: [
          {
            domain: 'usageLimits',
            reason: 'rateLimitExceeded',
            message: 'Rate limit exceeded. Try again in 60 seconds.',
          },
        ],
      },
    });
    const result = parseErrorResponse(body);
    expect(result?.error.errors).toHaveLength(1);
    expect(result?.error.errors?.[0].reason).toBe('rateLimitExceeded');
  });

  it('returns null for invalid JSON', () => {
    const result = parseErrorResponse('not json');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = parseErrorResponse('');
    expect(result).toBeNull();
  });

  it('handles non-error shaped JSON', () => {
    const result = parseErrorResponse('{"foo": "bar"}');
    expect(result).not.toBeNull();
    // The cast works but error property will be undefined
    expect(result?.error).toBeUndefined();
  });
});

describe('createApiError', () => {
  it('creates TokenExpiredError for 401', () => {
    const error = createApiError(401, '{"error":{"message":"Invalid token"}}');
    expect(error).toBeInstanceOf(TokenExpiredError);
    expect(error.message).toBe('Invalid token');
  });

  it('creates PermissionDeniedError for 403', () => {
    const error = createApiError(403, '{"error":{"message":"No access"}}');
    expect(error).toBeInstanceOf(PermissionDeniedError);
    expect(error.message).toBe('No access');
  });

  it('creates NotFoundError for 404', () => {
    const error = createApiError(404, '{"error":{"message":"Not found"}}');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('creates RateLimitError for 429', () => {
    const error = createApiError(
      429,
      '{"error":{"message":"Too many requests"}}'
    );
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.message).toBe('Too many requests');
  });

  it('creates generic GoogleApiError for other status codes', () => {
    const error = createApiError(500, '{"error":{"message":"Server error"}}');
    expect(error).toBeInstanceOf(GoogleApiError);
    expect(error).not.toBeInstanceOf(TokenExpiredError);
    expect(error.status).toBe(500);
  });

  it('includes api type in error', () => {
    const error = createApiError(
      500,
      '{"error":{"message":"Error"}}',
      'sheets'
    );
    expect(error.apiType).toBe('sheets');
  });

  it('uses fallback message for invalid JSON', () => {
    const error = createApiError(500, 'Internal error');
    expect(error.message).toBe('API error: 500');
  });

  it('extracts retry hint from rate limit error', () => {
    const body = JSON.stringify({
      error: {
        code: 429,
        message: 'Rate limit exceeded',
        errors: [{ message: 'Try again in 60 seconds' }],
      },
    });
    const error = createApiError(429, body) as RateLimitError;
    expect(error.retryAfterMs).toBe(60000);
  });
});
