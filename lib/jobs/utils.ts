/**
 * Shared utilities for job processing
 * Used by both CLI scripts and Edge Functions
 */

// Import utilities for local use
import { formatDuration, formatBytes } from "../utils/date";

// Re-export admin client from db module
export { createSupabaseAdmin, type SupabaseAdmin } from "../db/admin";

// Re-export shared utilities
export {
  normalizeText,
  getFrontFaceName,
  isDFCName,
} from "../utils/text";

export {
  getWeekStart,
  formatDuration,
  formatBytes,
} from "../utils/date";

// ============================================
// Configuration
// ============================================

export const PAGE_SIZE = 1000;
export const BATCH_SIZE = 500;

// ============================================
// Progress Tracking - Enterprise Grade
// ============================================

export interface ProgressLogger {
  log: (message: string) => void;
  debug: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  startPhase: (name: string, totalItems?: number) => void;
  update: (processed: number) => void;
  increment: (count?: number) => void;
  endPhase: () => void;
  getStats: () => { elapsed: number; processed: number; total: number };
  // Enterprise logging methods
  logTournamentStart: (name: string, tid: string, size: number, weekIdx: number, totalWeeks: number) => void;
  logTournamentProgress: (name: string, phase: string, detail: string) => void;
  logTournamentComplete: (name: string, tid: string, entries: number, games: number, durationMs: number) => void;
  logWeekSummary: (weekLabel: string, weekIdx: number, totalWeeks: number, processed: number, skipped: number, errors: number, durationMs: number) => void;
  logMemory: () => void;
  getETA: () => string;
  formatNumber: (n: number) => string;
}

/**
 * Create an enterprise-grade progress tracker with detailed telemetry.
 * Provides ETA calculations, memory monitoring, and structured logging.
 */
export function createProgressLogger(
  logFn: (message: string) => void = console.log
): ProgressLogger {
  const jobStartTime = Date.now();
  let phaseStartTime = Date.now();
  let totalItems = 0;
  let processedItems = 0;
  let phaseName = '';
  
  // Rate tracking for ETA
  const processingTimes: number[] = [];
  let lastProcessedTime = Date.now();

  const formatNumber = (n: number): string => {
    return n.toLocaleString('en-US');
  };

  const getMemoryUsage = (): { heap: string; rss: string; external: string } => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      return {
        heap: formatBytes(mem.heapUsed),
        rss: formatBytes(mem.rss),
        external: formatBytes(mem.external),
      };
    }
    return { heap: 'N/A', rss: 'N/A', external: 'N/A' };
  };

  const calculateETA = (): string => {
    if (processedItems === 0 || totalItems === 0) return 'calculating...';
    if (processedItems >= totalItems) return 'complete';
    
    // Use recent processing times for more accurate ETA
    const recentTimes = processingTimes.slice(-10);
    if (recentTimes.length === 0) return 'calculating...';
    
    const avgTimePerItem = recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
    const remainingItems = totalItems - processedItems;
    const remainingMs = remainingItems * avgTimePerItem;
    
    return formatDuration(remainingMs);
  };

  const getProgressBar = (current: number, total: number, width: number = 20): string => {
    if (total === 0) return '░'.repeat(width);
    const progress = Math.min(current / total, 1);
    const filled = Math.round(progress * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  const timestamp = (): string => {
    return new Date().toISOString();
  };

  return {
    log: (message: string) => logFn(`[${timestamp()}] ℹ️  ${message}`),
    debug: (message: string) => logFn(`[${timestamp()}] 🔍 ${message}`),
    warn: (message: string) => logFn(`[${timestamp()}] ⚠️  ${message}`),
    error: (message: string) => logFn(`[${timestamp()}] ❌ ${message}`),

    formatNumber,

    startPhase(name: string, total?: number): void {
      phaseName = name;
      totalItems = total ?? 0;
      processedItems = 0;
      phaseStartTime = Date.now();
      processingTimes.length = 0;
      lastProcessedTime = Date.now();
      
      const mem = getMemoryUsage();
      logFn(`[${timestamp()}] 🚀 ══════════════════════════════════════════════════════════════`);
      logFn(`[${timestamp()}] 🚀 PHASE START: ${name}`);
      if (total) {
        logFn(`[${timestamp()}] 🚀 Total items: ${formatNumber(total)}`);
      }
      logFn(`[${timestamp()}] 🚀 Memory: heap=${mem.heap}, rss=${mem.rss}`);
      logFn(`[${timestamp()}] 🚀 ══════════════════════════════════════════════════════════════`);
    },

    update(processed: number): void {
      const now = Date.now();
      if (processedItems > 0) {
        processingTimes.push(now - lastProcessedTime);
      }
      processedItems = processed;
      lastProcessedTime = now;
    },

    increment(count: number = 1): void {
      const now = Date.now();
      processingTimes.push(now - lastProcessedTime);
      processedItems += count;
      lastProcessedTime = now;
    },

    endPhase(): void {
      const elapsed = Date.now() - phaseStartTime;
      const rate = processedItems > 0 ? (processedItems / (elapsed / 1000)).toFixed(2) : '0';
      const mem = getMemoryUsage();
      
      logFn(`[${timestamp()}] ✅ ══════════════════════════════════════════════════════════════`);
      logFn(`[${timestamp()}] ✅ PHASE COMPLETE: ${phaseName}`);
      logFn(`[${timestamp()}] ✅ Processed: ${formatNumber(processedItems)} items in ${formatDuration(elapsed)}`);
      logFn(`[${timestamp()}] ✅ Rate: ${rate} items/sec`);
      logFn(`[${timestamp()}] ✅ Memory: heap=${mem.heap}, rss=${mem.rss}`);
      logFn(`[${timestamp()}] ✅ ══════════════════════════════════════════════════════════════`);
    },

    getStats(): { elapsed: number; processed: number; total: number } {
      return {
        elapsed: Date.now() - jobStartTime,
        processed: processedItems,
        total: totalItems,
      };
    },

    logTournamentStart(name: string, tid: string, size: number, weekIdx: number, totalWeeks: number): void {
      const progress = totalItems > 0 ? ((processedItems / totalItems) * 100).toFixed(1) : '0';
      const bar = getProgressBar(processedItems, totalItems, 15);
      logFn(`[${timestamp()}] 🏆 ┌─ TOURNAMENT: ${name}`);
      logFn(`[${timestamp()}] 🏆 │  TID: ${tid}`);
      logFn(`[${timestamp()}] 🏆 │  Size: ${size} players`);
      logFn(`[${timestamp()}] 🏆 │  Week: ${weekIdx + 1}/${totalWeeks} | Overall: [${bar}] ${progress}%`);
      logFn(`[${timestamp()}] 🏆 │  ETA: ${calculateETA()}`);
    },

    logTournamentProgress(name: string, phase: string, detail: string): void {
      logFn(`[${timestamp()}] 🏆 │  └─ ${phase}: ${detail}`);
    },

    logTournamentComplete(name: string, tid: string, entries: number, games: number, durationMs: number): void {
      logFn(`[${timestamp()}] 🏆 └─ DONE: ${entries} entries, ${games} games in ${formatDuration(durationMs)}`);
    },

    logWeekSummary(weekLabel: string, weekIdx: number, totalWeeks: number, processed: number, skipped: number, errors: number, durationMs: number): void {
      const rate = processed > 0 ? (processed / (durationMs / 1000)).toFixed(2) : '0';
      const mem = getMemoryUsage();
      const weekProgress = ((weekIdx + 1) / totalWeeks * 100).toFixed(0);
      
      logFn(`[${timestamp()}] 📅 ────────────────────────────────────────────────────────────────`);
      logFn(`[${timestamp()}] 📅 WEEK COMPLETE: ${weekLabel}`);
      logFn(`[${timestamp()}] 📅 Progress: Week ${weekIdx + 1}/${totalWeeks} (${weekProgress}%)`);
      logFn(`[${timestamp()}] 📅 Tournaments: ${processed} processed, ${skipped} skipped, ${errors} errors`);
      logFn(`[${timestamp()}] 📅 Duration: ${formatDuration(durationMs)} | Rate: ${rate} tournaments/sec`);
      logFn(`[${timestamp()}] 📅 ETA remaining: ${calculateETA()}`);
      logFn(`[${timestamp()}] 📅 Memory: heap=${mem.heap}, rss=${mem.rss}, external=${mem.external}`);
      logFn(`[${timestamp()}] 📅 ────────────────────────────────────────────────────────────────`);
    },

    logMemory(): void {
      const mem = getMemoryUsage();
      logFn(`[${timestamp()}] 💾 Memory: heap=${mem.heap}, rss=${mem.rss}, external=${mem.external}`);
    },

    getETA(): string {
      return calculateETA();
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

