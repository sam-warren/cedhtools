/**
 * Unit Tests for Statistical Analysis Utilities
 * 
 * Tests cover:
 * - calculateEffectSize: Cohen's h calculation
 * - calculateChiSquare: Chi-square test and Fisher's Exact Test
 * - calculateConfidence: Composite confidence score
 * - calculateWinRate: Win rate percentage
 * - calculateInclusionRate: Card inclusion percentage
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEffectSize,
  calculateChiSquare,
  calculateConfidence,
  calculateWinRate,
  calculateInclusionRate,
  factorial,
  TARGET_SAMPLE_SIZE,
} from '../statistics';

// =============================================================================
// FACTORIAL TESTS
// =============================================================================

describe('factorial', () => {
  it('should return 1 for 0', () => {
    expect(factorial(0)).toBe(1);
  });

  it('should return 1 for 1', () => {
    expect(factorial(1)).toBe(1);
  });

  it('should calculate factorial correctly', () => {
    expect(factorial(5)).toBe(120);
    expect(factorial(10)).toBe(3628800);
  });

  it('should return 0 for negative numbers', () => {
    expect(factorial(-1)).toBe(0);
    expect(factorial(-5)).toBe(0);
  });
});

// =============================================================================
// EFFECT SIZE TESTS
// =============================================================================

describe('calculateEffectSize', () => {
  it('should return zero effect size when proportions are equal', () => {
    const result = calculateEffectSize(50, 50, 50, 50);
    expect(result.effectSize).toBeCloseTo(0, 2);
  });

  it('should return positive effect size when card performs better', () => {
    // Card has 70% win rate, commander has 50% win rate
    const result = calculateEffectSize(70, 30, 50, 50);
    expect(result.effectSize).toBeGreaterThan(0);
  });

  it('should return negative effect size when card performs worse', () => {
    // Card has 30% win rate, commander has 50% win rate
    const result = calculateEffectSize(30, 70, 50, 50);
    expect(result.effectSize).toBeLessThan(0);
  });

  it('should return zero when card total is zero', () => {
    const result = calculateEffectSize(0, 0, 50, 50);
    expect(result.effectSize).toBe(0);
    expect(result.lowerCI).toBe(0);
    expect(result.upperCI).toBe(0);
  });

  it('should return zero when commander total is zero', () => {
    const result = calculateEffectSize(50, 50, 0, 0);
    expect(result.effectSize).toBe(0);
  });

  it('should provide confidence intervals', () => {
    const result = calculateEffectSize(50, 30, 500, 400);
    expect(result.lowerCI).toBeLessThan(result.effectSize);
    expect(result.upperCI).toBeGreaterThan(result.effectSize);
  });

  it('should have narrower CI with larger sample sizes', () => {
    const smallSample = calculateEffectSize(10, 10, 10, 10);
    const largeSample = calculateEffectSize(100, 100, 100, 100);
    
    const smallWidth = smallSample.upperCI - smallSample.lowerCI;
    const largeWidth = largeSample.upperCI - largeSample.lowerCI;
    
    expect(largeWidth).toBeLessThan(smallWidth);
  });
});

// =============================================================================
// CHI-SQUARE TESTS
// =============================================================================

describe('calculateChiSquare', () => {
  it('should return pValue of 1 when totals are zero', () => {
    const result = calculateChiSquare(0, 0, 50, 50);
    expect(result.pValue).toBe(1);
    expect(result.chiSquare).toBe(0);
  });

  it('should return low p-value for significant differences', () => {
    // Very different proportions with large samples
    const result = calculateChiSquare(80, 20, 20, 80);
    expect(result.pValue).toBeLessThan(0.05);
    expect(result.chiSquare).toBeGreaterThan(0);
  });

  it('should return high p-value for similar proportions', () => {
    // Similar proportions
    const result = calculateChiSquare(50, 50, 48, 52);
    expect(result.pValue).toBeGreaterThan(0.05);
  });

  it('should use Fisher test for small samples', () => {
    // Small sample sizes (< 5 in any cell)
    const result = calculateChiSquare(3, 2, 4, 3);
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
  });

  it('should handle all zeros gracefully', () => {
    const result = calculateChiSquare(0, 0, 0, 0);
    expect(result.pValue).toBe(1);
    expect(result.chiSquare).toBe(0);
  });
});

// =============================================================================
// CONFIDENCE SCORE TESTS
// =============================================================================

describe('calculateConfidence', () => {
  it('should return 0 when card has no games', () => {
    const result = calculateConfidence(0, 0, 0, 0, 100, 80, 20, 50);
    expect(result).toBe(0);
  });

  it('should return 0 when commander has no games', () => {
    const result = calculateConfidence(50, 30, 10, 20, 0, 0, 0, 0);
    expect(result).toBe(0);
  });

  it('should return 0 when card has no entries', () => {
    const result = calculateConfidence(50, 30, 10, 0, 100, 80, 20, 50);
    expect(result).toBe(0);
  });

  it('should return 0 when commander has no entries', () => {
    const result = calculateConfidence(50, 30, 10, 20, 100, 80, 20, 0);
    expect(result).toBe(0);
  });

  it('should return value between 0 and 100', () => {
    const result = calculateConfidence(50, 30, 10, 20, 500, 400, 100, 200);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should increase with larger sample sizes', () => {
    const smallSample = calculateConfidence(5, 3, 1, 2, 50, 40, 10, 20);
    const largeSample = calculateConfidence(50, 30, 10, 20, 500, 400, 100, 200);
    
    expect(largeSample).toBeGreaterThan(smallSample);
  });

  it('should be higher for statistically significant differences', () => {
    // Very different win rates
    const significant = calculateConfidence(80, 20, 10, 50, 40, 60, 10, 100);
    // Similar win rates
    const notSignificant = calculateConfidence(50, 45, 5, 50, 48, 47, 5, 100);
    
    expect(significant).toBeGreaterThan(notSignificant);
  });

  it('should handle NaN inputs gracefully', () => {
    const result = calculateConfidence(NaN, 30, 10, 20, 100, 80, 20, 50);
    expect(result).toBe(0);
  });

  it('should be an integer', () => {
    const result = calculateConfidence(50, 30, 10, 20, 500, 400, 100, 200);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// =============================================================================
// WIN RATE TESTS
// =============================================================================

describe('calculateWinRate', () => {
  it('should return 0 when no games played', () => {
    expect(calculateWinRate(0, 0, 0)).toBe(0);
  });

  it('should return 100 for all wins', () => {
    expect(calculateWinRate(10, 0, 0)).toBe(100);
  });

  it('should return 0 for all losses', () => {
    expect(calculateWinRate(0, 10, 0)).toBe(0);
  });

  it('should calculate correct percentage', () => {
    expect(calculateWinRate(50, 30, 20)).toBe(50);
    expect(calculateWinRate(3, 1, 0)).toBe(75);
  });

  it('should include draws in total games', () => {
    // 2 wins out of 4 total games (2 wins, 1 loss, 1 draw) = 50%
    expect(calculateWinRate(2, 1, 1)).toBe(50);
  });
});

// =============================================================================
// INCLUSION RATE TESTS
// =============================================================================

describe('calculateInclusionRate', () => {
  it('should return 0 when commander has no entries', () => {
    expect(calculateInclusionRate(10, 0)).toBe(0);
  });

  it('should return 100 when card is in all entries', () => {
    expect(calculateInclusionRate(100, 100)).toBe(100);
  });

  it('should calculate correct percentage', () => {
    expect(calculateInclusionRate(50, 100)).toBe(50);
    expect(calculateInclusionRate(25, 100)).toBe(25);
  });

  it('should handle partial inclusion', () => {
    expect(calculateInclusionRate(1, 3)).toBeCloseTo(33.33, 1);
  });
});

// =============================================================================
// EDGE CASES AND INTEGRATION
// =============================================================================

describe('edge cases', () => {
  it('should handle very large numbers', () => {
    const result = calculateConfidence(
      10000, 8000, 1000, 5000,
      50000, 40000, 5000, 20000
    );
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should handle floating point precision', () => {
    // Use numbers that could cause floating point issues
    const result = calculateWinRate(1, 2, 0);
    expect(result).toBeCloseTo(33.33, 1);
  });

  it('should produce consistent results', () => {
    // Same inputs should produce same outputs
    const result1 = calculateConfidence(50, 30, 10, 20, 500, 400, 100, 200);
    const result2 = calculateConfidence(50, 30, 10, 20, 500, 400, 100, 200);
    expect(result1).toBe(result2);
  });
});

// =============================================================================
// CONSTANTS VALIDATION
// =============================================================================

describe('constants', () => {
  it('TARGET_SAMPLE_SIZE should be a reasonable value', () => {
    expect(TARGET_SAMPLE_SIZE).toBeGreaterThan(0);
    expect(TARGET_SAMPLE_SIZE).toBeLessThan(1000);
  });
});

