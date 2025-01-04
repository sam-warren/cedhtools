import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { Skeleton } from '@mui/joy';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlert } from 'src/contexts/AlertContext';
import { useLoading } from 'src/contexts/LoadingContext';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { getDeckStats } from 'src/services';
import { getDecklistById } from 'src/services/moxfield/moxfield';
import { ICommanderStatisticsResponse, IMoxfieldDeck } from 'src/types';
import CommanderCard from 'src/components/Deck/CommanderCard';
import DeckGrid from 'src/components/Deck/DeckGrid';

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<IMoxfieldDeck | null>(null);
  const [deckStats, setDeckStats] =
    useState<ICommanderStatisticsResponse | null>(null);

  const { addSearch } = useSearchHistory();
  const { setLoading } = useLoading();
  const { showAlert } = useAlert();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!id || deck) return;

      try {
        console.log('Starting data fetch');
        setLoading(true);

        // Fetch deck
        console.log('Fetching deck data...');
        const deckResponse = await getDecklistById(id);

        if (!isMounted) return;

        if (!deckResponse.success) {
          throw new Error('Failed to fetch deck');
        }

        console.log('Deck data received');
        setDeck(deckResponse.data);

        addSearch({
          name: deckResponse.data.name,
          publicId: deckResponse.data.publicId,
          publicUrl: deckResponse.data.publicUrl,
        });

        // Fetch stats
        console.log('Fetching deck stats...');
        const statsResponse = await getDeckStats(deckResponse.data.publicId);

        if (!isMounted) return;

        if (!statsResponse.success) {
          throw new Error('Failed to fetch stats');
        }

        console.log('Stats data received');
        setDeckStats(statsResponse.data);

        console.log('All data loaded, cleaning up...');

        // Ensure state updates have processed before removing loading state
        requestAnimationFrame(() => {
          if (isMounted) {
            setLoading(false);
            console.log('Loading complete');
          }
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) {
          showAlert('Failed to fetch deck data', 'danger');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatPercentage = (value: number) => (value * 100).toFixed(2) + '%';
  const layoutStyles = {
    wrapper: {
      display: 'flex',
      gap: 4,
      minHeight: 0,
      height: '100%',
    },
    leftPane: {
      width: '300px',
      flexShrink: 0,
      p: 3,
      position: 'sticky',
      top: 0,
      height: 'fit-content',
      alignSelf: 'flex-start',
    },
    rightPane: {
      flexGrow: 1,
      minWidth: 0,
      pb: '64px',
      pt: 2,
      pr: 4,
      overflow: 'auto',
    },
    cardGrid: {
      display: 'grid',
      gap: 2,
      gridTemplateColumns: 'repeat(auto-fill, 200px)',
      justifyContent: 'start',
      pt: 3, // Add padding to account for tooltips
    },
  };

  // 1) If not loaded, show skeleton
  if (!deck || !deckStats) {
    return (
      <Box sx={layoutStyles.wrapper}>
        {/* Left Side Pane Skeleton */}
        <Box sx={layoutStyles.leftPane}>
          {/* Commander Card Skeleton */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Skeleton
                variant="rectangular"
                width="100%"
                sx={{
                  aspectRatio: '63/88',
                  borderRadius: `${(2.5 / 63) * 100}%`,
                  display: 'block',
                }}
              />
            </Box>
          </Box>

          {/* Info Skeletons */}
          <Skeleton variant="text" level="h4" sx={{ mb: 2, width: '80%' }} />
          <Skeleton
            variant="text"
            level="body-sm"
            sx={{ mb: 2, width: '90%' }}
          />
          <Skeleton
            variant="text"
            level="body-sm"
            sx={{ mb: 2, width: '80%' }}
          />
          <Skeleton variant="text" level="body-sm" sx={{ width: '60%' }} />
        </Box>

        {/* Right Pane Skeleton */}
        <Box sx={layoutStyles.rightPane}>
          <Skeleton level="h3" variant="text" sx={{ mb: 3, width: '200px' }} />
          <Box sx={layoutStyles.cardGrid}>
            {Array.from({ length: 15 }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Skeleton
                  variant="rectangular"
                  sx={{
                    aspectRatio: '63/88',
                    borderRadius: `${(2.5 / 63) * 100}%`,
                    width: '100%',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    width: '100%',
                    mt: 1,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Skeleton variant="text" width="80%" />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  const commanders = deckStats.commanders || [];

  // 2) Actual deck content
  return (
    <Box sx={layoutStyles.wrapper}>
      {/* LEFT PANE */}
      <Box sx={layoutStyles.leftPane}>
        {/* Commander Cards */}
        <Box sx={{ mb: 3 }}>
          {commanders.map((commander) => (
            <Box
              key={commander.unique_card_id}
              sx={{ mb: 2, '&:last-child': { mb: 0 } }}
            >
              <CommanderCard card={commander} />
            </Box>
          ))}
        </Box>

        {/* Deck Info */}
        <Typography level="h4" sx={{ mb: 2 }}>
          {deck.name}
        </Typography>
        <Typography level="body-sm" sx={{ mb: 2 }}>
          Total Decks: {deckStats.meta_statistics.sample_size.total_decks}
        </Typography>
        <Typography level="body-sm" sx={{ mb: 2 }}>
          Win Rate:{' '}
          {formatPercentage(
            deckStats.meta_statistics.baseline_performance.win_rate,
          )}
        </Typography>
        <Typography level="body-sm">
          Draw Rate:{' '}
          {formatPercentage(
            deckStats.meta_statistics.baseline_performance.draw_rate,
          )}
        </Typography>
      </Box>

      {/* RIGHT PANE */}
      <Box sx={layoutStyles.rightPane}>
        <Box sx={layoutStyles.rightPane}>
          <DeckGrid cardStatistics={deckStats.card_statistics.main} />
        </Box>
      </Box>
    </Box>
  );
}