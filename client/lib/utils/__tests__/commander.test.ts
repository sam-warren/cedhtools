/**
 * Unit Tests for Commander Utilities
 * 
 * Tests cover:
 * - generateCommanderId: Consistent ID generation
 * - generateCommanderName: Human-readable names
 * - isPartnerPair: Partner detection
 * - getIndividualCommanderIds: ID extraction
 */

import { describe, it, expect } from 'vitest';
import {
  generateCommanderId,
  generateCommanderName,
  isPartnerPair,
  getIndividualCommanderIds,
} from '../commander';
import type { MoxfieldCardEntry } from '@/lib/etl/types';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

function createCardEntry(uniqueCardId: string, name: string): MoxfieldCardEntry {
  return {
    quantity: 1,
    card: {
      uniqueCardId,
      name,
    },
  };
}

// =============================================================================
// GENERATE COMMANDER ID TESTS
// =============================================================================

describe('generateCommanderId', () => {
  it('should return single ID for single commander', () => {
    const commanders = [
      createCardEntry('kinnan-123', 'Kinnan, Bonder Prodigy'),
    ];
    
    expect(generateCommanderId(commanders)).toBe('kinnan-123');
  });

  it('should concatenate partner IDs with underscore', () => {
    const commanders = [
      createCardEntry('thrasios-456', 'Thrasios, Triton Hero'),
      createCardEntry('tymna-789', 'Tymna the Weaver'),
    ];
    
    const result = generateCommanderId(commanders);
    expect(result).toContain('_');
    expect(result.split('_')).toHaveLength(2);
  });

  it('should sort IDs alphabetically for consistency', () => {
    const commanders1 = [
      createCardEntry('zzz', 'Commander Z'),
      createCardEntry('aaa', 'Commander A'),
    ];
    
    const commanders2 = [
      createCardEntry('aaa', 'Commander A'),
      createCardEntry('zzz', 'Commander Z'),
    ];
    
    expect(generateCommanderId(commanders1)).toBe(generateCommanderId(commanders2));
    expect(generateCommanderId(commanders1)).toBe('aaa_zzz');
  });

  it('should handle empty arrays', () => {
    expect(generateCommanderId([])).toBe('');
  });

  it('should handle undefined uniqueCardId', () => {
    const commanders = [
      {
        quantity: 1,
        card: {
          uniqueCardId: undefined as unknown as string,
          name: 'Test Commander',
        },
      },
    ];
    
    expect(generateCommanderId(commanders)).toBe('');
  });

  it('should produce deterministic results', () => {
    const commanders = [
      createCardEntry('id-1', 'Commander 1'),
      createCardEntry('id-2', 'Commander 2'),
    ];
    
    const result1 = generateCommanderId(commanders);
    const result2 = generateCommanderId(commanders);
    
    expect(result1).toBe(result2);
  });

  it('should handle special characters in IDs', () => {
    const commanders = [
      createCardEntry('id_with-special_chars-123', 'Special Commander'),
    ];
    
    expect(generateCommanderId(commanders)).toBe('id_with-special_chars-123');
  });

  it('should handle three or more partners (edge case)', () => {
    const commanders = [
      createCardEntry('ccc', 'Commander C'),
      createCardEntry('aaa', 'Commander A'),
      createCardEntry('bbb', 'Commander B'),
    ];
    
    expect(generateCommanderId(commanders)).toBe('aaa_bbb_ccc');
  });
});

// =============================================================================
// GENERATE COMMANDER NAME TESTS
// =============================================================================

describe('generateCommanderName', () => {
  it('should return single name for single commander', () => {
    const commanders = [
      createCardEntry('kinnan-123', 'Kinnan, Bonder Prodigy'),
    ];
    
    expect(generateCommanderName(commanders)).toBe('Kinnan, Bonder Prodigy');
  });

  it('should join partner names with " + "', () => {
    const commanders = [
      createCardEntry('thrasios-456', 'Thrasios, Triton Hero'),
      createCardEntry('tymna-789', 'Tymna the Weaver'),
    ];
    
    expect(generateCommanderName(commanders)).toBe('Thrasios, Triton Hero + Tymna the Weaver');
  });

  it('should NOT sort names (preserve order)', () => {
    const commanders1 = [
      createCardEntry('zzz', 'Commander Z'),
      createCardEntry('aaa', 'Commander A'),
    ];
    
    const commanders2 = [
      createCardEntry('aaa', 'Commander A'),
      createCardEntry('zzz', 'Commander Z'),
    ];
    
    // Names should be in different order
    expect(generateCommanderName(commanders1)).toBe('Commander Z + Commander A');
    expect(generateCommanderName(commanders2)).toBe('Commander A + Commander Z');
  });

  it('should handle empty arrays', () => {
    expect(generateCommanderName([])).toBe('');
  });

  it('should use "Unknown Commander" for missing names', () => {
    const commanders = [
      {
        quantity: 1,
        card: {
          uniqueCardId: 'test-123',
          name: undefined as unknown as string,
        },
      },
    ];
    
    expect(generateCommanderName(commanders)).toBe('Unknown Commander');
  });

  it('should handle commanders with commas in names', () => {
    const commanders = [
      createCardEntry('id-1', 'Thrasios, Triton Hero'),
      createCardEntry('id-2', 'Tymna the Weaver'),
    ];
    
    const result = generateCommanderName(commanders);
    expect(result).toContain('Thrasios, Triton Hero');
    expect(result).toContain(' + ');
  });
});

// =============================================================================
// IS PARTNER PAIR TESTS
// =============================================================================

describe('isPartnerPair', () => {
  it('should return false for single commander ID', () => {
    expect(isPartnerPair('kinnan-123')).toBe(false);
  });

  it('should return true for partner pair ID', () => {
    expect(isPartnerPair('thrasios_tymna')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isPartnerPair('')).toBe(false);
  });

  it('should return true for IDs with hyphens (common format)', () => {
    // Hyphens within IDs are fine, underscores separate partners
    expect(isPartnerPair('thrasios-123_tymna-456')).toBe(true);
  });

  it('should handle edge case of single underscore', () => {
    expect(isPartnerPair('_')).toBe(true);
  });
});

// =============================================================================
// GET INDIVIDUAL COMMANDER IDS TESTS
// =============================================================================

describe('getIndividualCommanderIds', () => {
  it('should return single-item array for single commander', () => {
    const result = getIndividualCommanderIds('kinnan-123');
    expect(result).toEqual(['kinnan-123']);
    expect(result).toHaveLength(1);
  });

  it('should return two-item array for partner pair', () => {
    const result = getIndividualCommanderIds('thrasios_tymna');
    expect(result).toEqual(['thrasios', 'tymna']);
    expect(result).toHaveLength(2);
  });

  it('should handle empty string', () => {
    expect(getIndividualCommanderIds('')).toEqual(['']);
  });

  it('should handle IDs with hyphens', () => {
    const result = getIndividualCommanderIds('thrasios-123_tymna-456');
    expect(result).toEqual(['thrasios-123', 'tymna-456']);
  });

  it('should handle multiple underscores (edge case)', () => {
    const result = getIndividualCommanderIds('a_b_c');
    expect(result).toEqual(['a', 'b', 'c']);
    expect(result).toHaveLength(3);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('integration', () => {
  it('should produce consistent roundtrip for partner detection', () => {
    const commanders = [
      createCardEntry('thrasios', 'Thrasios, Triton Hero'),
      createCardEntry('tymna', 'Tymna the Weaver'),
    ];
    
    const id = generateCommanderId(commanders);
    expect(isPartnerPair(id)).toBe(true);
    
    const individualIds = getIndividualCommanderIds(id);
    expect(individualIds).toHaveLength(2);
    expect(individualIds).toContain('thrasios');
    expect(individualIds).toContain('tymna');
  });

  it('should be consistent across multiple calls', () => {
    const commanders = [
      createCardEntry('id-2', 'Second'),
      createCardEntry('id-1', 'First'),
    ];
    
    // Multiple calls should produce same results
    const ids = Array.from({ length: 10 }, () => generateCommanderId(commanders));
    const names = Array.from({ length: 10 }, () => generateCommanderName(commanders));
    
    expect(new Set(ids).size).toBe(1); // All same
    expect(new Set(names).size).toBe(1); // All same
  });

  it('should handle real-world commander examples', () => {
    // Thrasios + Tymna (popular partner pair)
    const thrasiosTymna = [
      createCardEntry('9d-thrasios', 'Thrasios, Triton Hero'),
      createCardEntry('8f-tymna', 'Tymna the Weaver'),
    ];
    
    const id = generateCommanderId(thrasiosTymna);
    const name = generateCommanderName(thrasiosTymna);
    
    expect(id).toBe('8f-tymna_9d-thrasios'); // Sorted alphabetically
    expect(name).toBe('Thrasios, Triton Hero + Tymna the Weaver'); // Original order
  });
});

