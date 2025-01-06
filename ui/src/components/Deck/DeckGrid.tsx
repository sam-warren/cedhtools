import { Box, Skeleton } from '@mui/joy';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAppSelector } from 'src/hooks';
import { getSortedSections, organizeRows } from 'src/utilities/gridUtils';
import DeckSection from './DeckSection';

const CARD_WIDTH = 200;
const CARD_GAP = 16;

function DeckGridSkeleton() {
  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
        }}
      >
        {/* Simulate 3 rows */}
        {Array.from({ length: 3 }).map((_, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: 'flex',
              gap: 3,
              minHeight: '300px',
            }}
          >
            {/* Each row has 2-3 sections */}
            {Array.from({ length: rowIndex === 1 ? 3 : 2 }).map(
              (_, sectionIndex) => (
                <Box
                  key={sectionIndex}
                  sx={{
                    flex: rowIndex === 0 ? '1 1 100%' : 'none',
                    width: rowIndex === 0 ? 'auto' : `${CARD_WIDTH}px`,
                  }}
                >
                  <Box>
                    <Skeleton
                      variant="text"
                      width="200px"
                      height="32px"
                      sx={{ mb: 2 }}
                    />
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          rowIndex === 0
                            ? 'repeat(auto-fill, minmax(200px, 1fr))'
                            : '1fr',
                        gap: 2,
                      }}
                    >
                      {/* First row shows more cards, others show fewer */}
                      {Array.from({ length: rowIndex === 0 ? 5 : 2 }).map(
                        (_, i) => (
                          <Skeleton
                            key={i}
                            variant="rectangular"
                            width="100%"
                            height="280px"
                            sx={{ borderRadius: '8px' }}
                          />
                        ),
                      )}
                    </Box>
                  </Box>
                </Box>
              ),
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function DeckGrid() {
  const { deckStats } = useAppSelector((state) => state.deck);
  if (!deckStats) return null;
  console.log('DeckGrid rendering with deckStats:', deckStats?.card_statistics);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardsPerRow, setCardsPerRow] = useState(5);
  const { ref: gridRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

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
        {rows.map((row, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: 'flex',
              gap: 3,
              minHeight: '300px', // Maintain height during loading
              '& > div':
                row.length === 1
                  ? { flex: '1 1 100%' }
                  : { width: 'min-content' },
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
                  // Placeholder skeleton that maintains space
                  <Box>
                    <Skeleton
                      variant="text"
                      width="200px"
                      height="32px"
                      sx={{ mb: 2 }}
                    />
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 2,
                      }}
                    >
                      {Array(Math.min(cards.length, cardsPerRow))
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton
                            key={i}
                            variant="rectangular"
                            width="100%"
                            height="280px"
                            sx={{ borderRadius: '8px' }}
                          />
                        ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

DeckGrid.Skeleton = DeckGridSkeleton;
export default DeckGrid;