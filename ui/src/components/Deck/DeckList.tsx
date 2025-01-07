import { Box, Typography } from '@mui/joy';
import React, { useMemo, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAppSelector } from 'src/hooks';
import { useManaSymbols } from 'src/hooks/useManaSymbols';
import { cardTypeMap } from 'src/styles';
import { layoutStyles } from 'src/styles/layouts/list';
import { ICardStat, ICommanderStatisticsResponse } from 'src/types';
import DeckTable from './DeckTable';

interface LazyDeckTableProps {
  cards: ICardStat[];
  deckStats: ICommanderStatisticsResponse;
  label: string;
}


const LazyDeckTable = React.memo(
  ({ cards, deckStats, label }: LazyDeckTableProps) => {
    const { ref, inView } = useInView({
      triggerOnce: true,
      rootMargin: '200px 0px',
    });

    return (
      <Box ref={ref}>
        {inView ? (
          <DeckTable cards={cards} deckStats={deckStats} label={label} />
        ) : (
          <Box sx={{ height: 200 }} />
        )}
      </Box>
    );
  },
);


const DeckList = React.memo(function DeckList() {
  const { deckStats, isStatsLoading } = useAppSelector((state) => state.deck);
  const { isLoading: isManaLoading, isError } = useManaSymbols();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Handle initialization when data and symbols are ready
  useEffect(() => {
    if (!deckStats || isStatsLoading || isManaLoading) {
      setIsReady(false);
      return;
    }

    // When data is ready, first ensure initialization
    if (!isInitialized) {
      setIsInitialized(true);
      // Small delay to allow DOM to stabilize
      const initTimer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(initTimer);
    }

    // For subsequent data updates, add a small delay
    const updateTimer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(updateTimer);
  }, [deckStats, isStatsLoading, isManaLoading, isInitialized]);

  // Memoize the filtered sections
  const sections = useMemo(() => {
    if (!deckStats) return [];
    return Object.entries(deckStats.card_statistics.main)
      .filter(([, cards]) => cards.length > 0)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [deckStats]);

  if (!deckStats) return null;
  if (isManaLoading) return <Typography>Loading mana symbols...</Typography>;
  if (isError)
    return <Typography color="danger">Error loading mana symbols</Typography>;

  return (
    <Box
      sx={{
        ...layoutStyles.container,
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <Box sx={layoutStyles.mainSection}>
        {sections.map(([typeCode, cards], index) => (
          <Box
            key={typeCode}
            sx={{
              ...layoutStyles.sectionContainer,
              opacity: isInitialized ? 1 : 0,
              transform: isInitialized ? 'none' : 'translateY(20px)',
              transition:
                'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
              transitionDelay: `${index * 50}ms`,
            }}
          >
            <Box sx={layoutStyles.tableContainer}>
              <LazyDeckTable
                cards={cards}
                deckStats={deckStats}
                label={cardTypeMap[typeCode] || `Type ${typeCode}`}
              />
            </Box>
          </Box>
        ))}
      </Box>

      {deckStats.card_statistics.other.length > 0 && (
        <Box
          sx={{
            opacity: isInitialized ? 1 : 0,
            transform: isInitialized ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            transitionDelay: `${sections.length * 50}ms`,
          }}
        >
          <LazyDeckTable
            cards={deckStats.card_statistics.other}
            deckStats={deckStats}
            label={cardTypeMap.other}
          />
        </Box>
      )}
    </Box>
  );
});


export default DeckList;


