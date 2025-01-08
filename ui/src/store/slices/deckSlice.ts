import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getDecklistById } from '../../services/moxfield/moxfield';
import { getDeckStats } from 'src/services';
import {
  IMoxfieldDeck,
  ICommanderStatisticsResponse,
  IErrorResponse,
} from '../../types';
import { FilterSettings } from 'src/types/store/rootState';

interface DeckState {
  deck: IMoxfieldDeck | null;
  deckStats: ICommanderStatisticsResponse | null;
  isDeckLoading: boolean;
  isStatsLoading: boolean;
  error: string | null;
  statsCache: {
    [key: string]: {
      data: ICommanderStatisticsResponse;
      timestamp: number;
    };
  };
  filterSettings: FilterSettings;
}

const initialState: DeckState = {
  deck: null,
  deckStats: null,
  isDeckLoading: true,
  isStatsLoading: true,
  error: null,
  statsCache: {},
  filterSettings: {
    timePeriod: 'ban',
    minSize: 30,
  },
};

export const fetchDeck = createAsyncThunk(
  'deck/fetchDeck',
  async (deckId: string, { rejectWithValue }) => {
    try {
      const response = await getDecklistById(deckId);
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to fetch deck from Moxfield',
        );
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
  },
);
export const fetchDeckStats = createAsyncThunk(
  'deck/fetchDeckStats',
  async (
    {
      deckId,
      minSize = 0,
      timePeriod = 'all',
    }: {
      deckId: string;
      minSize?: number;
      timePeriod?: string;
    },
    { rejectWithValue, getState },
  ) => {

    const cacheKey = `${deckId}-${timePeriod}-${minSize}`;

    // Check cache
    const state = getState() as { deck: DeckState };
    const cachedStats = state.deck.statsCache[cacheKey];

    // Cache is valid for 5 minutes
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_DURATION) {
      return cachedStats.data;
    }

    try {
      const response = await getDeckStats(deckId, timePeriod, minSize);
      if (!response.success) {
        // Important: return the entire error response
        return rejectWithValue(
          response.error || 'Failed to fetch statistics for deck',
        );
      }
      return response.data;
    } catch (err) {
      // If it's an API response error, use that message
      if (err && typeof err === 'object' && 'error' in err) {
        return rejectWithValue((err as IErrorResponse).error);
      }
      // Otherwise use the error message
      return rejectWithValue(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
  },
);

// Async thunk for fetching both deck and stats
export const fetchDeckData = createAsyncThunk(
  'deck/fetchDeckData',
  async (
    {
      deckId,
      minSize = 0,
      timePeriod = 'all',
    }: {
      deckId: string;
      minSize?: number;
      timePeriod?: string;
    },
    { dispatch },
  ) => {
    const deck = await dispatch(fetchDeck(deckId)).unwrap();
    const stats = await dispatch(
      fetchDeckStats({ deckId: deck.publicId, minSize, timePeriod }),
    ).unwrap();
    return { deck, deckStats: stats };
  },
);

const deckSlice = createSlice({
  name: 'deck',
  initialState,
  reducers: {
    clearDeckData: (state) => {
      state.deck = null;
      state.deckStats = null;
      state.error = null;
      state.statsCache = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    clearStatsCache: (state) => {
      state.statsCache = {};
    },
    updateFilterSettings: (
      state,
      action: PayloadAction<Partial<FilterSettings>>,
    ) => {
      state.filterSettings = {
        ...state.filterSettings,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Deck fetch cases
      .addCase(fetchDeck.pending, (state) => {
        state.isDeckLoading = true;
        state.error = null;
      })
      .addCase(fetchDeck.fulfilled, (state, action) => {
        state.isDeckLoading = false;
        state.deck = action.payload;
      })
      .addCase(fetchDeck.rejected, (state, action) => {
        state.isDeckLoading = false;
        state.error = action.payload as string;
      })
      // Stats fetch cases
      .addCase(fetchDeckStats.pending, (state) => {
        state.isStatsLoading = true;
        state.error = null;
      })
      .addCase(fetchDeckStats.fulfilled, (state, action) => {
        state.isStatsLoading = false;
        state.deckStats = action.payload;

        // Cache the fetched stats
        const { meta } = action;
        const { deckId, timePeriod = 'all', minSize = 0 } = meta.arg;
        const cacheKey = `${deckId}-${timePeriod}-${minSize}`;

        state.statsCache[cacheKey] = {
          data: action.payload,
          timestamp: Date.now(),
        };
      })
      .addCase(fetchDeckStats.rejected, (state, action) => {
        state.isStatsLoading = false;
        state.deckStats = null;
        state.error = action.payload as string;

        // Clear cache for this request
        if (action.meta?.arg) {
          const { deckId, timePeriod = 'all', minSize = 0 } = action.meta.arg;
          const cacheKey = `${deckId}-${timePeriod}-${minSize}`;
          delete state.statsCache[cacheKey];
        }
      })
      // Combined fetch case - only handle rejection not already handled
      .addMatcher(
        (action) => action.type === fetchDeckData.rejected.type,
        (state) => {
          state.isDeckLoading = false;
          state.isStatsLoading = false;
        },
      );
  },
});

export const {
  clearDeckData,
  clearError,
  clearStatsCache,
  updateFilterSettings,
} = deckSlice.actions;
export default deckSlice.reducer;
