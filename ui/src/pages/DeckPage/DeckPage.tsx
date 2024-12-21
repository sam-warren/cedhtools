import { Skeleton } from '@mui/joy';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlert } from 'src/contexts/AlertContext';
import { useLoading } from 'src/contexts/LoadingContext';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { getDeckStats } from 'src/services';
import { getDecklistById } from 'src/services/moxfield/moxfield';
import { IApiResponse, ICommanderStats, IMoxfieldDeck } from 'src/types';
import { useCountUp } from 'use-count-up'; // TODO: Implement this for commander stats

// TODO: Implement a table view

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<IMoxfieldDeck | null>(null);
  const [deckStats, setDeckStats] = useState<ICommanderStats | null>(null);

  const { addSearch } = useSearchHistory();
  const { setLoading } = useLoading();
  const { showAlert } = useAlert();

  useEffect(() => {
    if (id && !deck) {
      const fetchDeck = async () => {
        try {
          setLoading(true);
          const response: IApiResponse<IMoxfieldDeck> =
            await getDecklistById(id);
          if (response.success) {
            setDeck(response.data);
            fetchCommanderStats(response.data);
            addSearch({
              name: response.data.name,
              publicId: response.data.publicId,
              publicUrl: response.data.publicUrl,
            });
          } else {
            showAlert('Failed to fetch deck from Moxfield', 'danger');
            setLoading(false);
          }
        } catch (err: any) {
          showAlert('Failed to fetch deck from Moxfield', 'danger');
          setLoading(false);
        }
      };
      fetchDeck();
    }
  }, [id, deck]);

  const fetchCommanderStats = async (deck: IMoxfieldDeck) => {
    if (!deckStats) {
      try {
        const commander_ids = Object.keys(deck.boards['commanders']['cards']);
        if (commander_ids && commander_ids.length > 0) {
          const response: IApiResponse<ICommanderStats> =
            await getDeckStats(commander_ids);
          if (response.success) {
            console.log('Deck stats: ', response.data);
            setDeckStats(response.data);
            setLoading(false);
          } else {
            console.error('Failed to fetch deck statistics', response.error);
            showAlert('Failed to fetch deck statistics', 'danger');
            setLoading(false);
          }
        }
      } catch (err: any) {
        showAlert('Failed to fetch deck statistics', 'danger');
        setLoading(false);
        console.error('Failed to fetch deck statistics', err.message);
      }
    }
  };

  if (!deck || !deckStats) {
    // Skeleton loader while the deck and stats are being fetched
    return (
      <Box sx={{ display: 'flex', gap: 4, p: 4 }}>
        {/* Left Side Pane Skeleton */}
        <Box sx={{ width: '300px', flexShrink: 0 }}>
          <Skeleton
            variant="rectangular"
            width={126}
            height={176}
            sx={{ mb: 4, borderRadius: 7 }}
          />
          <Skeleton variant="text" height={40} width="80%" sx={{ mb: 2 }} />
          <Skeleton variant="text" height={20} width="90%" sx={{ mb: 2 }} />
          <Skeleton variant="text" height={20} width="80%" sx={{ mb: 2 }} />
          <Skeleton variant="text" height={20} width="60%" />
        </Box>

        {/* Right Pane Skeleton */}
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
            {Array.from({ length: 15 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                width={126} // 2x the width of a playing card
                height={176} // 2x the height of a playing card
                sx={{
                  borderRadius: 7,
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, p: 4 }}>
      {/* Left Side Pane */}
      <Box
        sx={{
          width: '300px',
          flexShrink: 0,
          borderRadius: 2,
          p: 3,
        }}
      >
        {/* Commander Cards */}
        <Box sx={{ mb: 4 }}>
          {Object.values(deck.boards['commanders']['cards']).map(
            (commander: any, index: number) => (
              <Box
                key={index}
                sx={{
                  width: 126,
                  height: 176,
                  mb: 2,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {commander.name}
              </Box>
            ),
          )}
        </Box>

        {/* Deck Title */}
        <Typography level="h4" sx={{ mb: 2 }}>
          {deck.name}
        </Typography>

        {/* Deck-wide Stats */}
        <Typography level="body-sm" sx={{ mb: 2 }}>
          Win Rate: {Math.round(deckStats.avg_win_rate * 100)}%
        </Typography>
        <Typography level="body-sm">
          Draw Rate: {Math.round(deckStats.avg_draw_rate * 100)}%
        </Typography>
      </Box>

      {/* Right Pane */}
      <Box sx={{ flexGrow: 1 }}>
        {/* Section Title */}
        <Typography level="h3" sx={{ mb: 2 }}>
          Main Deck
        </Typography>

        {/* Main Deck Cards */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {Object.values(deck.boards['mainboard']['cards']).map(
            (card: any, index: number) => (
              <Box
                key={index}
                sx={{
                  width: 126,
                  height: 176,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {card.name}
              </Box>
            ),
          )}
        </Box>
      </Box>
    </Box>
  );
}
