import BalanceIcon from '@mui/icons-material/Balance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Box } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import StatCounter from '../Feedback/StatCounter';
import CommanderStack from './CommanderStack';
import { useFadeAnimation } from 'src/hooks/useFadeAnimation';
import CommanderCard from './CommanderCard';
import { commanderStackStyles } from 'src/styles';

function CommanderDetailsSkeleton() {
  return (
    <>
      <Box sx={commanderStackStyles.singleCardContainer}>
        <CommanderCard.Skeleton />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
        }}
      >
        <StatCounter.Skeleton />
        <StatCounter.Skeleton />
        <StatCounter.Skeleton />
      </Box>
    </>
  );
}
function CommanderDetails(): JSX.Element {
  const isStatsLoading = useAppSelector((state) => state.deck.isStatsLoading);
  const deckStats = useAppSelector((state) => state.deck.deckStats);
  const error = useAppSelector((state) => state.deck.error);

  // Move the hook outside the conditional block
  const { fadeInStyle } = useFadeAnimation({
    data: deckStats,
    isLoading: isStatsLoading,
    error,
  });

  if (isStatsLoading || !deckStats) {
    // Return Skeleton if still loading or no data
    return <CommanderDetails.Skeleton />;
  }

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
          ...fadeInStyle,
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
CommanderDetails.Skeleton = CommanderDetailsSkeleton;
