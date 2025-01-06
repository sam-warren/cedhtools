import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDecklistById } from '../../services/moxfield/moxfield';
import { getDeckStats } from 'src/services';
import { IMoxfieldDeck, ICommanderStatisticsResponse } from '../../types';

interface DeckState {
  deck: IMoxfieldDeck | null;
  deckStats: ICommanderStatisticsResponse | null;
  isDeckLoading: boolean;
  isStatsLoading: boolean;
  error: string | null;
}


const initialState: DeckState = {
  deck: null,
  deckStats: null,
  isDeckLoading: false,
  isStatsLoading: false,
  error: null,
};

export const fetchDeck = createAsyncThunk(
  'deck/fetchDeck',
  async (deckId: string, { rejectWithValue }) => {
    try {
      const response = await getDecklistById(deckId);
      if (!response.success) {
        throw new Error('Failed to fetch deck details');
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
  }
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
    { rejectWithValue }
  ) => {
    try {
      const response = await getDeckStats(deckId, timePeriod, minSize);
      if (!response.success) {
        throw new Error('Failed to fetch deck statistics');
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
  }
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
    { dispatch }
  ) => {
    const deck = await dispatch(fetchDeck(deckId)).unwrap();
    const stats = await dispatch(
      fetchDeckStats({ deckId: deck.publicId, minSize, timePeriod })
    ).unwrap();
    return { deck, deckStats: stats };
  }
);


const deckSlice = createSlice({
  name: 'deck',
  initialState,
  reducers: {
    clearDeckData: (state) => {
      state.deck = null;
      state.deckStats = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
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
      })
      .addCase(fetchDeckStats.rejected, (state, action) => {
        state.isStatsLoading = false;
        state.error = action.payload as string;
      })
      // Combined fetch cases
      .addCase(fetchDeckData.rejected, (state, action) => {
        state.isDeckLoading = false;
        state.isStatsLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDeckData, clearError } = deckSlice.actions;
export default deckSlice.reducer;
