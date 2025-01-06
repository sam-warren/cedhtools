import { Box, Skeleton, Typography, useTheme } from '@mui/joy';
import React from 'react';
import { useInView } from 'react-intersection-observer';
import { useImageCache } from 'src/hooks/useImageCache';
import { cardStyles } from 'src/styles';
import { ICardStat } from 'src/types';

interface DeckCardProps {
  card: ICardStat;
}

const DeckCard: React.FC<DeckCardProps> = ({ card }) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px 0px',
    triggerOnce: true,
  });
  const theme = useTheme();

  // Use the new image caching hook
  const { src: cachedSrc, isLoading } = useImageCache(
    card.scryfall_id,
    card.image_uris.normal,
  );

  // Calculate performance metrics
  const formattedDiff =
    Math.abs(card.performance.win_rate_diff) < 0.005 ? 0 : card.performance.win_rate_diff.toFixed(2);
  const sign = Number(formattedDiff) > 0 ? '+' : '';
  const color =
    Number(formattedDiff) > 0
      ? 'success'
      : Number(formattedDiff) === 0
        ? 'primary'
        : 'danger';

  return (
    <Box ref={ref} sx={cardStyles.cardContainer('deck')}>
      <Box sx={cardStyles.wrapper}>
        {!isLoading && (
          <Box sx={cardStyles.banner(color)}>
            <Typography level="body-xs" color={color} fontWeight="lg">
              {sign}
              {formattedDiff}% | in {card.decks_with_card} deck
              {card.decks_with_card > 1 ? 's' : ''}
            </Typography>
          </Box>
        )}

        <Box
          sx={cardStyles.imageContainer(theme, 'deck')}
          onClick={() =>
            console.log(`Opening card modal for ${card.unique_card_id}`)
          }
        >
          {!isLoading ? (
            <Box
              component="img"
              src={cachedSrc}
              alt={card.name}
              sx={cardStyles.image}
            />
          ) : (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              sx={cardStyles.image}
            />
          )}
        </Box>
      </Box>
      <Box sx={cardStyles.titleContainer}>
        {!isLoading ? (
          <Typography level="body-sm" sx={cardStyles.cardTitle}>
            {card.name}
          </Typography>
        ) : (
          <Skeleton variant="text" width="80%" />
        )}
      </Box>
    </Box>
  );
};

export default React.memo(DeckCard);
