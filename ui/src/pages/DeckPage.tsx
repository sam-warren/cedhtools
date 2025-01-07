// src/pages/DeckPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { fetchDeckData, clearError } from 'src/store/slices/deckSlice';
import DeckBanner from 'src/components/Deck/DeckBanner';
import { DeckPageLayout } from 'src/components/Layout/DeckPageLayout';
import CommanderDetails from 'src/components/Deck/CommanderDetails';
import ErrorModal from 'src/components/Feedback/ErrorModal';
import DeckContent from 'src/components/Deck/DeckContent';

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const {
    error,
    filterSettings,
  } = useAppSelector((state) => state.deck);

  const { addSearch } = useSearchHistory();

  useEffect(() => {
    if (!id) return;

    // Initial load with current filter settings
    dispatch(
      fetchDeckData({
        deckId: id,
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
      });
  }, [id]);

  const handleRetry = () => {
    if (id) {
      dispatch(fetchDeckData({ deckId: id }));
    }
  };

  const handleClose = () => {
    dispatch(clearError());
  };

  return (
    <>
      <DeckPageLayout
        banner={<DeckBanner />}
        leftPane={<CommanderDetails />}
        rightPane={<DeckContent />}
      />
      <ErrorModal
        message={error || ''}
        onRetry={handleRetry}
        onClose={handleClose}
        open={Boolean(error)}
      />
    </>
  );
}
