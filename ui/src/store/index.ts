// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import deckReducer from './slices/deckSlice';
import uiReducer from './slices/uiSlice';
import symbologyReducer from './slices/symbologySlice';

export const store = configureStore({
  reducer: {
    deck: deckReducer,
    ui: uiReducer,
    symbology: symbologyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
