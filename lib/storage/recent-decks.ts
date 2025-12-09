/**
 * Recent Decks Storage
 * 
 * Stores recently analyzed decks in localStorage for quick access.
 * Also caches analysis results for instant loading.
 */

import type { AnalysisResponse } from "@/components/analyze/analysis-results";

export interface RecentDeck {
  id: string;
  commanderName: string;
  commanderId: number;
  colorId: string;
  decklistPreview: string; // First few card names for preview
  cardCount: number;
  timestamp: number;
  decklist: string; // Full decklist for re-analysis
}

export interface StoredAnalysis {
  deck: RecentDeck;
  analysis: AnalysisResponse;
  analyzedAt: number;
}

const STORAGE_KEY = "cedhtools_recent_decks";
const ANALYSIS_STORAGE_KEY = "cedhtools_deck_analyses";
const MAX_RECENT_DECKS = 10;

/**
 * Generate a unique ID for a deck based on commander and decklist hash
 */
export function generateDeckId(commanderName: string, decklist: string): string {
  // Simple hash based on commander + first 100 chars of decklist
  const content = `${commanderName}:${decklist.slice(0, 100)}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get all recent decks from localStorage
 */
export function getRecentDecks(): RecentDeck[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const decks = JSON.parse(stored) as RecentDeck[];
    // Sort by most recent first
    return decks.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

/**
 * Get a single deck by ID
 */
export function getDeckById(id: string): RecentDeck | null {
  const decks = getRecentDecks();
  return decks.find(d => d.id === id) || null;
}

/**
 * Save a deck to recent decks
 */
export function saveRecentDeck(
  commanderName: string,
  commanderId: number,
  colorId: string,
  decklist: string,
  cardNames: string[]
): string {
  if (typeof window === "undefined") return "";
  
  try {
    const decks = getRecentDecks();
    const id = generateDeckId(commanderName, decklist);
    
    // Create preview from first few card names
    const decklistPreview = cardNames.slice(0, 3).join(", ") + 
      (cardNames.length > 3 ? "..." : "");
    
    const newDeck: RecentDeck = {
      id,
      commanderName,
      commanderId,
      colorId,
      decklistPreview,
      cardCount: cardNames.length,
      timestamp: Date.now(),
      decklist,
    };
    
    // Remove existing entry for same deck (to update timestamp)
    const filteredDecks = decks.filter(d => d.id !== id);
    
    // Add new deck at the beginning
    const updatedDecks = [newDeck, ...filteredDecks].slice(0, MAX_RECENT_DECKS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDecks));
    
    return id;
  } catch (error) {
    console.error("Failed to save recent deck:", error);
    return "";
  }
}

/**
 * Save analysis results for a deck
 */
export function saveAnalysis(deckId: string, analysis: AnalysisResponse): void {
  if (typeof window === "undefined") return;
  
  try {
    const analyses = getAllAnalyses();
    analyses[deckId] = {
      analysis,
      analyzedAt: Date.now(),
    };
    
    // Clean up old analyses (keep only those with matching decks)
    const recentDeckIds = new Set(getRecentDecks().map(d => d.id));
    const cleanedAnalyses: Record<string, { analysis: AnalysisResponse; analyzedAt: number }> = {};
    
    for (const [id, data] of Object.entries(analyses)) {
      if (recentDeckIds.has(id)) {
        cleanedAnalyses[id] = data;
      }
    }
    
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(cleanedAnalyses));
  } catch (error) {
    console.error("Failed to save analysis:", error);
  }
}

/**
 * Get analysis results for a deck
 */
export function getAnalysis(deckId: string): AnalysisResponse | null {
  if (typeof window === "undefined") return null;
  
  try {
    const analyses = getAllAnalyses();
    return analyses[deckId]?.analysis || null;
  } catch {
    return null;
  }
}

/**
 * Get all stored analyses
 */
function getAllAnalyses(): Record<string, { analysis: AnalysisResponse; analyzedAt: number }> {
  try {
    const stored = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Remove a deck and its analysis from storage
 */
export function removeRecentDeck(id: string): void {
  if (typeof window === "undefined") return;
  
  try {
    // Remove from decks
    const decks = getRecentDecks();
    const filteredDecks = decks.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDecks));
    
    // Remove analysis
    const analyses = getAllAnalyses();
    delete analyses[id];
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analyses));
  } catch (error) {
    console.error("Failed to remove recent deck:", error);
  }
}

/**
 * Clear all recent decks and analyses
 */
export function clearRecentDecks(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ANALYSIS_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear recent decks:", error);
  }
}

// Re-export formatRelativeTime from utils for convenience
export { formatRelativeTime } from "@/lib/utils/date";
