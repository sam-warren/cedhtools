/**
 * Unit Tests for Custom Error Classes
 * 
 * Tests cover:
 * - Error class construction and properties
 * - Error serialization (toJSON)
 * - Error utilities (isAppError, toAppError, etc.)
 */

import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ServiceUnavailableError,
  EtlProcessingError,
  DuplicateProcessingError,
  isAppError,
  getErrorMessage,
  toAppError,
  AppError,
} from '../errors';

// =============================================================================
// VALIDATION ERROR TESTS
// =============================================================================

describe('ValidationError', () => {
  it('should create error with correct properties', () => {
    const error = new ValidationError('Invalid input');
    
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('ValidationError');
  });

  it('should include context', () => {
    const error = new ValidationError('Invalid input', {
      field: 'email',
      value: 'not-an-email',
    });
    
    expect(error.context).toEqual({
      field: 'email',
      value: 'not-an-email',
    });
  });

  it('should serialize to JSON correctly', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });
    const json = error.toJSON();
    
    expect(json).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'email' },
      },
    });
  });

  it('should have a timestamp', () => {
    const error = new ValidationError('Test');
    expect(error.timestamp).toBeDefined();
    expect(new Date(error.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
  });
});

// =============================================================================
// AUTHENTICATION ERROR TESTS
// =============================================================================

describe('AuthenticationError', () => {
  it('should use default message', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('Authentication required');
  });

  it('should have correct status code', () => {
    const error = new AuthenticationError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should accept custom message', () => {
    const error = new AuthenticationError('Token expired');
    expect(error.message).toBe('Token expired');
  });
});

// =============================================================================
// AUTHORIZATION ERROR TESTS
// =============================================================================

describe('AuthorizationError', () => {
  it('should use default message', () => {
    const error = new AuthorizationError();
    expect(error.message).toBe('Permission denied');
  });

  it('should have correct status code', () => {
    const error = new AuthorizationError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('AUTHORIZATION_ERROR');
  });
});

// =============================================================================
// NOT FOUND ERROR TESTS
// =============================================================================

describe('NotFoundError', () => {
  it('should format message with resource name', () => {
    const error = new NotFoundError('Commander');
    expect(error.message).toBe('Commander not found');
  });

  it('should format message with resource and identifier', () => {
    const error = new NotFoundError('Commander', 'thrasios_tymna');
    expect(error.message).toBe('Commander not found: thrasios_tymna');
  });

  it('should include resource in context', () => {
    const error = new NotFoundError('Deck', 'abc123');
    expect(error.context).toEqual({
      resource: 'Deck',
      identifier: 'abc123',
    });
  });

  it('should have correct status code', () => {
    const error = new NotFoundError('User');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });
});

// =============================================================================
// RATE LIMIT ERROR TESTS
// =============================================================================

describe('RateLimitError', () => {
  it('should use default message', () => {
    const error = new RateLimitError();
    expect(error.message).toBe('Rate limit exceeded');
  });

  it('should include retryAfter', () => {
    const error = new RateLimitError('Too many requests', 60);
    expect(error.retryAfter).toBe(60);
    expect(error.context?.retryAfter).toBe(60);
  });

  it('should have correct status code', () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

// =============================================================================
// DATABASE ERROR TESTS
// =============================================================================

describe('DatabaseError', () => {
  it('should create error with message', () => {
    const error = new DatabaseError('Connection failed');
    expect(error.message).toBe('Connection failed');
    expect(error.statusCode).toBe(500);
  });

  it('should include operation in context', () => {
    const error = new DatabaseError('Query failed', 'SELECT');
    expect(error.context?.operation).toBe('SELECT');
  });
});

// =============================================================================
// EXTERNAL SERVICE ERROR TESTS
// =============================================================================

describe('ExternalServiceError', () => {
  it('should include service name in message', () => {
    const error = new ExternalServiceError('Moxfield', 'API returned 500');
    expect(error.message).toBe('Moxfield: API returned 500');
    expect(error.service).toBe('Moxfield');
  });

  it('should have correct status code', () => {
    const error = new ExternalServiceError('Topdeck', 'Unavailable');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });
});

// =============================================================================
// SERVICE UNAVAILABLE ERROR TESTS
// =============================================================================

describe('ServiceUnavailableError', () => {
  it('should use default message', () => {
    const error = new ServiceUnavailableError();
    expect(error.message).toBe('Service temporarily unavailable');
  });

  it('should have correct status code', () => {
    const error = new ServiceUnavailableError();
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
  });
});

// =============================================================================
// ETL PROCESSING ERROR TESTS
// =============================================================================

describe('EtlProcessingError', () => {
  it('should include phase in context', () => {
    const error = new EtlProcessingError('Processing failed', 'transform');
    expect(error.context?.phase).toBe('transform');
  });

  it('should have correct status code', () => {
    const error = new EtlProcessingError('Failed');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('ETL_PROCESSING_ERROR');
  });
});

// =============================================================================
// DUPLICATE PROCESSING ERROR TESTS
// =============================================================================

describe('DuplicateProcessingError', () => {
  it('should include tournament ID in message', () => {
    const error = new DuplicateProcessingError('tournament-123');
    expect(error.message).toBe('Tournament already processed: tournament-123');
    expect(error.context?.tournamentId).toBe('tournament-123');
  });

  it('should have correct status code', () => {
    const error = new DuplicateProcessingError('t-1');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('DUPLICATE_PROCESSING');
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('isAppError', () => {
  it('should return true for AppError instances', () => {
    expect(isAppError(new ValidationError('test'))).toBe(true);
    expect(isAppError(new NotFoundError('resource'))).toBe(true);
    expect(isAppError(new RateLimitError())).toBe(true);
  });

  it('should return false for native errors', () => {
    expect(isAppError(new Error('test'))).toBe(false);
    expect(isAppError(new TypeError('test'))).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isAppError('error string')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({ message: 'fake error' })).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('should extract message from Error', () => {
    expect(getErrorMessage(new Error('test message'))).toBe('test message');
  });

  it('should return string directly', () => {
    expect(getErrorMessage('string error')).toBe('string error');
  });

  it('should return default for unknown types', () => {
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
    expect(getErrorMessage(123)).toBe('An unknown error occurred');
    expect(getErrorMessage({})).toBe('An unknown error occurred');
  });
});

describe('toAppError', () => {
  it('should return AppError as-is', () => {
    const original = new ValidationError('test');
    expect(toAppError(original)).toBe(original);
  });

  it('should convert rate limit patterns to RateLimitError', () => {
    const error = toAppError(new Error('Got 429 response'));
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.statusCode).toBe(429);
  });

  it('should convert not found patterns to NotFoundError', () => {
    const error = toAppError(new Error('Resource not found'));
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.statusCode).toBe(404);
  });

  it('should default to DatabaseError for unknown errors', () => {
    const error = toAppError(new Error('Some unknown error'));
    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.statusCode).toBe(500);
  });

  it('should handle string errors', () => {
    const error = toAppError('Something went wrong');
    expect(isAppError(error)).toBe(true);
    expect(error.message).toBe('Something went wrong');
  });
});

// =============================================================================
// ERROR INHERITANCE TESTS
// =============================================================================

describe('error inheritance', () => {
  it('all custom errors should extend AppError', () => {
    const errors = [
      new ValidationError('test'),
      new AuthenticationError(),
      new AuthorizationError(),
      new NotFoundError('resource'),
      new RateLimitError(),
      new DatabaseError('test'),
      new ExternalServiceError('service', 'error'),
      new ServiceUnavailableError(),
      new EtlProcessingError('test'),
      new DuplicateProcessingError('id'),
    ];

    errors.forEach(error => {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  it('all custom errors should have stack traces', () => {
    const error = new ValidationError('test');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('ValidationError');
  });
});

