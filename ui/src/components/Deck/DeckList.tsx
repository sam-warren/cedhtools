import { Box, Typography } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import { useManaSymbols } from 'src/hooks/useManaSymbols';
import { cardTypeMap } from 'src/styles';
import { layoutStyles } from 'src/styles/layouts/list';
import DeckTable from './DeckTable';

export default function DeckList() {
  const { deckStats } = useAppSelector((state) => state.deck);
  const { isLoading, isError } = useManaSymbols();

  if (!deckStats) return null;
  if (isLoading) return <Typography>Loading mana symbols...</Typography>;
  if (isError)
    return <Typography color="danger">Error loading mana symbols</Typography>;

  return (
    <Box sx={layoutStyles.container}>
      <Box sx={layoutStyles.mainSection}>
        {Object.entries(deckStats.card_statistics.main)
          .filter(([, cards]) => cards.length > 0)
          .map(([typeCode, cards]) => (
            <Box key={typeCode} sx={layoutStyles.sectionContainer}>
              <Box sx={layoutStyles.tableContainer}>
                <DeckTable cards={cards} deckStats={deckStats} label={cardTypeMap[typeCode] || `Type ${typeCode}`}/>
              </Box>
            </Box>
          ))}
      </Box>

      {deckStats.card_statistics.other.length > 0 && (
        <Box>
          <DeckTable
            cards={deckStats.card_statistics.other}
            deckStats={deckStats}
            label={cardTypeMap.other}
          />
        </Box>
      )}
    </Box>
  );
}
