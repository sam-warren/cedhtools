import { Box, Divider, Typography, Alert, Skeleton } from '@mui/joy';
import { Info as InfoIcon } from 'lucide-react';
import { useAppSelector } from 'src/hooks';
import DeckGrid from './DeckGrid';
import DeckList from './DeckList';
import DeckViewToggle from './DeckViewToggle';
import { useMemo, useState, useEffect } from 'react';
import { useFadeAnimation } from 'src/hooks/useFadeAnimation';

export default function DeckContent() {
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);
  const { deckStats, deck, isStatsLoading, isDeckLoading, error } =
    useAppSelector((state) => state.deck);

  // Track initial load - now wait for both deck AND stats
  const [hasLoadedTitle, setHasLoadedTitle] = useState(false);

  useEffect(() => {
    if (deck && deckStats && !isStatsLoading && !hasLoadedTitle) {
      setHasLoadedTitle(true);
    }
  }, [deck, deckStats, isStatsLoading, hasLoadedTitle]);

  // Separate fade for stats content
  const { fadeInStyle: contentFadeStyle } = useFadeAnimation({
    data: deckStats?.card_statistics,
    isLoading: isStatsLoading,
    error,
  });

  const numUniqueCards = useMemo(
    () =>
      deckStats
        ? Object.values(deckStats.card_statistics.main).reduce(
            (acc, cards) => acc + cards.length,
            0,
          ) + deckStats.card_statistics.other.length
        : 0,
    [deckStats],
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mt: 2,
          mb: 2,
        }}
      >
        <Box>
          {!hasLoadedTitle ? (
            // Keep skeleton until ALL data is ready
            <Box>
              <Skeleton variant="text" level="h2" width="300px" />
              <Skeleton
                variant="text"
                level="body-sm"
                width="150px"
                sx={{ mt: 1 }}
              />
            </Box>
          ) : (
            // Content state - only shown when everything is loaded
            <Box>
              <Typography level="h2">
                {deckStats?.commanders
                  .map((commander) => commander.name)
                  .join(' + ')}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {numUniqueCards === 0
                  ? 'No cards found'
                  : `${numUniqueCards} unique cards`}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 1 }}>
          <DeckViewToggle />
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {deckStats && !isStatsLoading && (
        <Box sx={{ minHeight: 0, ...contentFadeStyle }}>
          <Box
            sx={{
              position: 'relative',
              visibility: 'visible',
              opacity: numUniqueCards === 0 ? 1 : 0,
              height: numUniqueCards === 0 ? 'auto' : 0,
              overflow: numUniqueCards === 0 ? 'visible' : 'hidden',
              transition: 'opacity 0.3s ease-in-out, height 0.3s ease-in-out',
              pointerEvents: numUniqueCards === 0 ? 'auto' : 'none',
            }}
          >
            <Alert
              startDecorator={<InfoIcon />}
              color="primary"
              variant="soft"
              sx={{ gap: 2 }}
            >
              <Box>
                <Typography>No data found</Typography>
                <Typography level="body-sm">
                  We don't have enough data for this commander given the search
                  filter criteria.
                </Typography>
              </Box>
            </Alert>
          </Box>

          {numUniqueCards > 0 && (
            <>
              <Box
                sx={{
                  position: 'relative',
                  visibility: 'visible',
                  opacity: viewMode === 'list' ? 1 : 0,
                  height: viewMode === 'list' ? 'auto' : 0,
                  overflow: viewMode === 'list' ? 'visible' : 'hidden',
                  transition:
                    'opacity 0.3s ease-in-out, height 0.3s ease-in-out',
                  pointerEvents: viewMode === 'list' ? 'auto' : 'none',
                }}
              >
                <DeckList />
              </Box>

              <Box
                sx={{
                  position: 'relative',
                  visibility: 'visible',
                  opacity: viewMode === 'grid' ? 1 : 0,
                  height: viewMode === 'grid' ? 'auto' : 0,
                  overflow: viewMode === 'grid' ? 'visible' : 'hidden',
                  transition:
                    'opacity 0.3s ease-in-out, height 0.3s ease-in-out',
                  pointerEvents: viewMode === 'grid' ? 'auto' : 'none',
                  zIndex: viewMode === 'grid' ? 1 : 0,
                }}
              >
                <DeckGrid />
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
