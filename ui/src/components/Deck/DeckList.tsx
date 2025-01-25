import React, { useMemo } from 'react';
import { useAppSelector } from 'src/hooks';
import { useManaSymbols } from 'src/hooks/useManaSymbols';
import { cardTypeMap } from 'src/styles';
import LazyDeckTable from './DeckTable';

const DeckList = React.memo(function DeckList() {
  const { deckStats, isStatsLoading } = useAppSelector((state) => state.deck);
  const { isLoading: isManaLoading, isError } = useManaSymbols();

  const sections = useMemo(() => {
    if (!deckStats) return [];
    return Object.entries(deckStats.card_statistics.main)
      .filter(([, cards]) => cards.length > 0)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [deckStats]);

  if (!deckStats) return null;
  if (isManaLoading) return <p className="text-gray-600 dark:text-gray-300">Loading mana symbols...</p>;
  if (isError) return <p className="text-red-600 dark:text-red-400">Error loading mana symbols</p>;

  return (
    <div className="w-full">
      <div className="mb-6 mt-4">
        {sections.map(([typeCode, cards]) => (
          <div key={typeCode} className="mb-4">
            <div>
              <LazyDeckTable
                cards={cards}
                deckStats={deckStats}
                label={cardTypeMap[typeCode] || `Type ${typeCode}`}
              />
            </div>
          </div>
        ))}
      </div>

      {deckStats.card_statistics.other.length > 0 && (
        <div>
          <LazyDeckTable
            cards={deckStats.card_statistics.other}
            deckStats={deckStats}
            label={cardTypeMap.other}
          />
        </div>
      )}
    </div>
  );
});

export default DeckList;
