import React from 'react';
import { Box, Typography } from '@mui/joy';
import { ICardStat } from 'src/types';
import DeckCard from 'src/components/Deck/DeckCard';

interface DeckSectionProps {
  /**
   * A string representing the type code (e.g., "1", "2", "3"...).
   */
typeCode: string;

  /**
   * The array of card stats to display in this section.
   */
  cards: ICardStat[];
}

const DeckSection: React.FC<DeckSectionProps> = ({ 
  typeCode,
  cards,
}) => {
  const typeNameMap: Record<string, string> = {
    '0': 'other cards',
    '1': 'battles',
    '2': 'planeswalkers',
    '3': 'creatures',
    '4': 'sorceries',
    '5': 'instants',
    '6': 'artifacts',
    '7': 'enchantments',
    '8': 'lands',
  };
  const displayName = typeNameMap[typeCode] || `Type ${typeCode}`;

  const layoutStyles = {
    sectionWrapper: {
      mb: 2,
    },
    sectionHeader: {
    },
    cardGrid: {
      display: 'grid',
      gap: 2,
      gridTemplateColumns: 'repeat(auto-fill, 200px)',
      justifyContent: 'start',
      pt: 1
    },
  };

  return (
    <Box sx={layoutStyles.sectionWrapper}>
      <Typography level="h2" sx={layoutStyles.sectionHeader}>
        {displayName}
      </Typography>
      <Box sx={layoutStyles.cardGrid}>
        {cards.map((card) => (
          <DeckCard 
            key={card.unique_card_id} 
            card={card} 
          />
        ))}
      </Box>
    </Box>
  );
};

export default DeckSection;
