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
  }, []);

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
    return (
      <Box sx={{ p: 4 }}>
        {/* Skeleton for deck title */}
        <Skeleton
          variant="rectangular"
          sx={{ width: '60%', height: '2rem', mb: 2 }}
        />

        {/* Skeleton for deck description (2 lines) */}
        <Skeleton variant="text" sx={{ width: '90%', mb: 1 }} />
        <Skeleton variant="text" sx={{ width: '80%', mb: 4 }} />

        {/* Skeleton for "Main Deck" heading */}
        <Skeleton
          variant="rectangular"
          sx={{ width: '30%', height: '1.5rem', mb: 2 }}
        />

        {/* Skeleton for a few deck cards (simulate a list of cards) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="rectangular" width="63" height="88" />
          <Skeleton variant="rectangular" width="63" height="88" />
          <Skeleton variant="rectangular" width="63" height="88" />
          <Skeleton variant="rectangular" width="63" height="88" />
          <Skeleton variant="rectangular" width="63" height="88" />
          <Skeleton variant="rectangular" width="63" height="88" />
          <Skeleton variant="rectangular" width="63" height="88" />
          <Skeleton variant="rectangular" width="63" height="88" />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography level="h2" sx={{ mb: 2 }}>
        {deck.name}
      </Typography>
      <Typography level="body-md" sx={{ mb: 4 }}>
        {deck.description}
      </Typography>
      {/* Display more deck details here */}
      {/* Example: List of main deck cards */}
      <Typography level="h3" sx={{ mb: 2 }}>
        Main Deck
      </Typography>
      {/* Similarly, display boards, authors, etc. */}
    </Box>
  );
}
