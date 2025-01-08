import { useMemo } from 'react';
import BalanceIcon from '@mui/icons-material/Balance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Box } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import StatCounter from '../Feedback/StatCounter';
import CommanderStack from './CommanderStack';
import { ICommanderDetail } from 'src/types';

function CommanderDetails(): JSX.Element {
  const isStatsLoading = useAppSelector((state) => state.deck.isStatsLoading);
  const deckStats = useAppSelector((state) => state.deck.deckStats);

  const memoizedCommanders = useMemo(
    () => (deckStats?.commanders ?? []) as ICommanderDetail[],
    [deckStats?.commanders],
  );

  const win_rate = deckStats?.meta_statistics?.baseline_performance?.win_rate;
  const draw_rate = deckStats?.meta_statistics?.baseline_performance?.draw_rate;
  const total_decks = deckStats?.meta_statistics?.sample_size?.total_decks;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <CommanderStack
        commanders={memoizedCommanders}
        isInitialLoad={isStatsLoading && !deckStats}
      />

      {/* Stats section */}
      <Box sx={{ position: 'relative' }}>
        {/* Content layer */}
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
      </Box>
    </Box>
  );
}

export default CommanderDetails;
