import BalanceIcon from '@mui/icons-material/Balance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Box, Skeleton } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import StatCounter from '../Feedback/StatCounter';
import CommanderStack from './CommanderStack';
import { useState, useEffect } from 'react';

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
  const [localState, setLocalState] = useState({
    deckStats: deckStats,
    isLoading: true,
  });

  useEffect(() => {
    // Always update loading state
    setLocalState((prev) => ({
      deckStats: deckStats || prev.deckStats,
      isLoading: isStatsLoading,
    }));
  }, [deckStats, isStatsLoading]);

  // Early return for initial loading state
  if (localState.isLoading && !localState.deckStats) {
    return <CommanderDetails.Skeleton />;
  }

  // Return null if no stats are available
  if (!localState.deckStats) return null;

  const {
    meta_statistics: {
      baseline_performance: { win_rate = 0, draw_rate = 0 },
      sample_size: { total_decks = 0 },
    },
    commanders,
  } = localState.deckStats;

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
          isLoading={localState.isLoading}
        />
        <StatCounter
          key={`draw-rate-${draw_rate}`}
          value={draw_rate}
          label="average draw rate"
          icon={<BalanceIcon />}
          variant="drawRate"
          type="percentage"
          isLoading={localState.isLoading}
        />
        <StatCounter
          key={`sample-size-${total_decks}`}
          value={total_decks}
          label="sample size"
          icon={<Inventory2Icon />}
          type="integer"
          variant="sampleSize"
          isLoading={localState.isLoading}
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
