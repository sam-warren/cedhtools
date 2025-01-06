// src/components/Deck/CommanderDetails.tsx
import { Box, Typography } from '@mui/joy';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BalanceIcon from '@mui/icons-material/Balance';
import CommanderCard from './CommanderCard';
import CommanderStack from './CommanderStack';
import { useAppSelector } from 'src/hooks';
import StatCounter from '../Feedback/StatCounter';

// TODO: Figure out how to not have a scrollable area for single and double commanders
// TODO: Improve layout (awkward looking card name)

export default function CommanderDetails() {
  const { deckStats } = useAppSelector((state) => state.deck);
  if (!deckStats) return null;

  const {
    meta_statistics: {
      baseline_performance: { win_rate, draw_rate },
      sample_size: { total_decks },
    },
  } = deckStats;

  return (
    <>
      <Box>
        {deckStats.commanders.length === 2 ? (
          <CommanderStack commanders={deckStats.commanders} />
        ) : (
          deckStats.commanders.map((commander) => (
            <Box key={commander.unique_card_id}>
              <CommanderCard card={commander} />
            </Box>
          ))
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1, // Reduced from 2
          width: '100%',
        }}
      >
        <StatCounter
          value={win_rate}
          label="average win rate"
          icon={<EmojiEventsIcon />}
          variant="winRate"
          type="percentage"
        />
        <StatCounter
          value={draw_rate}
          label="average draw rate"
          icon={<BalanceIcon />}
          variant="drawRate"
          type="percentage"
        />
        <StatCounter
          value={total_decks}
          label="sample size"
          icon={<Inventory2Icon />}
          type="integer"
          variant="sampleSize"
          formatOptions={{
            separator: ',',
            suffix: ' decks',
          }}
        />
      </Box>
    </>
  );
}
