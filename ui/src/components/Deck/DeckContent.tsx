import { Box, Divider, Typography } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import DeckGrid from './DeckGrid';
import DeckList from './DeckList';
import DeckViewToggle from './DeckViewToggle';

export default function DeckContent() {
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);
  const { deckStats } = useAppSelector((state) => state.deck);

  if (!deckStats) return null;

  const numUniqueCards = deckStats
    ? Object.values(deckStats.card_statistics.main).reduce(
        (acc, cards) => acc + cards.length,
        0,
      ) + deckStats.card_statistics.other.length
    : 0;

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
          <Typography level="h2">
            {deckStats.commanders
              .map((commander) => commander.name)
              .join(' + ')}
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            {numUniqueCards} unique cards
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <DeckViewToggle />
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Container for both views */}
      <Box sx={{ position: 'relative' }}>
        {/* Grid View */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            opacity: viewMode === 'grid' ? 1 : 0,
            visibility: viewMode === 'grid' ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <DeckGrid />
        </Box>

        {/* List View */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            opacity: viewMode === 'list' ? 1 : 0,
            visibility: viewMode === 'list' ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <DeckList />
        </Box>

        {/* Spacer div to maintain container height */}
        <Box
          sx={{
            height: viewMode === 'grid' ? '100%' : 'auto',
            visibility: 'hidden',
          }}
        >
          {viewMode === 'grid' ? <DeckGrid /> : <DeckList />}
        </Box>
      </Box>
    </Box>
  );
}
