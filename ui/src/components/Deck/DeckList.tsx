import { Box, Skeleton, Typography } from '@mui/joy';
import { useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAppSelector } from 'src/hooks';
import { useManaSymbols } from 'src/hooks/useManaSymbols';
import { cardTypeMap } from 'src/styles';
import { layoutStyles } from 'src/styles/layouts/list';
import { ICardStat, ICommanderStatisticsResponse } from 'src/types';
import DeckTable from './DeckTable';

// TODO: Fix lists not showing up
interface LazyDeckTableProps {
  cards: ICardStat[];
  deckStats: ICommanderStatisticsResponse;
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

function DeckListSkeleton() {
  return (
    <Box sx={layoutStyles.container}>
      <Box sx={layoutStyles.mainSection}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              ...layoutStyles.sectionContainer,
              mb: 2,
            }}
          >
            <Box sx={layoutStyles.tableContainer}>
              <Typography level="h3" sx={{ mb: 2 }}>
                <Skeleton width={150} />
              </Typography>
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <Box
                  key={cardIndex}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Skeleton width={30} />
                  <Skeleton width={200} />
                  <Skeleton width={100} />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function DeckList() {
  const { deckStats } = useAppSelector((state) => state.deck);
  console.log('DeckList rendering with deckStats:', deckStats?.card_statistics);

  const { isLoading, isError } = useManaSymbols();
  const initialized = useRef(false);

  // Memoize the filtered sections
  const sections = useMemo(() => {
    if (!deckStats) return [];
    console.log(
      'Recalculating sections with sample size:',
      deckStats.meta_statistics.sample_size,
    );
    return Object.entries(deckStats.card_statistics.main)
      .filter(([, cards]) => cards.length > 0)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [deckStats]);

  if (!deckStats) return null;
  if (isLoading) return <Typography>Loading mana symbols...</Typography>;
  if (isError)
    return <Typography color="danger">Error loading mana symbols</Typography>;

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

DeckList.Skeleton = DeckListSkeleton;

export default DeckList;
