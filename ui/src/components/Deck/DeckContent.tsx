// src/components/Deck/DeckContent.tsx
import { Box } from '@mui/joy';
import DeckGrid from './DeckGrid';
import DeckList from './DeckList';
import DeckViewToggle from './DeckViewToggle';
import { useAppSelector } from 'src/hooks';

export default function DeckContent() {
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
        }}
      >
        <DeckViewToggle />
      </Box>

      {viewMode === 'grid' ? <DeckGrid /> : <DeckList />}
    </Box>
  );
}
