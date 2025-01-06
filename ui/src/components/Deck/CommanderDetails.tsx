import BalanceIcon from '@mui/icons-material/Balance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Box, Skeleton } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import StatCounter from '../Feedback/StatCounter';
import CommanderStack from './CommanderStack';

// TODO: Fix stat counters not recounting on deck stat change
function CommanderDetailsSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton
        variant="rectangular"
        width="100%"
        height="280px"
        sx={{ mb: 2 }}
      />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </Box>
  );
}
function CommanderDetails() {
  const { deckStats, isStatsLoading } = useAppSelector((state) => state.deck);

  if (isStatsLoading && !deckStats) {
    return <CommanderDetails.Skeleton />;
  }

  if (!deckStats) return null;

  const {
    meta_statistics: {
      baseline_performance: { win_rate, draw_rate },
      sample_size: { total_decks },
    },
  } = deckStats;

  return (
    <>
      <CommanderStack commanders={deckStats.commanders} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
        }}
      >
        <StatCounter
          value={win_rate}
          label="average win rate"
          icon={<EmojiEventsIcon />}
          variant="winRate"
          type="percentage"
          isLoading={isStatsLoading}
        />
        <StatCounter
          value={draw_rate}
          label="average draw rate"
          icon={<BalanceIcon />}
          variant="drawRate"
          type="percentage"
          isLoading={isStatsLoading}
        />
        <StatCounter
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

CommanderDetails.Skeleton = CommanderDetailsSkeleton;
export default CommanderDetails;
