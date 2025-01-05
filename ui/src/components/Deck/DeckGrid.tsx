import { useEffect, useRef, useState, useMemo } from 'react';
import { Box } from '@mui/joy';
import { ICardStat } from 'src/types';
import DeckSection from './DeckSection';
import _ from 'lodash';
import { useAppSelector } from 'src/hooks';

interface Section {
  typeCode: string;
  cards: ICardStat[];
}

export default function DeckGrid() {
  const { deckStats } = useAppSelector((state) => state.deck);

  if (!deckStats) return null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardsPerRow, setCardsPerRow] = useState<number>(5); // Default to 5

  const CARD_WIDTH = 200;
  const CARD_GAP = 16;

  // Memoize the sorted sections, filtering out empty sections
  const sortedSections = useMemo(() => {
    const mainSections = Object.entries(deckStats.card_statistics.main)
      .filter(([, cards]) => cards.length > 0) // Filter out sections with no cards
      .sort(([aCode], [bCode]) => parseInt(aCode) - parseInt(bCode))
      .map(([typeCode, cards]) => ({ typeCode, cards }));

    const otherCards =
      deckStats.card_statistics.other.length > 0
        ? [
            {
              typeCode: 'other',
              cards: deckStats.card_statistics.other
                .filter((card) => card.legality === 'legal')
                .sort((a, b) => b.decks_with_card - a.decks_with_card),
            },
          ]
        : [];

    return [...mainSections, ...otherCards];
  }, [deckStats.card_statistics]);

  // Memoize the row organization based on cardsPerRow
  const rows = useMemo(() => {
    const isSmallSection = (cards: ICardStat[]) => cards.length <= cardsPerRow;

    return sortedSections.reduce<Section[][]>((rows, section) => {
      const lastRow = rows[rows.length - 1];

      if (
        !lastRow ||
        !isSmallSection(section.cards) ||
        !isSmallSection(lastRow[0].cards)
      ) {
        rows.push([section]);
      } else {
        const totalCardsInRow = lastRow.reduce(
          (sum, s) => sum + s.cards.length,
          0,
        );

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
      const newCardsPerRow = Math.max(
        1,
        Math.floor(containerWidth / (CARD_WIDTH + CARD_GAP)),
      );
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
              '& > div':
                row.length === 1
                  ? { flex: '1 1 100%' }
                  : { width: 'min-content' },
            }}
          >
            {row.map(({ typeCode, cards }) => (
              <Box key={typeCode}>
                <DeckSection typeCode={typeCode} cards={cards} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
