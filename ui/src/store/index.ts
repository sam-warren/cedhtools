import { configureStore } from '@reduxjs/toolkit';
import deckReducer from './deckSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    deck: deckReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
