import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAppSelector } from 'src/hooks';
import { getSortedSections, organizeRows } from 'src/utilities/gridUtils';
import DeckSection from './DeckSection';

const CARD_WIDTH = 200;
const CARD_GAP = 16;

const GridRow = React.memo(function GridRow({
  row,
  inView,
}: {
  row: { typeCode: string; cards: any[] }[];
  inView: boolean;
}) {
  return (
    <div className="flex gap-3 min-h-[300px] [&>div]:w-min-content [&>div:only-child]:flex-1">
      {row.map(({ typeCode, cards }) => (
        <div
          key={typeCode}
          className={`${
            row.length === 1 ? 'flex-1' : `w-[${CARD_WIDTH}px]`
          }`}
        >
          {inView && <DeckSection typeCode={typeCode} cards={cards} />}
        </div>
      ))}
    </div>
  );
});

const DeckGrid = React.memo(function DeckGrid() {
  const { deckStats } = useAppSelector((state) => state.deck);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const rows = useMemo(() => {
    if (!deckStats || !containerWidth) return [];
    const sections = getSortedSections(deckStats);
    return organizeRows(sections, containerWidth, CARD_WIDTH, CARD_GAP);
  }, [deckStats, containerWidth]);

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const { ref, inView } = useInView({
          triggerOnce: true,
          rootMargin: '200px 0px',
        });

        return (
          <div ref={ref} key={index}>
            <GridRow row={row} inView={inView} />
          </div>
        );
      })}
    </div>
  );
});

export default DeckGrid;
