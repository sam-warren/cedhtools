/**
 * Custom Error Classes
 * 
 * Provides typed, structured error handling across the application.
 * Each error class includes:
 * - Unique error code for identification
 * - HTTP status code mapping for API responses
 * - Structured context for debugging
 * - Proper stack traces
 * 
 * ## Usage
 * ```typescript
 * import { ValidationError, NotFoundError, RateLimitError } from '@/lib/errors';
 * 
 * // Throw a validation error
 * throw new ValidationError('Invalid deck ID format', {
 *   field: 'deckId',
 *   value: deckId,
 * });
 * 
 * // Check error type
 * if (error instanceof NotFoundError) {
 *   return Response.json({ error: error.message }, { status: error.statusCode });
 * }
 * ```
 */

// =============================================================================
// BASE ERROR CLASS
// =============================================================================

export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Base error class for all application errors.
 * 
 * Extends the native Error class with:
 * - Error code for programmatic handling
 * - HTTP status code for API responses
 * - Structured context for debugging
 */
export abstract class AppError extends Error {
  /** Unique error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND') */
  abstract readonly code: string;
  
  /** HTTP status code for API responses */
  abstract readonly statusCode: number;
  
  /** Additional context for debugging */
  readonly context?: ErrorContext;
  
  /** Timestamp when error occurred */
  readonly timestamp: string;

  constructor(message: string, context?: ErrorContext) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to a JSON-serializable object for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.context && { details: this.context }),
      },
    };
  }
}

// =============================================================================
// VALIDATION ERRORS (4xx Client Errors)
// =============================================================================

/**
 * Thrown when input validation fails.
 * 
 * Use for: Invalid parameters, malformed requests, type mismatches
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: ErrorContext) {
    super(message, context);
  }
}

/**
 * Thrown when authentication is required but not provided.
 * 
 * Use for: Missing auth token, expired session
 */
export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;

  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(message, context);
  }
}

/**
 * Thrown when user lacks permission for the requested action.
 * 
 * Use for: Insufficient privileges, resource ownership violations
 */
export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;

  constructor(message: string = 'Permission denied', context?: ErrorContext) {
    super(message, context);
  }
}

/**
 * Thrown when a requested resource doesn't exist.
 * 
 * Use for: Missing database records, invalid IDs
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, identifier?: string, context?: ErrorContext) {
    const message = identifier 
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, { resource, identifier, ...context });
  }
}

/**
 * Thrown when rate limit is exceeded.
 * 
 * Use for: API throttling, request quota exceeded
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;
  
  /** Seconds until rate limit resets */
  readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, context?: ErrorContext) {
    super(message, { retryAfter, ...context });
    this.retryAfter = retryAfter;
  }
}

// =============================================================================
// SERVER ERRORS (5xx)
// =============================================================================

/**
 * Thrown when a database operation fails.
 * 
 * Use for: Query failures, connection issues, constraint violations
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(message: string, operation?: string, context?: ErrorContext) {
    super(message, { operation, ...context });
  }
}

/**
 * Thrown when an external API call fails.
 * 
 * Use for: Moxfield API errors, Topdeck API errors, third-party failures
 */
export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;
  
  /** Name of the external service */
  readonly service: string;

  constructor(service: string, message: string, context?: ErrorContext) {
    super(`${service}: ${message}`, { service, ...context });
    this.service = service;
  }
}

/**
 * Thrown when a service is temporarily unavailable.
 * 
 * Use for: Maintenance mode, overloaded systems
 */
export class ServiceUnavailableError extends AppError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly statusCode = 503;

  constructor(message: string = 'Service temporarily unavailable', context?: ErrorContext) {
    super(message, context);
  }
}

// =============================================================================
// ETL-SPECIFIC ERRORS
// =============================================================================

/**
 * Thrown when ETL processing fails.
 * 
 * Use for: Data transformation errors, batch processing failures
 */
export class EtlProcessingError extends AppError {
  readonly code = 'ETL_PROCESSING_ERROR';
  readonly statusCode = 500;

  constructor(message: string, phase?: string, context?: ErrorContext) {
    super(message, { phase, ...context });
  }
}

/**
 * Thrown when a tournament is already processed.
 * 
 * Use for: Duplicate processing detection
 */
export class DuplicateProcessingError extends AppError {
  readonly code = 'DUPLICATE_PROCESSING';
  readonly statusCode = 409;

  constructor(tournamentId: string, context?: ErrorContext) {
    super(`Tournament already processed: ${tournamentId}`, { tournamentId, ...context });
  }
}

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Convert any error to an AppError for consistent handling
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  const message = getErrorMessage(error);
  
  // Check for common error patterns
  if (message.includes('429') || message.includes('Too Many Requests')) {
    return new RateLimitError(message);
  }
  if (message.includes('404') || message.includes('not found')) {
    return new NotFoundError('Resource', undefined, { originalMessage: message });
  }
  
  // Default to database error for unrecognized errors
  return new DatabaseError(message, undefined, {
    originalError: error instanceof Error ? error.name : typeof error,
  });
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(error: unknown): Response {
  const appError = toAppError(error);
  
  return Response.json(appError.toJSON(), {
    status: appError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...(appError instanceof RateLimitError && appError.retryAfter
        ? { 'Retry-After': String(appError.retryAfter) }
        : {}),
    },
  });
}

