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
      <Box sx={{ minHeight: 0 }}>
        {/* List View Layer */}
        <Box
          sx={{
            position: 'relative',
            visibility: 'visible',
            opacity: viewMode === 'list' ? 1 : 0,
            height: viewMode === 'list' ? 'auto' : 0,
            overflow: viewMode === 'list' ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: viewMode === 'list' ? 'auto' : 'none',
          }}
        >
          <DeckList />
        </Box>

        {/* Grid View Layer - Always in view for intersection observer */}
        <Box
          sx={{
            position: 'relative',
            visibility: 'visible',
            opacity: viewMode === 'grid' ? 1 : 0,
            height: viewMode === 'grid' ? 'auto' : 0,
            overflow: viewMode === 'grid' ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: viewMode === 'grid' ? 'auto' : 'none',
            marginTop: viewMode === 'grid' ? 0 : '-100%',
          }}
        >
          <DeckGrid />
        </Box>
      </Box>
    </Box>
  );
}
