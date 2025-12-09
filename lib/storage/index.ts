/**
 * Client-side storage utilities
 *
 * Re-exports all storage functions for convenient imports.
 */

export {
  type RecentDeck,
  type StoredAnalysis,
  generateDeckId,
  getRecentDecks,
  getDeckById,
  saveRecentDeck,
  saveAnalysis,
  getAnalysis,
  removeRecentDeck,
  clearRecentDecks,
  formatRelativeTime,
} from "./recent-decks";

