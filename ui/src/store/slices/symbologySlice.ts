// src/store/slices/symbologySlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface ManaSymbol {
  symbol: string;
  svg_uri: string;
}

export interface SymbologyState {
  symbols: Record<string, string>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SymbologyState = {
  symbols: {},
  status: 'idle',
  error: null,
};

export const fetchSymbology = createAsyncThunk(
  'symbology/fetchSymbology',
  async () => {
    const response = await fetch('https://api.scryfall.com/symbology');
    const data = await response.json();
    return data.data.reduce((acc: Record<string, string>, symbol: ManaSymbol) => {
      acc[symbol.symbol] = symbol.svg_uri;
      return acc;
    }, {});
  }
);

const symbologySlice = createSlice({
  name: 'symbology',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSymbology.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSymbology.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.symbols = action.payload;
      })
      .addCase(fetchSymbology.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      });
  },
});

export default symbologySlice.reducer;