"use client";

import type {
    CardCommanderStats,
    CardDetail,
    CommanderCardsResponse,
    CommanderDetail,
    CommanderTopPlayersResponse,
    SeatPositionResponse,
    TimePeriod
} from "@/types/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

// ============================================
// Query Keys - Centralized for cache management
// ============================================
export const queryKeys = {
  // Commander queries
  commanders: {
    all: ["commanders"] as const,
    list: (filters: Record<string, unknown>) => ["commanders", "list", filters] as const,
    detail: (name: string, timePeriod: TimePeriod) => ["commanders", "detail", name, timePeriod] as const,
    cards: (name: string, timePeriod: TimePeriod) => ["commanders", "cards", name, timePeriod] as const,
    seats: (name: string, timePeriod: TimePeriod) => ["commanders", "seats", name, timePeriod] as const,
    topPlayers: (name: string, timePeriod: TimePeriod) => ["commanders", "top-players", name, timePeriod] as const,
    search: (query: string) => ["commanders", "search", query] as const,
  },
  
  // Card queries
  cards: {
    all: ["cards"] as const,
    detail: (name: string) => ["cards", "detail", name] as const,
    commanderStats: (cardName: string, commanderId: string, timePeriod: TimePeriod) => 
      ["cards", "commander-stats", cardName, commanderId, timePeriod] as const,
  },
  
  // Tournament queries
  tournaments: {
    all: ["tournaments"] as const,
    list: (filters: Record<string, unknown>) => ["tournaments", "list", filters] as const,
    filters: ["tournament-filters"] as const,
  },
} as const;

// ============================================
// API Fetch Functions
// ============================================

async function fetchCommanderDetail(
  commanderName: string,
  timePeriod: TimePeriod
): Promise<CommanderDetail> {
  const res = await fetch(
    `/api/commanders/${encodeURIComponent(commanderName)}?timePeriod=${timePeriod}`
  );
  if (!res.ok) throw new Error("Commander not found");
  return res.json();
}

async function fetchCommanderCards(
  commanderName: string,
  timePeriod: TimePeriod
): Promise<CommanderCardsResponse> {
  const res = await fetch(
    `/api/commanders/${encodeURIComponent(commanderName)}/cards?timePeriod=${timePeriod}`
  );
  if (!res.ok) throw new Error("Failed to fetch cards");
  return res.json();
}

async function fetchCommanderSeats(
  commanderName: string,
  timePeriod: TimePeriod
): Promise<SeatPositionResponse> {
  const res = await fetch(
    `/api/commanders/${encodeURIComponent(commanderName)}/seats?timePeriod=${timePeriod}`
  );
  if (!res.ok) throw new Error("Failed to fetch seat data");
  return res.json();
}

async function fetchCommanderTopPlayers(
  commanderName: string,
  timePeriod: TimePeriod
): Promise<CommanderTopPlayersResponse> {
  const res = await fetch(
    `/api/commanders/${encodeURIComponent(commanderName)}/top-players?timePeriod=${timePeriod}`
  );
  if (!res.ok) throw new Error("Failed to fetch top players");
  return res.json();
}

async function fetchCardDetail(cardName: string): Promise<CardDetail> {
  const res = await fetch(`/api/cards/${encodeURIComponent(cardName)}`);
  if (!res.ok) throw new Error("Card not found");
  return res.json();
}

async function fetchCardCommanderStats(
  cardName: string,
  commanderId: string,
  timePeriod: TimePeriod
): Promise<CardCommanderStats> {
  const res = await fetch(
    `/api/cards/${encodeURIComponent(cardName)}/commanders/${commanderId}?timePeriod=${timePeriod}`
  );
  if (!res.ok) throw new Error("Data not found");
  return res.json();
}

// ============================================
// Commander Hooks
// ============================================

/**
 * Fetch detailed commander data with stats and entries
 */
export function useCommanderDetail(commanderName: string, timePeriod: TimePeriod) {
  return useQuery({
    queryKey: queryKeys.commanders.detail(commanderName, timePeriod),
    queryFn: () => fetchCommanderDetail(commanderName, timePeriod),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch cards associated with a commander
 */
export function useCommanderCards(commanderName: string, timePeriod: TimePeriod) {
  return useQuery({
    queryKey: queryKeys.commanders.cards(commanderName, timePeriod),
    queryFn: () => fetchCommanderCards(commanderName, timePeriod),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch seat position win rate data for a commander
 */
export function useCommanderSeats(commanderName: string, timePeriod: TimePeriod) {
  return useQuery({
    queryKey: queryKeys.commanders.seats(commanderName, timePeriod),
    queryFn: () => fetchCommanderSeats(commanderName, timePeriod),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch top players by win rate for a commander
 */
export function useCommanderTopPlayers(commanderName: string, timePeriod: TimePeriod) {
  return useQuery({
    queryKey: queryKeys.commanders.topPlayers(commanderName, timePeriod),
    queryFn: () => fetchCommanderTopPlayers(commanderName, timePeriod),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
}

// ============================================
// Card Hooks
// ============================================

/**
 * Fetch card detail with commander usage
 */
export function useCardDetail(cardName: string) {
  return useQuery({
    queryKey: queryKeys.cards.detail(cardName),
    queryFn: () => fetchCardDetail(cardName),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!cardName,
  });
}

/**
 * Fetch statistics for a card within a specific commander's deck
 */
export function useCardCommanderStats(
  cardName: string,
  commanderId: string,
  timePeriod: TimePeriod
) {
  return useQuery({
    queryKey: queryKeys.cards.commanderStats(cardName, commanderId, timePeriod),
    queryFn: () => fetchCardCommanderStats(cardName, commanderId, timePeriod),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
    enabled: !!cardName && !!commanderId,
  });
}

// ============================================
// Deck Analysis Hook
// ============================================

import type { AnalysisResponse } from "@/components/analyze/analysis-results";

async function fetchDeckAnalysis(
  commanderName: string,
  cards: string[],
  timePeriod: TimePeriod
): Promise<AnalysisResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commanderName, cards, timePeriod }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Analysis failed");
  }
  return res.json();
}

/**
 * Fetch deck analysis for a commander with given cards.
 * Supports time period filtering with smooth transitions (keeps previous data visible).
 * 
 * @param commanderName - Commander name
 * @param cards - Array of card names from the decklist
 * @param timePeriod - Time period for filtering stats
 * @param enabled - Whether to enable the query (set to true once cards are ready)
 */
export function useDeckAnalysis(
  commanderName: string,
  cards: string[],
  timePeriod: TimePeriod,
  enabled: boolean = true
) {
  // Create a stable key from cards array (first 10 cards + count as fingerprint)
  const cardsFingerprint = cards.length > 0 
    ? `${cards.slice(0, 10).join(",")}:${cards.length}` 
    : "";
  
  return useQuery({
    queryKey: ["deck-analysis", commanderName, cardsFingerprint, timePeriod] as const,
    queryFn: () => fetchDeckAnalysis(commanderName, cards, timePeriod),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
    enabled: enabled && !!commanderName && cards.length > 0,
  });
}

// ============================================
// Commander Search (for Deck Analyzer)
// ============================================

export interface CommanderSearchResult {
  id: number;
  name: string;
  color_id: string;
  entries: number;
}

interface CommanderSearchResponse {
  commanders: CommanderSearchResult[];
}

async function fetchCommanderSearch(query: string): Promise<CommanderSearchResponse> {
  if (query.length < 2) {
    return { commanders: [] };
  }
  const res = await fetch(`/api/commanders/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search commanders");
  return res.json();
}

/**
 * Search commanders by name for the deck analyzer combobox
 * Returns lightweight results: id, name, color_id, entries
 */
export function useCommanderSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.commanders.search(query),
    queryFn: () => fetchCommanderSearch(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
  });
}

