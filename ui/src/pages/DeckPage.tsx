// src/pages/DeckPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { fetchDeckData, clearError } from 'src/store/slices/deckSlice';
import DeckBanner from 'src/components/Deck/DeckBanner';
import { DeckPageLayout } from 'src/components/Layout/DeckPageLayout';
import CommanderDetails from 'src/components/Deck/CommanderDetails';
import ErrorModal from 'src/components/Feedback/ErrorModal';
import DeckContent from 'src/components/Deck/DeckContent';
import { Box, Divider, Skeleton } from '@mui/joy';
import DeckList from 'src/components/Deck/DeckList';
import DeckGrid from 'src/components/Deck/DeckGrid';

// TODO: Implement a fallback for when no statistics are found - api should also not return 400 bad request but instead return an empty object the client can expect
export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { deck, deckStats, isDeckLoading, isStatsLoading, error } =
    useAppSelector((state) => state.deck);
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);

  const { addSearch } = useSearchHistory();
  useEffect(() => {
    if (!id) return;

    dispatch(fetchDeckData({ deckId: id }))
      .unwrap()
      .then((result) => {
        addSearch({
          name: result.deck.name,
          publicId: result.deck.publicId,
          publicUrl: result.deck.publicUrl,
        });
      });
  }, [id, dispatch]);

  const handleRetry = () => {
    if (id) {
      dispatch(fetchDeckData({ deckId: id }));
    }
  };

  const handleClose = () => {
    dispatch(clearError());
  };

  const showSkeleton =
    (isDeckLoading && !deck) || (isStatsLoading && !deckStats);

  if (showSkeleton) {
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Skeleton variant="text" width="300px" height="32px" />
            <Skeleton variant="text" width="150px" height="20px" />
          </Box>
          <Skeleton variant="rectangular" width="100px" height="40px" />
        </Box>
        <Divider sx={{ mb: 2 }} />
        {viewMode === 'list' ? <DeckList.Skeleton /> : <DeckGrid.Skeleton />}
      </Box>
    );
  }

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
