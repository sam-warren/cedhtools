/**
 * Utility Functions
 * 
 * Centralized utility exports for the application.
 */

// Class name utility
export { cn } from './cn';

// Commander utilities
export {
    generateCommanderId,
    generateCommanderName,
    isPartnerPair,
    getIndividualCommanderIds,
    commandersToArray,
} from './commander';
export type { CommanderCard } from './commander';

// Statistical utilities
export {
    calculateEffectSize,
    factorial,
    calculateChiSquare,
    calculateConfidence,
    calculateWinRate,
    calculateInclusionRate,
    TARGET_SAMPLE_SIZE,
    Z_SCORE_95_CONFIDENCE,
    MAX_SAMPLE_SIZE_SCORE,
    MAX_SIGNIFICANCE_SCORE,
    MAX_EFFECT_SIZE_SCORE,
    RETRY_BASE_DELAY_MS,
    RETRY_MAX_BACKOFF_MS,
    MAX_RETRY_ATTEMPTS,
} from './statistics';
export type { EffectSizeResult, ChiSquareResult } from './statistics';

// Fetch utilities
export { fetchApi, fetchWithAuth, redirectToLogin } from './fetch';

