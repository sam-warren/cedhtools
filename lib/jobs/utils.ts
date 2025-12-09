/**
 * Shared utilities for job processing
 * Used by both CLI scripts and Edge Functions
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/types';

// ============================================
// Configuration
// ============================================

export const PAGE_SIZE = 1000;
export const BATCH_SIZE = 500;

// ============================================
// Supabase Admin Client
// ============================================

export type SupabaseAdmin = SupabaseClient<Database>;

/**
 * Create a Supabase client with service role key for admin operations.
 * Works in both Node.js (scripts) and Deno (Edge Functions) environments.
 */
export function createSupabaseAdmin(): SupabaseAdmin {
  // Support both Node.js and Deno environments
  const supabaseUrl = typeof Deno !== 'undefined' 
    ? Deno.env.get('SUPABASE_URL') 
    : process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  const supabaseKey = typeof Deno !== 'undefined'
    ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables (SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey);
}

// ============================================
// Text Normalization
// ============================================

/**
 * Normalize text by replacing special characters with ASCII equivalents.
 * 
 * This prevents duplicate database records caused by inconsistent character encoding
 * from different data sources. For example:
 * - "Thassa's Oracle" (straight apostrophe from one source)
 * - "Thassa's Oracle" (curly apostrophe from another source)
 */
export function normalizeText(text: string): string {
  return text
    // Normalize apostrophes (curly to straight)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Normalize quotes (curly to straight)
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Normalize dashes (em/en dash to hyphen)
    .replace(/[\u2013\u2014]/g, '-')
    // Normalize ellipsis
    .replace(/\u2026/g, '...')
    // Trim whitespace
    .trim();
}

/**
 * Extract front face name from a card name (for DFC lookup)
 */
export function getFrontFaceName(name: string): string {
  if (name.includes(' // ')) {
    return name.split(' // ')[0].trim();
  }
  return name;
}

/**
 * Check if this is a DFC name (contains " // ")
 */
export function isDFCName(name: string): boolean {
  return name.includes(' // ');
}

// ============================================
// Date Utilities
// ============================================

/**
 * Get the Monday of the week for a given date (UTC-based).
 */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}

// ============================================
// Progress Tracking
// ============================================

export interface ProgressLogger {
  log: (message: string) => void;
  startPhase: (name: string, totalItems?: number) => void;
  update: (processed: number) => void;
  increment: (count?: number) => void;
  endPhase: () => void;
  getStats: () => { elapsed: number; processed: number; total: number };
}

/**
 * Create a progress tracker for logging job progress.
 * Uses console.log by default but can be configured for Edge Functions.
 */
export function createProgressLogger(
  logFn: (message: string) => void = console.log
): ProgressLogger {
  let startTime = Date.now();
  let phaseStartTime = Date.now();
  let totalItems = 0;
  let processedItems = 0;
  let phaseName = '';

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return {
    log: logFn,

    startPhase(name: string, total?: number): void {
      phaseName = name;
      totalItems = total ?? 0;
      processedItems = 0;
      phaseStartTime = Date.now();
      logFn(`Starting: ${name}${total ? ` (${total} items)` : ''}`);
    },

    update(processed: number): void {
      processedItems = processed;
    },

    increment(count: number = 1): void {
      processedItems += count;
    },

    endPhase(): void {
      const elapsed = formatDuration(Date.now() - phaseStartTime);
      logFn(`Completed: ${phaseName} - ${processedItems} items in ${elapsed}`);
    },

    getStats(): { elapsed: number; processed: number; total: number } {
      return {
        elapsed: Date.now() - startTime,
        processed: processedItems,
        total: totalItems,
      };
    },
  };
}

// ============================================
// Job Result Types
// ============================================

export interface SyncStats {
  tournamentsProcessed: number;
  tournamentsSkipped: number;
  playersCreated: number;
  commandersCreated: number;
  cardsCreated: number;
  entriesCreated: number;
  gamesCreated: number;
  errors: string[];
}

export interface EnrichmentStats {
  cardsEnriched: number;
  cardsNotFound: number;
  commandersEnriched: number;
  tournamentsEnriched: number;
  decklistsValidated: number;
  decklistsValid: number;
  decklistsInvalid: number;
  decklistsSkipped: number;
}

export interface AggregationStats {
  commanderWeeklyStats: number;
  cardCommanderWeeklyStats: number;
  seatPositionWeeklyStats: number;
}

export interface DailyUpdateResult {
  success: boolean;
  sync: SyncStats;
  enrich: EnrichmentStats;
  aggregate: AggregationStats;
  totalDurationMs: number;
  errors: string[];
}

// Type guard for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
} | undefined;

