import { Box, Divider, Typography, Alert, Skeleton } from '@mui/joy';
import { Info as InfoIcon } from 'lucide-react';
import { useAppSelector } from 'src/hooks';
import DeckGrid from './DeckGrid';
import DeckList from './DeckList';
import DeckViewToggle from './DeckViewToggle';
import { useMemo, useState, useEffect } from 'react';
import { useFadeAnimation } from 'src/hooks/useFadeAnimation';
import { conditionalStyles } from 'src/styles/layouts/conditional';

export default function DeckContent() {
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);
  const { deckStats, deck, isStatsLoading, isDeckLoading, error } =
    useAppSelector((state) => state.deck);

  const [hasLoadedTitle, setHasLoadedTitle] = useState(false);

  useEffect(() => {
    if (deck && deckStats && !isStatsLoading && !hasLoadedTitle) {
      const timer = setTimeout(() => {
        setHasLoadedTitle(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [deck, deckStats, isStatsLoading, hasLoadedTitle]);

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

  const commanderName = deckStats?.commanders
    .map((commander) => commander.name)
    .join(' + ');

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mt: 2,
          mb: 2,
          height: '3.75rem',
        }}
      >
        <Box sx={{ flex: 1 }}>
          {/* Loading Title */}
          <Box
            sx={conditionalStyles(!hasLoadedTitle, {
              transform: hasLoadedTitle ? 'translateY(0)' : 'translateY(-4px)',
            })}
          >
            <Skeleton variant="text" level="h2" width="300px" />
            <Skeleton
              variant="text"
              level="body-sm"
              width="150px"
              sx={{ mt: 0.5 }}
            />
          </Box>

          {/* Loaded Title */}
          <Box
            sx={conditionalStyles(hasLoadedTitle, {
              transform: hasLoadedTitle ? 'translateY(4px)' : 'translateY(0)',
            })}
          >
            <Typography level="h2">{commanderName}</Typography>
            <Typography
              level="body-sm"
              sx={{
                color: 'text.secondary',
                mt: 0.5,
              }}
            >
              {numUniqueCards === 0
                ? 'No cards found'
                : `${numUniqueCards} unique cards`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 1 }}>
          <DeckViewToggle />
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {deckStats && !isStatsLoading && (
        <Box sx={{ minHeight: 0, ...contentFadeStyle }}>
          {/* No Data Alert */}
          <Box
            sx={conditionalStyles(numUniqueCards === 0, {
              height: numUniqueCards === 0 ? 'auto' : 0,
            })}
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

          {/* Deck List View */}
          <Box
            sx={conditionalStyles(
              viewMode === 'list' && numUniqueCards > 0,
              {},
            )}
          >
            <DeckList />
          </Box>

          {/* Deck Grid View */}
          <Box
            sx={conditionalStyles(viewMode === 'grid' && numUniqueCards > 0, {
              zIndex: 1,
            })}
          >
            <DeckGrid />
          </Box>
        </Box>
      )}
    </Box>
  );
}
