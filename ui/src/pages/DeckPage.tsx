// src/pages/DeckPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import {
  fetchDeckData,
  clearError,
  clearDeckData,
} from 'src/store/slices/deckSlice';
import DeckBanner from 'src/components/Deck/DeckBanner';
import { DeckPageLayout } from 'src/components/Layout/DeckPageLayout';
import CommanderDetails from 'src/components/Deck/CommanderDetails';
import DeckContent from 'src/components/Deck/DeckContent';

export default function DeckPage() {
  const { deckId } = useParams<{
    deckId?: string;
    uniqueCardId?: string;
    commanderId?: string;
  }>();
  const dispatch = useAppDispatch();
  const { filterSettings } = useAppSelector((state) => state.deck);

  const { addSearch } = useSearchHistory();

  useEffect(() => {
    if (!deckId) return;

    dispatch(clearDeckData());

    // Initial load with current filter settings
    dispatch(
      fetchDeckData({
        deckId: deckId,
        timePeriod: filterSettings.timePeriod, // Uses initial state values
        minSize: filterSettings.minSize,
      }),
    )
      .unwrap()
      .then((result) => {
        addSearch({
          name: result.deck.name,
          publicId: result.deck.publicId,
          publicUrl: result.deck.publicUrl,
        });
      }).catch((error) => {
        console.error('Failed to fetch deck data:', error);
      })
  }, [deckId]);


  return (
    <>
      <DeckPageLayout
        banner={<DeckBanner />}
        leftPane={<CommanderDetails />}
        rightPane={<DeckContent />}
      />
    </>
  );
}
