import BalanceIcon from '@mui/icons-material/Balance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Box, Skeleton } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import StatCounter from '../Feedback/StatCounter';
import CommanderStack from './CommanderStack';

function CommanderDetails() {
  const { deckStats, isStatsLoading } = useAppSelector((state) => state.deck);

  // Return null if no stats are available
  if (!deckStats) return null;

  const {
    meta_statistics: {
      baseline_performance: { win_rate = 0, draw_rate = 0 },
      sample_size: { total_decks = 0 },
    },
    commanders,
  } = deckStats;

  return (
    <>
      <CommanderStack commanders={commanders} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
        }}
      >
        <StatCounter
          key={`win-rate-${win_rate}`}
          value={win_rate}
          label="average win rate"
          icon={<EmojiEventsIcon />}
          variant="winRate"
          type="percentage"
          isLoading={isStatsLoading}
        />
        <StatCounter
          key={`draw-rate-${draw_rate}`}
          value={draw_rate}
          label="average draw rate"
          icon={<BalanceIcon />}
          variant="drawRate"
          type="percentage"
          isLoading={isStatsLoading}
        />
        <StatCounter
          key={`sample-size-${total_decks}`}
          value={total_decks}
          label="sample size"
          icon={<Inventory2Icon />}
          type="integer"
          variant="sampleSize"
          isLoading={isStatsLoading}
          formatOptions={{
            separator: ',',
            suffix: ' decks',
          }}
        />
      </Box>
    </>
  );
}

export default CommanderDetails;
