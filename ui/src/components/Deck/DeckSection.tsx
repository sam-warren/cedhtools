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
    '1': 'Battles',
    '2': 'Planeswalkers',
    '3': 'Creatures',
    '4': 'Sorceries',
    '5': 'Instants',
    '6': 'Artifacts',
    '7': 'Enchantments',
    '8': 'Lands',
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
      pt: 2
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
