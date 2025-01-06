import { Box, Typography } from '@mui/joy';
import { useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAppSelector } from 'src/hooks';
import { useManaSymbols } from 'src/hooks/useManaSymbols';
import { cardTypeMap } from 'src/styles';
import { layoutStyles } from 'src/styles/layouts/list';
import { ICardStat } from 'src/types';
import DeckTable from './DeckTable';

interface LazyDeckTableProps {
  cards: ICardStat[];
  deckStats: any; // Type this based on your deckStats structure
  label: string;
}

const LazyDeckTable: React.FC<LazyDeckTableProps> = ({
  cards,
  deckStats,
  label,
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  return (
    <Box ref={ref}>
      {inView ? (
        <DeckTable cards={cards} deckStats={deckStats} label={label} />
      ) : (
        <Box sx={{ height: 200 }} /> // Placeholder height
      )}
    </Box>
  );
};

export default function DeckList() {
  const { deckStats } = useAppSelector((state) => state.deck);
  const { isLoading, isError } = useManaSymbols();
  const initialized = useRef(false);

  // Memoize the filtered sections
  const sections = useMemo(() => {
    if (!deckStats) return [];

    return Object.entries(deckStats.card_statistics.main)
      .filter(([, cards]) => cards.length > 0)
      .sort(([a], [b]) => parseInt(a) - parseInt(b)); // Sort by type code
  }, [deckStats]);

  if (!deckStats) return null;
  if (isLoading) return <Typography>Loading mana symbols...</Typography>;
  if (isError)
    return <Typography color="danger">Error loading mana symbols</Typography>;

  // Set initialized on first render
  if (!initialized.current) {
    initialized.current = true;
  }

  return (
    <Box
      sx={{
        ...layoutStyles.container,
        opacity: initialized.current ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <Box sx={layoutStyles.mainSection}>
        {sections.map(([typeCode, cards], index) => (
          <Box
            key={typeCode}
            sx={{
              ...layoutStyles.sectionContainer,
              opacity: initialized.current ? 1 : 0,
              transform: initialized.current ? 'none' : 'translateY(20px)',
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
            opacity: initialized.current ? 1 : 0,
            transform: initialized.current ? 'none' : 'translateY(20px)',
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
}
