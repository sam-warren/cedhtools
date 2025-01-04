import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box } from '@mui/joy';
import { ICardStat } from 'src/types';
import DeckSection from './DeckSection';
import _ from 'lodash';

interface DeckGridProps {
  cardStatistics: Record<string, ICardStat[]>;
}

interface Section {
  typeCode: string;
  cards: ICardStat[];
}

const DeckGrid: React.FC<DeckGridProps> = ({ cardStatistics }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardsPerRow, setCardsPerRow] = useState<number>(5); // Default to 5
  
  const CARD_WIDTH = 200;
  const CARD_GAP = 16;

  // Memoize the sorted sections, filtering out empty sections
  const sortedSections = useMemo(() => 
    Object.entries(cardStatistics)
      .filter(([, cards]) => cards.length > 0) // Filter out sections with no cards
      .sort(([aCode], [bCode]) => parseInt(aCode) - parseInt(bCode))
      .map(([typeCode, cards]) => ({ typeCode, cards })),
    [cardStatistics]
  );

  // Memoize the row organization based on cardsPerRow
  const rows = useMemo(() => {
    const isSmallSection = (cards: ICardStat[]) => cards.length <= cardsPerRow;
    
    return sortedSections.reduce<Section[][]>((rows, section) => {
      const lastRow = rows[rows.length - 1];

      if (!lastRow || !isSmallSection(section.cards) || !isSmallSection(lastRow[0].cards)) {
        rows.push([section]);
      } else {
        const totalCardsInRow = lastRow.reduce((sum, s) => sum + s.cards.length, 0);
        
        if (totalCardsInRow + section.cards.length <= cardsPerRow) {
          lastRow.push(section);
        } else {
          rows.push([section]);
        }
      }
      
      return rows;
    }, []);
  }, [sortedSections, cardsPerRow]);

  // Debounced resize handler
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCardsPerRow = _.debounce(() => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const newCardsPerRow = Math.max(1, Math.floor(containerWidth / (CARD_WIDTH + CARD_GAP)));
      setCardsPerRow(newCardsPerRow);
    }, 0);

    const resizeObserver = new ResizeObserver(updateCardsPerRow);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      updateCardsPerRow.cancel();
    };
  }, []);

  // If there are no sections with cards, return null
  if (sortedSections.length === 0) {
    return null;
  }

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          width: '100%',
        }}
      >
        {rows.map((row, rowIndex) => (
          <Box 
            key={rowIndex}
            sx={{ 
              display: 'flex',
              gap: 3,
              '& > div': row.length === 1 
                ? { flex: '1 1 100%' }
                : { width: 'min-content' },
            }}
          >
            {row.map(({ typeCode, cards }) => (
              <Box 
                key={typeCode}
                sx={{
                  opacity: 1,
                  transform: 'translateZ(0)', // Force GPU acceleration
                }}
              >
                <DeckSection 
                  typeCode={typeCode} 
                  cards={cards}
                />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DeckGrid;