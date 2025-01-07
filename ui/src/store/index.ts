// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import deckReducer from './slices/deckSlice';
import uiReducer from './slices/uiSlice';
import symbologyReducer from './slices/symbologySlice';

const IGNORED_ACTIONS_PATTERNS = [
  'deck/fetchDeckStats',
  'deck/fetchDeck',
  'deck/fetchDeckData',
];

export const store = configureStore({
  reducer: {
    deck: deckReducer,
    ui: uiReducer,
    symbology: symbologyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: IGNORED_ACTIONS_PATTERNS,
      },
    }),
  devTools: {
    maxAge: 50,
    actionSanitizer: (action) => {
      if (
        IGNORED_ACTIONS_PATTERNS.some((pattern) =>
          action.type.includes(pattern),
        )
      ) {
        return { ...action, payload: '<LARGE_PAYLOAD>' };
      }
      return action;
    },
    stateSanitizer: (state: unknown) => {
      if (!state || typeof state !== 'object') {
        return state;
      }

      const sanitizedState = { ...state } as any;
      if ('deck' in sanitizedState && sanitizedState.deck) {
        sanitizedState.deck = {
          ...sanitizedState.deck,
          deckStats: sanitizedState.deck.deckStats ? '<DECK_STATS>' : null,
          deck: sanitizedState.deck.deck ? '<DECK_DATA>' : null,
        };
      }
      return sanitizedState;
    },
  },
});

export type { RootState } from 'types/store/rootState';
export type AppDispatch = typeof store.dispatch;
