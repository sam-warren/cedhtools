import { Box, Skeleton, Typography, useTheme } from '@mui/joy';
import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAppSelector } from 'src/hooks';
import { useImageCache } from 'src/hooks/useImageCache';
import { cardStyles } from 'src/styles';
import { ICardStat } from 'src/types';
import ImageWithLoading from './ImageWithLoading';

interface DeckCardProps {
  card: ICardStat;
}

const DeckCard: React.FC<DeckCardProps> = ({ card }) => {
  // Hooks
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px 0px',
    triggerOnce: true,
  });
  const theme = useTheme();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { isStatsLoading } = useAppSelector((state) => state.deck);
  const { src: cachedSrc } = useImageCache(
    card.scryfall_id,
    card.image_uris.normal,
    inView,
  );

  // Calculate performance metrics
  const formattedDiff =
    Math.abs(card.performance.win_rate_diff) < 0.005
      ? 0
      : card.performance.win_rate_diff.toFixed(2);
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
        <Box
          sx={{
            position: 'relative',
            zIndex: isImageLoaded ? 2 : 1,
            transition: 'z-index 0s',
            transitionDelay: isImageLoaded ? '0s' : '0.5s',
          }}
        >
          <Box
            sx={{
              ...cardStyles.banner(color),
              opacity: isImageLoaded ? 1 : 0,
              transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {isStatsLoading ? (
              <Typography
                level="body-xs"
                color={color}
                fontWeight="lg"
                sx={{
                  '&::after': {
                    animation:
                      'animation-c7515d 1.5s ease-in-out 0.5s infinite',
                  },
                }}
              >
              </Typography>
            ) : (
              <Typography level="body-xs" color={color} fontWeight="lg">
                {sign}
                {formattedDiff}% | in {card.decks_with_card} deck
                {card.decks_with_card > 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          sx={cardStyles.imageContainer(theme, 'deck')}
          onClick={() =>
            console.log(`Opening card modal for ${card.unique_card_id}`)
          }
        >
          {inView ? (
            <ImageWithLoading
              src={cachedSrc}
              alt={card.name}
              sx={cardStyles.image('deck')}
              onLoad={() => setIsImageLoaded(true)}
            />
          ) : (
            <Skeleton
              variant="rectangular"
              animation="pulse"
              width="100%"
              height="100%"
              sx={cardStyles.image('commander')}
            />
          )}
        </Box>
      </Box>
      <Box sx={cardStyles.titleContainer}>
        <Box
          sx={{
            width: '100%',
            minHeight: '1.75rem',
          }}
        >
          <Typography
            level="body-sm"
            sx={{
              ...cardStyles.cardTitle,
              opacity: isImageLoaded ? 1 : 0.7,
              transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {card.name}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(DeckCard, (prevProps, nextProps) => {
  return prevProps.card.unique_card_id === nextProps.card.unique_card_id;
});
