// src/components/Deck/DeckList.tsx
import { Box, Table, Typography } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import { cardTypeMap } from 'src/styles';

export default function DeckList() {
  const { deckStats } = useAppSelector((state) => state.deck);

  if (!deckStats) return null;

  return (
    <Box sx={{ width: '100%' }}>
      {Object.entries(deckStats.card_statistics.main)
        .filter(([, cards]) => cards.length > 0)
        .map(([typeCode, cards]) => (
          <Box key={typeCode} sx={{ mb: 4 }}>
            <Typography level="h2" sx={{ mb: 2 }}>
              {cardTypeMap[typeCode] || `Type ${typeCode}`}
            </Typography>
            <Table
              variant="soft"
              size="sm"
              sx={{
                '& th': { fontWeight: 600 },
                '--TableCell-paddingX': '0.5rem',
              }}
            >
              <thead>
                <tr>
                  <th>Card Name</th>
                  <th>Percentage</th>
                  <th>Decks</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.unique_card_id}>
                    <td>{card.name}</td>
                    <td>{(card.performance.card_win_rate * 100).toFixed(2)}%</td>
                    <td>{card.decks_with_card}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Box>
        ))}
    </Box>
  );
}
