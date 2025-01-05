import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from 'src/contexts/LoadingContext';
import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { getDeckStats } from 'src/services';
import { getDecklistById } from 'src/services/moxfield/moxfield';
import { ICommanderStatisticsResponse, IMoxfieldDeck } from 'src/types';
import DeckGrid from 'src/components/Deck/DeckGrid';
import DeckBanner from 'src/components/Deck/DeckBanner';
import DeckSkeleton from 'src/components/Deck/DeckSkeleton';
import { DeckPageLayout } from 'src/components/Layout/DeckPageLayout';
import CommanderDetails from 'src/components/Deck/CommanderDetails';
import ErrorModal from 'src/components/Feedback/ErrorModal';

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<IMoxfieldDeck | null>(null);
  const [deckStats, setDeckStats] =
    useState<ICommanderStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addSearch } = useSearchHistory();
  const { setLoading } = useLoading();

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setDeck(null);
    setDeckStats(null);
    try {
      // Fetch deck
      const deckResponse = await getDecklistById(id);
      if (!deckResponse.success) {
        throw new Error('Failed to fetch deck details');
      }
      setDeck(deckResponse.data);
      addSearch({
        name: deckResponse.data.name,
        publicId: deckResponse.data.publicId,
        publicUrl: deckResponse.data.publicUrl,
      });
      // Fetch stats
      const statsResponse = await getDeckStats(deckResponse.data.publicId);
      if (!statsResponse.success) {
        throw new Error('Failed to fetch deck statistics');
      }
      setDeckStats(statsResponse.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleClose = () => {
    setError(null);
  }

  const renderContent = () => {
    if (!deck || !deckStats || isLoading) {
      return (
        <>
          <DeckSkeleton />
          <ErrorModal
            message={error || ''}
            onRetry={fetchData}
            onClose={handleClose}
            open={Boolean(error)}
          />
        </>
      );
    }

    return (
      <DeckPageLayout
        banner={<DeckBanner deck={deck} />}
        leftPane={<CommanderDetails deckStats={deckStats} />}
        rightPane={<DeckGrid cardStatistics={deckStats.card_statistics.main} />}
      />
    );
  };

  return renderContent();
}
