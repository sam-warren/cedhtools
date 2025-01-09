import { Box, Stack, Typography } from '@mui/joy';
import React from 'react';
import { cardTypeMap, gridLayouts } from 'src/styles';
import { ICardStat } from 'src/types';
import DeckCard from './DeckCard';

interface DeckSectionProps {
  typeCode: string;
  cards: ICardStat[];
}

const DeckSection: React.FC<DeckSectionProps> = React.memo(
  ({ typeCode, cards }) => {
    const displayName = cardTypeMap[typeCode] || `Type ${typeCode}`;

    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" gap={1}>
          <Typography level="h3">{displayName}</Typography>
          <Typography level="h3" sx={{ color: 'neutral.500' }}>
            ({cards.length})
          </Typography>
        </Stack>
        <Box sx={gridLayouts.cardGrid}>
          {cards.map((card) => (
            <DeckCard
              key={`${card.unique_card_id}-${card.performance.win_rate_diff}`}
              card={card}
            />
          ))}
        </Box>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary rerenders
    if (prevProps.typeCode !== nextProps.typeCode) return false;
    if (prevProps.cards.length !== nextProps.cards.length) return false;

    // Compare performance metrics of cards
    return prevProps.cards.every((card, index) => {
      const nextCard = nextProps.cards[index];
      return (
        card.unique_card_id === nextCard.unique_card_id &&
        card.performance.win_rate_diff === nextCard.performance.win_rate_diff
      );
    });
  },
);

DeckSection.displayName = 'DeckSection';

export default DeckSection;
