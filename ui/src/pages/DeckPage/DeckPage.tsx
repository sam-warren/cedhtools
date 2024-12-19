import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { getDecklistById } from 'src/services/moxfield/moxfield';
import { IApiResponse, IMoxfieldDeck } from 'src/types';

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<IMoxfieldDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addSearch } = useSearchHistory();

  useEffect(() => {
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
            setError(response.error);
          }
        } catch (err: any) {
          setError(err.message || 'An error occurred');
        } finally {
          // setLoading(false);
        }
      };
      fetchDeck();
    }
  }, [id, addSearch]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="danger">Error: {error}</Typography>
      </Box>
    );
  }

  if (!deck) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="neutral">Deck not found.</Typography>
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
