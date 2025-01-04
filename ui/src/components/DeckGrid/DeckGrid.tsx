import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/joy';
import { ICardStat } from 'src/types';
import DeckSection from '../DeckSection/DeckSection';

interface DeckGridProps {
  cardStatistics: Record<string, ICardStat[]>;
}

interface Section {
  typeCode: string;
  cards: ICardStat[];
}

const DeckGrid: React.FC<DeckGridProps> = ({ cardStatistics }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Section[][]>([]);
  
  const CARD_WIDTH = 200; // Width of each card
  const CARD_GAP = 16; // Gap between cards

  const calculateLayout = (containerWidth: number) => {
    // Calculate how many cards can fit in a row
    const cardsPerRow = Math.floor(containerWidth / (CARD_WIDTH + CARD_GAP));
    if (cardsPerRow === 0) return []; // Guard against division by zero

    // A section is "small" if all its cards can fit in a single row
    const isSmallSection = (cards: ICardStat[]) => cards.length <= cardsPerRow;

    // Group sections into rows
    return Object.entries(cardStatistics)
      .sort(([aCode], [bCode]) => parseInt(aCode) - parseInt(bCode))
      .reduce<Section[][]>((rows, [typeCode, cards]) => {
        const currentSection = { typeCode, cards };
        const lastRow = rows[rows.length - 1];

        if (!lastRow || !isSmallSection(cards) || !isSmallSection(lastRow[0].cards)) {
          // Start a new row if:
          // - This is the first section
          // - Current section needs multiple rows
          // - Last row's section needs multiple rows
          rows.push([currentSection]);
        } else {
          // Calculate total cards in the current row
          const totalCardsInRow = lastRow.reduce((sum, section) => 
            sum + section.cards.length, 0);
          
          // Add to existing row if there's space
          if (totalCardsInRow + cards.length <= cardsPerRow) {
            lastRow.push(currentSection);
          } else {
            // Start new row if no space
            rows.push([currentSection]);
          }
        }
        
        return rows;
      }, []);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const updateLayout = () => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const newRows = calculateLayout(containerWidth);
      setRows(newRows);
    };

    // Initial calculation
    updateLayout();

    // Create ResizeObserver to watch container size changes
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(containerRef.current);

    // Clean up
    return () => {
      resizeObserver.disconnect();
    };
  }, [cardStatistics]); // Recalculate when cardStatistics changes

  return (
    <Box 
      ref={containerRef} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3,
        width: '100%'
      }}
    >
      {rows.map((row, rowIndex) => (
        <Box 
          key={rowIndex}
          sx={{ 
            display: 'flex',
            gap: 3,
            // If there's only one section in the row or it has many cards,
            // let it take full width. Otherwise, keep sections to their content width
            '& > div': row.length === 1 
              ? { flex: '1 1 100%' }
              : { width: 'min-content' }
          }}
        >
          {row.map(({ typeCode, cards }) => (
            <Box key={typeCode}>
              <DeckSection 
                typeCode={typeCode} 
                cards={cards}
              />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default DeckGrid;