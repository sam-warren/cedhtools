import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ViewMode = 'grid' | 'list';

interface UIState {
  deckViewMode: ViewMode;
}

const initialState: UIState = {
  deckViewMode: 'grid',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDeckViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.deckViewMode = action.payload;
    },
  },
});

export const { setDeckViewMode } = uiSlice.actions;
export default uiSlice.reducer;
