import { Box, Typography } from '@mui/joy';
import React from 'react';
import { useInView } from 'react-intersection-observer';
import { cardTypeMap, gridLayouts } from 'src/styles';
import { ICardStat } from 'src/types';
import DeckCard from './DeckCard';

interface DeckSectionProps {
  typeCode: string;
  cards: ICardStat[];
}

const DeckSection: React.FC<DeckSectionProps> = React.memo(
  ({ typeCode, cards }) => {
    const { ref, inView } = useInView({
      triggerOnce: true,
      rootMargin: '200px 0px',
    });

    const displayName = cardTypeMap[typeCode] || `Type ${typeCode}`;

    return (
      <Box ref={ref} sx={{ mb: 2 }}>
        <Typography level="h3">{displayName}</Typography>
        <Box sx={gridLayouts.cardGrid}>
          {/* Only render cards when section is in view */}
          {inView &&
            cards.map((card) => (
              <DeckCard key={card.unique_card_id} card={card} />
            ))}
        </Box>
      </Box>
    );
  },
);

DeckSection.displayName = 'DeckSection';

export default DeckSection;
