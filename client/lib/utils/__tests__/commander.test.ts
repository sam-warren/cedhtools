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
import type { TopdeckCardEntry } from '@/lib/types/etl';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

function createCommanderRecord(commanders: Record<string, { id: string }>): Record<string, TopdeckCardEntry> {
  const result: Record<string, TopdeckCardEntry> = {};
  for (const [name, entry] of Object.entries(commanders)) {
    result[name] = { id: entry.id, count: 1 };
  }
  return result;
}

// =============================================================================
// GENERATE COMMANDER ID TESTS
// =============================================================================

describe('generateCommanderId', () => {
  it('should return single ID for single commander', () => {
    const commanders = createCommanderRecord({
      'Kinnan, Bonder Prodigy': { id: 'kinnan-123' }
    });
    
    expect(generateCommanderId(commanders)).toBe('kinnan-123');
  });

  it('should concatenate partner IDs with underscore', () => {
    const commanders = createCommanderRecord({
      'Thrasios, Triton Hero': { id: 'thrasios-456' },
      'Tymna the Weaver': { id: 'tymna-789' }
    });
    
    const result = generateCommanderId(commanders);
    expect(result).toContain('_');
    expect(result.split('_')).toHaveLength(2);
  });

  it('should sort IDs alphabetically for consistency', () => {
    const commanders1 = createCommanderRecord({
      'Commander Z': { id: 'zzz' },
      'Commander A': { id: 'aaa' }
    });
    
    const commanders2 = createCommanderRecord({
      'Commander A': { id: 'aaa' },
      'Commander Z': { id: 'zzz' }
    });
    
    expect(generateCommanderId(commanders1)).toBe(generateCommanderId(commanders2));
    expect(generateCommanderId(commanders1)).toBe('aaa_zzz');
  });

  it('should handle empty objects', () => {
    expect(generateCommanderId({})).toBe('');
  });

  it('should produce deterministic results', () => {
    const commanders = createCommanderRecord({
      'Commander 1': { id: 'id-1' },
      'Commander 2': { id: 'id-2' }
    });
    
    const result1 = generateCommanderId(commanders);
    const result2 = generateCommanderId(commanders);
    
    expect(result1).toBe(result2);
  });

  it('should handle special characters in IDs', () => {
    const commanders = createCommanderRecord({
      'Special Commander': { id: 'id_with-special_chars-123' }
    });
    
    expect(generateCommanderId(commanders)).toBe('id_with-special_chars-123');
  });

  it('should handle three or more partners (edge case)', () => {
    const commanders = createCommanderRecord({
      'Commander C': { id: 'ccc' },
      'Commander A': { id: 'aaa' },
      'Commander B': { id: 'bbb' }
    });
    
    expect(generateCommanderId(commanders)).toBe('aaa_bbb_ccc');
  });
});

// =============================================================================
// GENERATE COMMANDER NAME TESTS
// =============================================================================

describe('generateCommanderName', () => {
  it('should return single name for single commander', () => {
    const commanders = createCommanderRecord({
      'Kinnan, Bonder Prodigy': { id: 'kinnan-123' }
    });
    
    expect(generateCommanderName(commanders)).toBe('Kinnan, Bonder Prodigy');
  });

  it('should join partner names with " + "', () => {
    const commanders = createCommanderRecord({
      'Thrasios, Triton Hero': { id: 'thrasios-456' },
      'Tymna the Weaver': { id: 'tymna-789' }
    });
    
    const result = generateCommanderName(commanders);
    expect(result).toContain(' + ');
  });

  it('should sort names alphabetically for consistency', () => {
    const commanders = createCommanderRecord({
      'Commander Z': { id: 'zzz' },
      'Commander A': { id: 'aaa' }
    });
    
    // Names should be sorted alphabetically
    expect(generateCommanderName(commanders)).toBe('Commander A + Commander Z');
  });

  it('should handle empty objects', () => {
    expect(generateCommanderName({})).toBe('');
  });

  it('should handle commanders with commas in names', () => {
    const commanders = createCommanderRecord({
      'Thrasios, Triton Hero': { id: 'id-1' },
      'Tymna the Weaver': { id: 'id-2' }
    });
    
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
    const commanders = createCommanderRecord({
      'Thrasios, Triton Hero': { id: 'thrasios' },
      'Tymna the Weaver': { id: 'tymna' }
    });
    
    const id = generateCommanderId(commanders);
    expect(isPartnerPair(id)).toBe(true);
    
    const individualIds = getIndividualCommanderIds(id);
    expect(individualIds).toHaveLength(2);
    expect(individualIds).toContain('thrasios');
    expect(individualIds).toContain('tymna');
  });

  it('should be consistent across multiple calls', () => {
    const commanders = createCommanderRecord({
      'Second': { id: 'id-2' },
      'First': { id: 'id-1' }
    });
    
    // Multiple calls should produce same results
    const ids = Array.from({ length: 10 }, () => generateCommanderId(commanders));
    const names = Array.from({ length: 10 }, () => generateCommanderName(commanders));
    
    expect(new Set(ids).size).toBe(1); // All same
    expect(new Set(names).size).toBe(1); // All same
  });

  it('should handle real-world commander examples', () => {
    // Thrasios + Tymna (popular partner pair)
    const thrasiosTymna = createCommanderRecord({
      'Thrasios, Triton Hero': { id: '9d-thrasios' },
      'Tymna the Weaver': { id: '8f-tymna' }
    });
    
    const id = generateCommanderId(thrasiosTymna);
    const name = generateCommanderName(thrasiosTymna);
    
    expect(id).toBe('8f-tymna_9d-thrasios'); // Sorted alphabetically
    expect(name).toBe('Thrasios, Triton Hero + Tymna the Weaver'); // Sorted alphabetically
  });
});
