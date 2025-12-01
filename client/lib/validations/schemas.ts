/**
 * Zod Validation Schemas
 * 
 * Centralized input validation schemas for API routes and data processing.
 * Using Zod for runtime type validation ensures type safety at system boundaries.
 * 
 * ## Usage
 * ```typescript
 * import { commanderIdSchema, dateRangeSchema } from '@/lib/validations/schemas';
 * 
 * // Validate commander ID
 * const result = commanderIdSchema.safeParse(params.id);
 * if (!result.success) {
 *   return Response.json({ error: result.error.message }, { status: 400 });
 * }
 * 
 * // Use validated data
 * const commanderId = result.data;
 * ```
 */

import { z } from 'zod';

// =============================================================================
// PRIMITIVE SCHEMAS
// =============================================================================

/**
 * Scryfall UUID validation.
 * Format: UUID or underscore-separated pair for partner commanders
 */
export const scryfallIdSchema = z
  .string()
  .min(1, 'ID is required')
  .regex(
    /^[a-f0-9-]+(_[a-f0-9-]+)?$/i,
    'ID must be a valid Scryfall UUID or partner pair'
  );

/**
 * Commander ID validation.
 * Single UUID or underscore-separated pair for partners
 */
export const commanderIdSchema = z
  .string()
  .min(1, 'Commander ID is required')
  .regex(
    /^[a-f0-9-]+(_[a-f0-9-]+)?$/i,
    'Commander ID must be a valid Scryfall UUID or partner pair'
  );

/**
 * Card ID validation (Scryfall UUID)
 */
export const cardIdSchema = z
  .string()
  .min(1, 'Card ID is required')
  .regex(
    /^[a-f0-9-]+$/i,
    'Card ID must be a valid Scryfall UUID'
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
 * Deck list text validation
 */
export const deckListSchema = z
  .string()
  .min(10, 'Deck list is too short')
  .max(50000, 'Deck list is too long');

// =============================================================================
// API REQUEST SCHEMAS
// =============================================================================

/**
 * Deck analysis request body
 */
export const deckAnalysisRequestSchema = z.object({
  commanderId: commanderIdSchema,
  deckList: deckListSchema,
  deckName: z.string().max(200).optional(),
});

/**
 * Commander lookup request parameters
 */
export const commanderParamsSchema = z.object({
  id: commanderIdSchema,
});

/**
 * Commander list query parameters
 */
export const commanderListQuerySchema = z.object({
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().positive().max(100).default(100),
  minEntries: z.coerce.number().int().nonnegative().default(1),
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
 * Tournament standing data (with deckObj)
 */
export const tournamentStandingSchema = z.object({
  name: z.string(),
  id: z.string(),
  decklist: z.string().nullable(),
  deckObj: z.object({
    Commanders: z.record(z.object({
      id: z.string(),
      count: z.number(),
    })),
    Mainboard: z.record(z.object({
      id: z.string(),
      count: z.number(),
    })),
  }).nullable(),
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
 * Check if a string is a valid Scryfall UUID
 */
export function isValidScryfallId(id: string): boolean {
  return /^[a-f0-9-]+$/i.test(id);
}

/**
 * Check if a commander ID is a partner pair
 */
export function isPartnerPair(commanderId: string): boolean {
  return commanderId.includes('_');
}
