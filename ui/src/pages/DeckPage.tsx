// src/pages/DeckPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from 'src/contexts/LoadingContext';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { fetchDeckData, clearError } from 'src/store/deckSlice';
import DeckGrid from 'src/components/Deck/DeckGrid';
import DeckBanner from 'src/components/Deck/DeckBanner';
import DeckSkeleton from 'src/components/Deck/DeckSkeleton';
import { DeckPageLayout } from 'src/components/Layout/DeckPageLayout';
import CommanderDetails from 'src/components/Deck/CommanderDetails';
import ErrorModal from 'src/components/Feedback/ErrorModal';
import DeckList from 'src/components/Deck/DeckList';
import DeckContent from 'src/components/Deck/DeckContent';

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { deck, deckStats, isLoading, error } = useAppSelector(
    (state) => state.deck,
  );
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);

  const { addSearch } = useSearchHistory();
  const { setLoading } = useLoading();

  useEffect(() => {
    if (!id) return;

    dispatch(fetchDeckData(id))
      .unwrap()
      .then((result) => {
        addSearch({
          name: result.deck.name,
          publicId: result.deck.publicId,
          publicUrl: result.deck.publicUrl,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, dispatch]);

  const handleRetry = () => {
    if (id) {
      dispatch(fetchDeckData(id));
    }
  };

  const handleClose = () => {
    dispatch(clearError());
  };

  const renderContent = () => {
    if (!deck || !deckStats || isLoading) {
      return (
        <>
          <DeckSkeleton />
          <ErrorModal
            message={error || ''}
            onRetry={handleRetry}
            onClose={handleClose}
            open={Boolean(error)}
          />
        </>
      );
    }

    return (
      <DeckPageLayout
        banner={<DeckBanner />}
        leftPane={<CommanderDetails />}
        rightPane={<DeckContent />}
      />
    );
  };

  return renderContent();
}
