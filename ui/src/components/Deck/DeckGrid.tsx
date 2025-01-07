import { Box, Skeleton } from '@mui/joy';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAppSelector } from 'src/hooks';
import { getSortedSections, organizeRows } from 'src/utilities/gridUtils';
import DeckSection from './DeckSection';

const CARD_WIDTH = 200;
const CARD_GAP = 16;

const GridRow = React.memo(function GridRow({
  row,
  cardsPerRow,
  inView,
}: {
  row: { typeCode: string; cards: any[] }[];
  cardsPerRow: number;
  inView: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 3,
        minHeight: '300px',
        '& > div':
          row.length === 1 ? { flex: '1 1 100%' } : { width: 'min-content' },
      }}
    >
      {row.map(({ typeCode, cards }) => (
        <Box
          key={typeCode}
          sx={{
            flex: row.length === 1 ? '1 1 100%' : 'none',
            width: row.length > 1 ? `${CARD_WIDTH}px` : 'auto',
          }}
        >
          {inView ? (
            <DeckSection typeCode={typeCode} cards={cards} />
          ) : (
            <Box></Box>
          )}
        </Box>
      ))}
    </Box>
  );
});

const DeckGrid = React.memo(function DeckGrid() {
  const { deckStats, isStatsLoading } = useAppSelector((state) => state.deck);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardsPerRow, setCardsPerRow] = useState(5);
  const { ref: gridRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  if (!deckStats) return null;

  useEffect(() => {
    if (!deckStats || isStatsLoading) {
      setIsReady(false);
      return;
    }

    if (!isInitialized) {
      setIsInitialized(true);
      const initTimer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(initTimer);
    }

    const updateTimer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(updateTimer);
  }, [deckStats, isStatsLoading, isInitialized]);

  // Memoize sections with a more specific dependency
  const sortedSections = useMemo(() => {
    if (!deckStats.card_statistics) return [];
    return getSortedSections(deckStats.card_statistics);
  }, [deckStats]);

  // Memoize row organization
  const rows = useMemo(() => {
    return organizeRows(sortedSections, cardsPerRow);
  }, [sortedSections, cardsPerRow]);

  // Debounced resize handler
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCardsPerRow = _.debounce(() => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const newCardsPerRow = Math.max(
        1,
        Math.floor(containerWidth / (CARD_WIDTH + CARD_GAP)),
      );
      setCardsPerRow(newCardsPerRow);
    }, 100);

    const resizeObserver = new ResizeObserver(updateCardsPerRow);
    resizeObserver.observe(containerRef.current);

    // Initial calculation
    updateCardsPerRow();

    return () => {
      resizeObserver.disconnect();
      updateCardsPerRow.cancel();
    };
  }, []);

  if (!deckStats || sortedSections.length === 0) return null;

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        position: 'relative',
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <Box
        ref={gridRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
        }}
      >
        {rows.map((row, index) => (
          <GridRow
            key={index}
            row={row}
            cardsPerRow={cardsPerRow}
            inView={inView}
          />
        ))}
      </Box>
    </Box>
  );
});

export default DeckGrid;
