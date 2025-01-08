import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import {
  fetchDeckData,
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
    let isSubscribed = true;

    const loadDeck = async () => {
      if (!deckId) return;

      // Clear existing data before loading new deck
      dispatch(clearDeckData());

      try {
        const result = await dispatch(
          fetchDeckData({
            deckId: deckId,
            timePeriod: filterSettings.timePeriod,
            minSize: filterSettings.minSize,
          }),
        ).unwrap();

        // Only update if component is still mounted
        if (isSubscribed) {
          addSearch({
            name: result.deck.name,
            publicId: result.deck.publicId,
            publicUrl: result.deck.publicUrl,
          });
        }
      } catch (error) {
        if (isSubscribed) {
          console.error('Failed to fetch deck data:', error);
        }
      }
    };

    loadDeck();

    // Cleanup function to run on unmount or when deckId changes
    return () => {
      isSubscribed = false;
      dispatch(clearDeckData());
    };
  }, [deckId, filterSettings.timePeriod, filterSettings.minSize]);

  return (
    <DeckPageLayout
      banner={<DeckBanner />}
      leftPane={<CommanderDetails />}
      rightPane={<DeckContent />}
    />
  );
}
