import { Box, Divider, Typography } from '@mui/joy';
import DeckGrid from './DeckGrid';
import DeckList from './DeckList';
import DeckViewToggle from './DeckViewToggle';
import { useAppSelector } from 'src/hooks';

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
          alignItems: 'flex-start', // Changed from center to flex-start
          mt: 2,
          mb: 2, // Added to create equal spacing above and below
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
          {' '}
          {/* Added to vertically center the toggle */}
          <DeckViewToggle />
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {viewMode === 'grid' ? <DeckGrid /> : <DeckList />}
    </Box>
  );
}
