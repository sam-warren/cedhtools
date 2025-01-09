// deckSlice.ts
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
  isDeckLoading: false,
  isStatsLoading: false,
  error: null,
  statsCache: {},
  filterSettings: {
    timePeriod: 'ban',
    minSize: 0,
  },
};

export const fetchDeck = createAsyncThunk(
  'deck/fetchDeck',
  async (deckId: string, { rejectWithValue, signal }) => {
    console.log('thunk 1');
    try {
      if (signal.aborted) {
        throw new Error('Request cancelled');
      }
      const response = await getDecklistById(deckId);
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to fetch deck from Moxfield',
        );
      }
      return response.data;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return rejectWithValue('Request cancelled');
      }
      return rejectWithValue(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { deck } = getState() as { deck: DeckState };
      return !deck.isDeckLoading;
    },
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
    { rejectWithValue, getState, signal },
  ) => {
    console.log('thunk 2');
    const cacheKey = `${deckId}-${timePeriod}-${minSize}`;
    const state = getState() as { deck: DeckState };
    const cachedStats = state.deck.statsCache[cacheKey];

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_DURATION) {
      return cachedStats.data;
    }

    try {
      if (signal.aborted) {
        throw new Error('Request cancelled');
      }
      const response = await getDeckStats(deckId, timePeriod, minSize);
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to fetch statistics for deck',
        );
      }
      return response.data;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return rejectWithValue('Request cancelled');
      }
      if (err && typeof err === 'object' && 'error' in err) {
        return rejectWithValue((err as IErrorResponse).error);
      }
      return rejectWithValue(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { deck } = getState() as { deck: DeckState };
      return !deck.isStatsLoading;
    },
  },
);

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
    { dispatch, signal },
  ) => {
    dispatch(clearDeckData());

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
      state.isDeckLoading = false;
      state.isStatsLoading = false;
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
        if (action.payload === 'Request cancelled') {
          return;
        }
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
        if (action.payload === 'Request cancelled') {
          return;
        }
        state.deckStats = null;
        state.error = action.payload as string;

        if (action.meta?.arg) {
          const { deckId, timePeriod = 'all', minSize = 0 } = action.meta.arg;
          const cacheKey = `${deckId}-${timePeriod}-${minSize}`;
          delete state.statsCache[cacheKey];
        }
      })
      .addCase(fetchDeckData.pending, (state) => {
        state.isDeckLoading = true;
        state.error = null;
      })
      .addCase(fetchDeckData.rejected, (state, action) => {
        state.isDeckLoading = false;
        state.isStatsLoading = false;
        if (action.error.name !== 'AbortError') {
          state.error = action.error.message ?? 'An error occurred';
        }
      });
  },
});

export const {
  clearDeckData,
  clearError,
  clearStatsCache,
  updateFilterSettings,
} = deckSlice.actions;

export default deckSlice.reducer;
