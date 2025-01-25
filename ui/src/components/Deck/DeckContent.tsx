import { Info } from 'lucide-react';
import { useAppSelector } from 'src/hooks';
import DeckGrid from './DeckGrid';
import DeckList from './DeckList';
import DeckViewToggle from './DeckViewToggle';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

const NoDataAlert = () => (
  <div className="flex gap-2 mb-2 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
    <Info className="w-5 h-5" />
    <div>
      <h4 className="font-medium">No data found</h4>
      <p className="text-sm">
        We don't have enough data for this commander given the search filter
        criteria.
      </p>
    </div>
  </div>
);

const CardDisplay = ({ viewMode }: { viewMode: 'list' | 'grid' }) => (
  <div className="grid [&>div]:opacity-0 [&>div]:invisible [&>div]:transition-all [&>div]:duration-200 [&>div[data-active=true]]:opacity-100 [&>div[data-active=true]]:visible">
    <div data-active={viewMode === 'list'}>
      <DeckList />
    </div>
    <div data-active={viewMode === 'grid'}>
      <DeckGrid />
    </div>
  </div>
);

export default function DeckContent() {
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);
  const { deckStats, isStatsLoading } = useAppSelector((state) => state.deck);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <DeckViewToggle />
      </div>
      {!deckStats && !isStatsLoading && <NoDataAlert />}
      <CardDisplay viewMode={viewMode} />
    </div>
  );
}
