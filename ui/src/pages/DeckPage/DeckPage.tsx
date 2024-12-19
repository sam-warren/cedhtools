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
    showAlert('This is a test alert', 'danger');
    setLoading(true);
    if (id) {
      const fetchDeck = async () => {
        try {
          const response: IApiResponse<IMoxfieldDeck> =
            await getDecklistById(id);
          if (response.success) {
            setDeck(response.data);
            addSearch({
              name: response.data.name,
              publicId: response.data.publicId,
              publicUrl: response.data.publicUrl,
            });
          } else {
            console.error('Failed to fetch deck: ', response.error);
          }
        } catch (err: any) {
          console.error('Failed to fetch deck: ', err.message);
        }
      };
      fetchDeck();
    }
  }, []);

  useEffect(() => {
    if (deck) {
      try {
        const commander_ids = Object.keys(deck.boards['commanders']['cards']);
        if (commander_ids && commander_ids.length > 0) {
          getDeckStats(commander_ids).then(
            (response: IApiResponse<ICommanderStats>) => {
              if (response.success) {
                console.log('deck stats: ', response.data);
                setDeckStats(response.data);
              } else {
                console.error('Failed to fetch deck stats: ', response.error);
              }
            },
          );
        }
      } catch (err: any) {
        console.error('Failed to fetch deck stats: ', err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [deck]);

  if (!deck) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography level="h2">Loading...</Typography>
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
