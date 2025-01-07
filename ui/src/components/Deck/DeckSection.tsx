import { Box, Typography } from '@mui/joy';
import React, { useEffect, useState } from 'react';
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
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
      return () => clearTimeout(timer);
    }, [cards]);

    return (
      <Box sx={{ mb: 2 }}>
        <Typography level="h3">{displayName}</Typography>
        <Box
          sx={{
            ...gridLayouts.cardGrid,
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
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
