// src/types/store.ts

import { ICommanderStatisticsResponse } from 'types/cedhtools';
import { IMoxfieldDeck } from 'types/moxfield';

// Deck Slice State

export interface FilterSettings {
  timePeriod: string;
  minSize: number;
}

export interface DeckState {
  deck: IMoxfieldDeck | null;
  deckStats: ICommanderStatisticsResponse | null;
  isDeckLoading: boolean;
  isStatsLoading: boolean;
  error: string | null;
  filterSettings: FilterSettings;
}

// UI Slice State
export interface UIState {
  deckViewMode: 'grid' | 'list';
}

// Symbology Slice State
export interface SymbologyState {
  symbols: Record<string, string>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Root State combining all slice states
export interface RootState {
  deck: DeckState;
  ui: UIState;
  symbology: SymbologyState;
}
