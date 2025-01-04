// src/components/Deck/DeckBanner.tsx

import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { BoxProps } from '@mui/joy/Box';
import { ICommanderStatisticsResponse, IMoxfieldDeck } from 'src/types';

interface DeckBannerProps extends BoxProps {
  deck: IMoxfieldDeck;
  deckStats: ICommanderStatisticsResponse;
}

export default function DeckBanner({ deck, ...props }: DeckBannerProps) {
  return (
    <Box
      {...props}
      sx={[
        {
          position: 'sticky',
          top: '64px', // same height as your header
          zIndex: 1100, // put it above main content but below a popover, for example
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.surface',
          borderBottom: '1px solid',
          borderColor: 'divider',
          padding: 2,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      {/* Left side: Deck Name */}
      <Typography level="h2">{deck.name}</Typography>

      {/* Right side: placeholder for future filters */}
      <Box>
        {/* Place your filter components or placeholders here */}
        <Typography level="body-sm" sx={{ opacity: 0.5 }}>
          [Filters Coming Soon]
        </Typography>
      </Box>
    </Box>
  );
}
