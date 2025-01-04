// src/components/Deck/DeckBanner.tsx

import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { BoxProps } from '@mui/joy/Box';
import { ICommanderStatisticsResponse, IMoxfieldDeck } from 'src/types';

interface DeckBannerProps extends BoxProps {
  deck: IMoxfieldDeck;
  deckStats: ICommanderStatisticsResponse;
}

export default function DeckBanner({
  deck,
  deckStats,
  ...props
}: DeckBannerProps) {
  return (
    <Box
      {...props}
      sx={[
        {
          position: 'sticky',
          top: '64px', // Align just below the header
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.surface',
          borderBottom: '1px solid',
          borderColor: 'divider',
          padding: 2,
          boxSizing: 'border-box',
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      <Typography level="h2">{deck.name}</Typography>

      <Box>
        <Typography level="body-sm" sx={{ opacity: 0.5 }}>
          Total Decks: {deckStats.meta_statistics.sample_size.total_decks}
        </Typography>
      </Box>
    </Box>
  );
}
