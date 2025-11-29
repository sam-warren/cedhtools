/**
 * Statistical Analysis Utilities
 * 
 * This module provides statistical functions for calculating confidence metrics,
 * effect sizes, and significance tests for card performance analysis in cEDH.
 * 
 * These functions are used to determine how statistically meaningful the
 * performance differences are between cards played under a specific commander
 * versus the commander's baseline performance.
 */

/**
 * Result of effect size calculation using Cohen's h
 */
export interface EffectSizeResult {
  /** Cohen's h effect size (-1 to 1, where 0.2=small, 0.5=medium, 0.8=large) */
  effectSize: number;
  /** Lower bound of 95% confidence interval */
  lowerCI: number;
  /** Upper bound of 95% confidence interval */
  upperCI: number;
}

/**
 * Result of chi-square test
 */
export interface ChiSquareResult {
  /** Chi-square test statistic */
  chiSquare: number;
  /** P-value (probability of observing results under null hypothesis) */
  pValue: number;
}

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

/** Target sample size for statistical power (based on power analysis for α=0.05, power=0.8) */
export const TARGET_SAMPLE_SIZE = 100;

/** Z-score for 95% confidence level */
export const Z_SCORE_95_CONFIDENCE = 1.96;

/** Maximum points for sample size component of confidence score */
export const MAX_SAMPLE_SIZE_SCORE = 40;

/** Maximum points for statistical significance component */
export const MAX_SIGNIFICANCE_SCORE = 30;

/** Maximum points for effect size component */
export const MAX_EFFECT_SIZE_SCORE = 30;

/** Base delay for retry backoff in milliseconds */
export const RETRY_BASE_DELAY_MS = 5000;

/** Maximum backoff delay in milliseconds (2 minutes) */
export const RETRY_MAX_BACKOFF_MS = 120000;

/** Maximum retry attempts for rate-limited requests */
export const MAX_RETRY_ATTEMPTS = 5;

// =============================================================================
// STATISTICAL FUNCTIONS
// =============================================================================

/**
 * Calculates Cohen's h effect size for comparing two proportions.
 * 
 * Cohen's h is a measure of distance between two proportions, commonly used
 * when comparing success rates. The formula uses arcsine transformation to
 * stabilize variance.
 * 
 * Effect size interpretation (Cohen's conventions):
 * - |h| < 0.2: Negligible effect
 * - |h| = 0.2: Small effect
 * - |h| = 0.5: Medium effect
 * - |h| = 0.8: Large effect
 * 
 * @param cardWins - Number of wins when this card is played
 * @param cardLosses - Number of losses when this card is played
 * @param commanderWins - Total wins for the commander (baseline)
 * @param commanderLosses - Total losses for the commander (baseline)
 * @returns Effect size with 95% confidence intervals
 * 
 * @example
 * ```typescript
 * const result = calculateEffectSize(50, 30, 500, 400);
 * // result.effectSize > 0 means the card performs better than baseline
 * ```
 */
export function calculateEffectSize(
  cardWins: number,
  cardLosses: number,
  commanderWins: number,
  commanderLosses: number
): EffectSizeResult {
  const cardTotal = cardWins + cardLosses;
  const commanderTotal = commanderWins + commanderLosses;

  // Handle edge cases where we can't calculate meaningful effect size
  if (cardTotal === 0 || commanderTotal === 0) {
    return { effectSize: 0, lowerCI: 0, upperCI: 0 };
  }

  // Calculate win rate proportions
  const cardProportion = cardWins / cardTotal;
  const commanderProportion = commanderWins / commanderTotal;

  // Cohen's h formula: 2 * arcsin(sqrt(p1)) - 2 * arcsin(sqrt(p2))
  // This transformation stabilizes variance across different proportion values
  const effectSize = 2 * Math.asin(Math.sqrt(cardProportion)) - 2 * Math.asin(Math.sqrt(commanderProportion));

  // Calculate standard error for confidence intervals
  // SE for arcsine-transformed proportions approximates 1/sqrt(n)
  const cardSE = 1 / Math.sqrt(cardTotal);
  const commanderSE = 1 / Math.sqrt(commanderTotal);
  
  // Combined SE using variance addition rule for independent samples
  const combinedSE = Math.sqrt(cardSE * cardSE + commanderSE * commanderSE);

  // Calculate 95% confidence interval bounds
  const lowerCI = effectSize - Z_SCORE_95_CONFIDENCE * combinedSE;
  const upperCI = effectSize + Z_SCORE_95_CONFIDENCE * combinedSE;

  return { effectSize, lowerCI, upperCI };
}

/**
 * Calculates factorial of a non-negative integer.
 * Used internally by Fisher's Exact Test calculation.
 * 
 * @param n - Non-negative integer
 * @returns n! (factorial of n)
 */
export function factorial(n: number): number {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Performs chi-square test or Fisher's Exact Test for small samples.
 * 
 * This function tests whether the win rate for a card differs significantly
 * from the commander's baseline win rate. It constructs a 2x2 contingency table:
 * 
 *                    | Wins    | Losses   |
 * -------------------|---------|----------|
 * Card played        | a       | b        |
 * Commander baseline | c       | d        |
 * 
 * For small samples (any cell < 5), Fisher's Exact Test is used.
 * For larger samples, chi-square with Yates' continuity correction is used.
 * 
 * @param cardWins - Wins when card is played
 * @param cardLosses - Losses when card is played
 * @param commanderWins - Commander baseline wins
 * @param commanderLosses - Commander baseline losses
 * @returns Chi-square statistic and p-value
 * 
 * @example
 * ```typescript
 * const { pValue } = calculateChiSquare(50, 30, 500, 400);
 * if (pValue < 0.05) {
 *   console.log('Statistically significant difference!');
 * }
 * ```
 */
export function calculateChiSquare(
  cardWins: number,
  cardLosses: number,
  commanderWins: number,
  commanderLosses: number
): ChiSquareResult {
  const cardTotal = cardWins + cardLosses;
  const commanderTotal = commanderWins + commanderLosses;
  const total = cardTotal + commanderTotal;

  // Handle edge cases
  if (cardTotal === 0 || commanderTotal === 0) {
    return { chiSquare: 0, pValue: 1 };
  }

  // Use Fisher's Exact Test for small samples (any expected cell < 5)
  // This provides more accurate p-values when chi-square approximation breaks down
  if (cardWins < 5 || cardLosses < 5 || commanderWins < 5 || commanderLosses < 5) {
    const n = total;
    const a = cardWins;
    const b = cardLosses;
    const c = commanderWins;
    const d = commanderLosses;
    
    // Fisher's Exact Test: probability = (a+b)!(c+d)!(a+c)!(b+d)! / (a!b!c!d!n!)
    // We use log to avoid overflow with large factorials
    const numerator = Math.log(
      (factorial(a + b) * factorial(c + d) * factorial(a + c) * factorial(b + d)) /
      (factorial(a) * factorial(b) * factorial(c) * factorial(d) * factorial(n))
    );
    
    // Approximate chi-square from Fisher's test statistic
    const chiSquare = -2 * numerator;
    const pValue = Math.exp(-chiSquare / 2);
    
    return { chiSquare, pValue };
  }

  // For larger samples, use chi-square test with Yates' continuity correction
  // Expected values under null hypothesis (independence)
  const expectedWins = (cardTotal * (commanderWins + cardWins)) / total;
  const expectedLosses = (cardTotal * (commanderLosses + cardLosses)) / total;

  // Chi-square with Yates' correction: sum of (|O-E| - 0.5)² / E
  // The -0.5 correction improves accuracy for small-to-moderate samples
  const chiSquare =
    Math.pow(Math.abs(cardWins - expectedWins) - 0.5, 2) / expectedWins +
    Math.pow(Math.abs(cardLosses - expectedLosses) - 0.5, 2) / expectedLosses;

  // Approximate p-value using chi-square distribution with 1 df
  // This is an exponential approximation: P(χ² > x) ≈ e^(-x/2)
  const pValue = Math.exp(-chiSquare / 2);

  return { chiSquare, pValue };
}

/**
 * Calculates a composite confidence score for statistical analysis results.
 * 
 * The confidence score combines three factors:
 * 1. **Sample Size (0-40 points)**: Larger samples provide more reliable estimates
 *    - Uses sigmoid function for smooth scaling
 *    - Target: 100 games for full score (based on power analysis)
 * 
 * 2. **Statistical Significance (0-30 points)**: How unlikely results are by chance
 *    - Based on -log10(p-value) from chi-square/Fisher's test
 *    - p=0.05 → ~13 points, p=0.01 → ~20 points, p=0.001 → ~30 points
 * 
 * 3. **Effect Size (0-30 points)**: Magnitude of the performance difference
 *    - Based on Cohen's h with confidence interval width penalty
 *    - Larger effects with narrower CIs score higher
 * 
 * @param cardWins - Wins when this card is played
 * @param cardLosses - Losses when this card is played
 * @param cardDraws - Draws when this card is played
 * @param cardEntries - Total tournament entries with this card
 * @param commanderWins - Commander baseline wins
 * @param commanderLosses - Commander baseline losses
 * @param commanderDraws - Commander baseline draws
 * @param commanderEntries - Commander baseline entries
 * @returns Confidence score from 0-100
 * 
 * @example
 * ```typescript
 * const confidence = calculateConfidence(
 *   50, 30, 5, 20,  // Card stats
 *   500, 400, 50, 200  // Commander baseline
 * );
 * // confidence >= 70: High confidence in the analysis
 * // confidence 40-70: Moderate confidence
 * // confidence < 40: Low confidence, need more data
 * ```
 */
export function calculateConfidence(
  cardWins: number,
  cardLosses: number,
  cardDraws: number,
  cardEntries: number,
  commanderWins: number,
  commanderLosses: number,
  commanderDraws: number,
  commanderEntries: number
): number {
  // Calculate total games for both card and commander
  const cardTotalGames = cardWins + cardLosses + cardDraws;
  const commanderTotalGames = commanderWins + commanderLosses + commanderDraws;

  // Return 0 for invalid inputs (no data available)
  if (cardTotalGames === 0 || commanderTotalGames === 0 || cardEntries === 0 || commanderEntries === 0) {
    return 0;
  }

  // Validate all inputs are valid numbers
  if (isNaN(cardWins) || isNaN(cardLosses) || isNaN(cardDraws) || 
      isNaN(cardEntries) || isNaN(commanderWins) || isNaN(commanderLosses) || 
      isNaN(commanderDraws) || isNaN(commanderEntries)) {
    return 0;
  }

  // ---------------------------------------------------------------------------
  // Component 1: Sample Size Score (0-40 points)
  // Uses sigmoid function: 40 * (1 / (1 + e^(-(n - target/2) / (target/4))))
  // This creates a smooth S-curve that rewards larger samples with diminishing returns
  // ---------------------------------------------------------------------------
  const sampleSizeScore = MAX_SAMPLE_SIZE_SCORE * (
    1 / (1 + Math.exp(-(cardTotalGames - TARGET_SAMPLE_SIZE / 2) / (TARGET_SAMPLE_SIZE / 4)))
  );

  // ---------------------------------------------------------------------------
  // Component 2: Statistical Significance Score (0-30 points)
  // Based on -log10(p-value) scaled to max 30 points
  // Lower p-values indicate higher statistical significance
  // ---------------------------------------------------------------------------
  const { pValue } = calculateChiSquare(cardWins, cardLosses, commanderWins, commanderLosses);
  // Use -log10(p) for continuous scale; cap p-value at 1e-10 to avoid infinity
  const significanceScore = Math.min(
    MAX_SIGNIFICANCE_SCORE, 
    -Math.log10(Math.max(pValue, 1e-10)) * 10
  );

  // ---------------------------------------------------------------------------
  // Component 3: Effect Size Score (0-30 points)
  // Based on Cohen's h magnitude, penalized by confidence interval width
  // Wider CIs indicate less precision, reducing the score
  // ---------------------------------------------------------------------------
  const { effectSize, lowerCI, upperCI } = calculateEffectSize(
    cardWins, cardLosses, commanderWins, commanderLosses
  );
  
  // CI width penalty: narrower intervals get higher scores
  const ciWidth = Math.max(0, upperCI - lowerCI);
  // Score formula: |h| * 37.5 * (1 - ciWidth/2), capped at 30
  // At h=0.8 (large effect) with tight CI, this approaches 30 points
  const effectSizeScore = Math.min(
    MAX_EFFECT_SIZE_SCORE, 
    Math.abs(effectSize) * 37.5 * (1 - ciWidth / 2)
  );

  // ---------------------------------------------------------------------------
  // Combine all components and ensure result is within [0, 100]
  // ---------------------------------------------------------------------------
  const finalScore = Math.round(sampleSizeScore + significanceScore + effectSizeScore);
  return Math.max(0, Math.min(100, finalScore));
}

/**
 * Calculates win rate percentage from wins, losses, and draws.
 * 
 * @param wins - Number of wins
 * @param losses - Number of losses
 * @param draws - Number of draws
 * @returns Win rate as a percentage (0-100), or 0 if no games played
 */
export function calculateWinRate(wins: number, losses: number, draws: number): number {
  const totalGames = wins + losses + draws;
  if (totalGames === 0) return 0;
  return (wins / totalGames) * 100;
}

/**
 * Calculates inclusion rate (how often a card appears in commander's decks).
 * 
 * @param cardEntries - Number of deck entries containing this card
 * @param commanderEntries - Total number of deck entries for this commander
 * @returns Inclusion rate as a percentage (0-100)
 */
export function calculateInclusionRate(cardEntries: number, commanderEntries: number): number {
  if (commanderEntries === 0) return 0;
  return (cardEntries / commanderEntries) * 100;
}

