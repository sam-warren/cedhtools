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
  const { deckStats, isStatsLoading, isDeckLoading } = useAppSelector(
    (state) => state.deck,
  );

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

  const showNoData = !isStatsLoading && numUniqueCards === 0;
  const showCardDisplay = !isStatsLoading && numUniqueCards > 0;

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
          <LoadingWrapper
            loading={isDeckLoading || isStatsLoading}
            skeleton={<Skeleton variant="text" level="h2" width="600px" />}
            staticRender={true}
          >
            <Typography level="h2">{commanderName || 'Commander'}</Typography>
          </LoadingWrapper>

          <LoadingWrapper loading={isStatsLoading} when={!!deckStats}>
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
      <LoadingWrapper loading={isStatsLoading}>
        {/* No Data Alert */}
        <LoadingWrapper loading={!showNoData} when={showNoData}>
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
        </LoadingWrapper>

        {/* Card Display */}
        <LoadingWrapper loading={!showCardDisplay} when={showCardDisplay}>
          <Box
            sx={{
              display: 'grid',
              '& > div': {
                gridArea: '1 / 1',
                opacity: 0,
                visibility: 'hidden',
                transition:
                  'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
              },
              '& > div[data-active="true"]': {
                opacity: 1,
                visibility: 'visible',
              },
            }}
          >
            <Box data-active={viewMode === 'list'}>
              <DeckList />
            </Box>
            <Box data-active={viewMode === 'grid'}>
              <DeckGrid />
            </Box>
          </Box>
        </LoadingWrapper>
      </LoadingWrapper>
    </Box>
  );
}
