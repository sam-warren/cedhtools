import { Box, Typography, Chip } from '@mui/joy';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BalanceIcon from '@mui/icons-material/Balance';
import CommanderCard from './CommanderCard';
import CommanderStack from './CommanderStack';
import { ICommanderStatisticsResponse } from 'src/types';

interface CommanderDetailsProps {
  deckStats: ICommanderStatisticsResponse;
}

const CommanderDetails = ({ deckStats }: CommanderDetailsProps) => {
  const formatPercentage = (value: number) => (value * 100).toFixed(2) + '%';

  return (
    <>
      <Typography level="body-md" sx={{ mb: 2, textAlign: 'center' }}>
        {deckStats.commanders.map((commander) => commander.name).join(' + ')}
      </Typography>
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

      <Typography level="h4" sx={{ mt: 2, mb: 1 }}>
        deck stats
      </Typography>
      <Chip
        size="md"
        variant="soft"
        startDecorator={<EmojiEventsIcon />}
        color={
          deckStats.meta_statistics.baseline_performance.win_rate * 100 < 15
            ? 'danger'
            : deckStats.meta_statistics.baseline_performance.win_rate * 100 < 20
              ? 'warning'
              : 'success'
        }
        sx={{ mb: 1, mr: 1 }}
      >
        average win rate:{' '}
        {formatPercentage(
          deckStats.meta_statistics.baseline_performance.win_rate,
        )}
      </Chip>
      <Chip
        size="md"
        variant="soft"
        color="neutral"
        startDecorator={<BalanceIcon />}
        sx={{ mb: 1, mr: 1 }}
      >
        average draw rate:{' '}
        {formatPercentage(
          deckStats.meta_statistics.baseline_performance.draw_rate,
        )}
      </Chip>
      <Chip
        size="md"
        variant="soft"
        color="neutral"
        startDecorator={<Inventory2Icon />}
        sx={{ mb: 1, mr: 1 }}
      >
        sample size: {deckStats.meta_statistics.sample_size.total_decks} decks
      </Chip>
    </>
  );
};

export default CommanderDetails;
