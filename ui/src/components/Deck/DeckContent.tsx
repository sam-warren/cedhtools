import { Box, Divider, Typography, Alert, Skeleton } from '@mui/joy';
import { Info as InfoIcon } from 'lucide-react';
import { useAppSelector } from 'src/hooks';
import DeckGrid from './DeckGrid';
import DeckList from './DeckList';
import DeckViewToggle from './DeckViewToggle';
import { useMemo } from 'react';
import LoadingWrapper from '../Feedback/LoadingWrapper';

export default function DeckContent() {
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);
  const { deckStats, isStatsLoading, isDeckLoading } =
    useAppSelector((state) => state.deck);

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
      {/* Title Section */}
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
        <Box
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}
        >
          {/* Commander Name with its own LoadingWrapper */}
          <LoadingWrapper
            loading={isDeckLoading || isStatsLoading}
            skeleton={<Skeleton variant="text" level="h2" width="300px" />}
            staticRender={true}
          >
            <Typography level="h2">{commanderName || 'Commander'}</Typography>
          </LoadingWrapper>

          {/* Number of Cards with its own LoadingWrapper */}
          <LoadingWrapper
            loading={isStatsLoading}
            skeleton={
              <Skeleton
                variant="text"
                level="body-sm"
                width="150px"
                sx={{ mt: 0.5 }}
              />
            }
          >
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
          </LoadingWrapper>
        </Box>
        <Box sx={{ mt: 1 }}>
          <DeckViewToggle />
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Main Content Section */}
      {deckStats && !isStatsLoading && (
        <Box sx={{ minHeight: 0, position: 'relative' }}>
          {/* No Data Alert */}
          {numUniqueCards === 0 && (
            <Alert
              startDecorator={<InfoIcon />}
              color="primary"
              variant="soft"
              sx={{ gap: 2, mb: 2 }}
            >
              <Box>
                <Typography>No data found</Typography>
                <Typography level="body-sm">
                  We don't have enough data for this commander given the search
                  filter criteria.
                </Typography>
              </Box>
            </Alert>
          )}

          {/* Both views are always mounted, with opacity transitions */}
          {numUniqueCards > 0 && (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  opacity: viewMode === 'list' ? 1 : 0,
                  visibility: viewMode === 'list' ? 'visible' : 'hidden',
                  transition:
                    'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
                }}
              >
                <DeckList />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  opacity: viewMode === 'grid' ? 1 : 0,
                  visibility: viewMode === 'grid' ? 'visible' : 'hidden',
                  transition:
                    'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
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
