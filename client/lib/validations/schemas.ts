/**
 * Zod Validation Schemas
 * 
 * Centralized input validation schemas for API routes and data processing.
 * Using Zod for runtime type validation ensures type safety at system boundaries.
 * 
 * ## Usage
 * ```typescript
 * import { deckIdSchema, dateRangeSchema } from '@/lib/validations/schemas';
 * 
 * // Validate deck ID
 * const result = deckIdSchema.safeParse(params.id);
 * if (!result.success) {
 *   return Response.json({ error: result.error.message }, { status: 400 });
 * }
 * 
 * // Use validated data
 * const deckId = result.data;
 * ```
 */

import { z } from 'zod';

// =============================================================================
// PRIMITIVE SCHEMAS
// =============================================================================

/**
 * Moxfield deck ID validation.
 * Format: alphanumeric with hyphens and underscores
 */
export const deckIdSchema = z
  .string()
  .min(1, 'Deck ID is required')
  .max(100, 'Deck ID is too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Deck ID must contain only letters, numbers, hyphens, and underscores'
  );

/**
 * Commander ID validation.
 * Single ID or underscore-separated pair for partners
 */
export const commanderIdSchema = z
  .string()
  .min(1, 'Commander ID is required')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Commander ID must contain only letters, numbers, hyphens, and underscores'
  );

/**
 * ISO date string validation (YYYY-MM-DD)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date'
  );

/**
 * Positive integer validation
 */
export const positiveIntSchema = z
  .number()
  .int('Must be an integer')
  .positive('Must be positive');

/**
 * Non-negative integer validation (for counts)
 */
export const nonNegativeIntSchema = z
  .number()
  .int('Must be an integer')
  .nonnegative('Must be non-negative');

/**
 * Percentage validation (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage must be at most 100');

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Must be a valid URL');

/**
 * Moxfield URL validation
 */
export const moxfieldUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .regex(
    /moxfield\.com\/decks\/[a-zA-Z0-9_-]+/,
    'Must be a valid Moxfield deck URL'
  );

// =============================================================================
// API REQUEST SCHEMAS
// =============================================================================

/**
 * Deck analysis request parameters
 */
export const deckAnalysisParamsSchema = z.object({
  id: deckIdSchema,
});

/**
 * Commander lookup request parameters
 */
export const commanderParamsSchema = z.object({
  id: commanderIdSchema,
});

/**
 * Date range query parameters
 */
export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date' }
);

/**
 * Pagination query parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * ETL job creation request
 */
export const etlJobCreateSchema = z.object({
  job_type: z.enum(['SEED', 'DAILY_UPDATE', 'BATCH_PROCESS']),
  parameters: z.object({
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    batchSize: z.number().int().positive().max(500).optional(),
    cursor: z.string().optional(),
    priority: z.number().int().min(0).max(10).optional(),
  }).optional(),
});

/**
 * ETL batch processing parameters
 */
export const etlBatchParamsSchema = z.object({
  cursor: z.string().nullable().optional(),
  batchSize: z.number().int().positive().max(500).default(50),
});

// =============================================================================
// DATA ENTITY SCHEMAS
// =============================================================================

/**
 * Tournament standing data
 */
export const tournamentStandingSchema = z.object({
  decklist: z.string(),
  wins: nonNegativeIntSchema,
  losses: nonNegativeIntSchema,
  draws: nonNegativeIntSchema,
});

/**
 * Tournament data from Topdeck API
 */
export const tournamentSchema = z.object({
  TID: z.string(),
  tournamentName: z.string(),
  startDate: z.union([z.string(), z.number()]),
  standings: z.array(tournamentStandingSchema),
});

/**
 * Card statistics response
 */
export const cardStatsSchema = z.object({
  wins: nonNegativeIntSchema,
  losses: nonNegativeIntSchema,
  draws: nonNegativeIntSchema,
  entries: positiveIntSchema,
  winRate: percentageSchema,
  inclusionRate: percentageSchema,
  winRateDiff: z.number(),
  confidence: percentageSchema,
});

/**
 * Commander statistics response
 */
export const commanderStatsSchema = z.object({
  id: commanderIdSchema,
  name: z.string(),
  wins: nonNegativeIntSchema,
  losses: nonNegativeIntSchema,
  draws: nonNegativeIntSchema,
  entries: positiveIntSchema,
  winRate: percentageSchema,
});

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Result of a validation operation
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] };

/**
 * Validate data against a schema and return a typed result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    error: result.error.errors.map(e => e.message).join(', '),
    issues: result.error.errors,
  };
}

/**
 * Extract deck ID from a Moxfield URL
 */
export function extractDeckIdFromUrl(url: string): string | null {
  const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Validate and extract deck ID from URL or direct ID
 */
export function validateDeckInput(input: string): ValidationResult<string> {
  // If it looks like a URL, extract the ID
  if (input.includes('moxfield.com')) {
    const extracted = extractDeckIdFromUrl(input);
    if (!extracted) {
      return {
        success: false,
        error: 'Could not extract deck ID from Moxfield URL',
        issues: [],
      };
    }
    input = extracted;
  }
  
  return validate(deckIdSchema, input);
}

