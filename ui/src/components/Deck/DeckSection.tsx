import { Box, Typography } from '@mui/joy';
import { ICardStat } from 'src/types';
import DeckCard from './DeckCard';
import { gridLayouts, cardTypeMap } from 'src/styles';

interface DeckSectionProps {
  typeCode: string;
  cards: ICardStat[];
}

const DeckSection: React.FC<DeckSectionProps> = ({ typeCode, cards }) => {
  const displayName = cardTypeMap[typeCode] || `Type ${typeCode}`;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography level="h2">{displayName}</Typography>
      <Box sx={gridLayouts.cardGrid}>
        {cards.map((card) => (
          <DeckCard key={card.unique_card_id} card={card} />
        ))}
      </Box>
    </Box>
  );
};

export default DeckSection;
