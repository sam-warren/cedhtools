import { Box, Divider, Typography, Alert, Skeleton } from '@mui/joy';
import { Info as InfoIcon } from 'lucide-react';
import { useAppSelector } from 'src/hooks';
import DeckGrid from './DeckGrid';
import DeckList from './DeckList';
import DeckViewToggle from './DeckViewToggle';
import { useMemo } from 'react';
import TransitionWrapper from '../Feedback/TransitionWrapper';
import { useParams } from 'react-router-dom';

const NoDataAlert = () => (
  <Alert
    startDecorator={<InfoIcon />}
    color="primary"
    variant="soft"
    sx={{ gap: 2, mb: 2 }}
  >
    <Box>
      <Typography>No data found</Typography>
      <Typography level="body-sm">
        We don't have enough data for this commander given the search filter
        criteria.
      </Typography>
    </Box>
  </Alert>
);

const CardDisplay = ({ viewMode }: { viewMode: 'list' | 'grid' }) => (
  <Box
    sx={{
      display: 'grid',
      '& > div': {
        gridArea: '1 / 1',
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
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
);

export default function DeckContent() {
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);
  const { deckId } = useParams<{ deckId?: string }>(); // Extract deckId from URL
  const { deckStats, isStatsLoading, isDeckLoading } = useAppSelector(
    (state) => state.deck,
  );

  const isLoading = isStatsLoading || isDeckLoading || !deckStats;

  const numUniqueCards = useMemo(() => {
    if (!deckStats) return 0;
    return (
      Object.values(deckStats.card_statistics.main).reduce(
        (acc, cards) => acc + cards.length,
        0,
      ) + deckStats.card_statistics.other.length
    );
  }, [deckStats]);

  const commanderName = useMemo(() => {
    if (isLoading) return '';
    return deckStats?.commanders.map((commander) => commander.name).join(' + ');
  }, [deckStats, isLoading]);

  const showNoData = !!deckStats && !isStatsLoading && numUniqueCards === 0;
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
          <TransitionWrapper
            key={deckId} // Add deckId as key to force remount on deck change
            loading={isLoading}
            skeleton={<Skeleton variant="text" level="h2" width="600px" />}
          >
            <Typography level="h2">{commanderName}</Typography>
          </TransitionWrapper>

          <TransitionWrapper.Section when={!!deckStats}>
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
          </TransitionWrapper.Section>
        </Box>

        <Box sx={{ mt: 1 }}>
          <DeckViewToggle />
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Main Content Section */}
      <TransitionWrapper loading={isStatsLoading}>
        <TransitionWrapper.Section when={showNoData}>
          <NoDataAlert />
        </TransitionWrapper.Section>

        <TransitionWrapper.Section when={showCardDisplay}>
          <CardDisplay viewMode={viewMode} />
        </TransitionWrapper.Section>
      </TransitionWrapper>
    </Box>
  );
}
