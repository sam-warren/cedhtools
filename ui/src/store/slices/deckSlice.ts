import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDecklistById } from '../../services/moxfield/moxfield';
import { getDeckStats } from 'src/services';
import { IMoxfieldDeck, ICommanderStatisticsResponse } from '../../types';

interface DeckState {
  deck: IMoxfieldDeck | null;
  deckStats: ICommanderStatisticsResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DeckState = {
  deck: null,
  deckStats: null,
  isLoading: false,
  error: null,
};

// Async thunk for fetching both deck and stats
export const fetchDeckData = createAsyncThunk(
  'deck/fetchDeckData',
  async (deckId: string, { rejectWithValue }) => {
    try {
      const deckResponse = await getDecklistById(deckId);
      if (!deckResponse.success) {
        throw new Error('Failed to fetch deck details');
      }

      const statsResponse = await getDeckStats(deckResponse.data.publicId);
      if (!statsResponse.success) {
        throw new Error('Failed to fetch deck statistics');
      }

      return {
        deck: deckResponse.data,
        deckStats: statsResponse.data,
      };
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
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
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeckData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeckData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deck = action.payload.deck;
        state.deckStats = action.payload.deckStats;
      })
      .addCase(fetchDeckData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDeckData, clearError } = deckSlice.actions;
export default deckSlice.reducer;
