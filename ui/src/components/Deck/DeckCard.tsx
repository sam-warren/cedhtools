import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme, Skeleton } from '@mui/joy';
import { ICardStat } from 'src/types';
import { useInView } from 'react-intersection-observer';
import { cardStyles, cardConstants } from 'src/styles';

interface DeckCardProps {
  card: ICardStat;
  showDetails?: boolean;
}

const DeckCard: React.FC<DeckCardProps> = ({ card, showDetails = true }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px 0px',
    triggerOnce: true,
  });
  const theme = useTheme();

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const openCardModal = (uniqueCardId: string) => {
    console.log(`Opening card modal for ${uniqueCardId}`);
  };

  useEffect(() => {
    if (inView && !isLoaded) {
      const img = new Image();
      img.src = card.image_uris.normal;
      img.onload = handleImageLoad;
      return () => {
        img.onload = null;
      };
    }
  }, [card.image_uris.normal, handleImageLoad, inView, isLoaded]);

  // Calculate performance metrics
  const winRateDiff =
    (card.performance.card_win_rate - card.performance.deck_win_rate) * 100;
  const formattedDiff =
    Math.abs(winRateDiff) < 0.005 ? 0 : winRateDiff.toFixed(2);
  const sign = Number(formattedDiff) > 0 ? '+' : '';
  const color =
    Number(formattedDiff) > 0
      ? 'success'
      : Number(formattedDiff) === 0
        ? 'primary'
        : 'danger';

  return (
    <Box
      ref={ref}
      sx={{
        ...cardStyles.container,
        mt: showDetails ? `${cardConstants.STATS_BANNER_HEIGHT}px` : 0,
      }}
    >
      <Box sx={cardStyles.wrapper}>
        {isLoaded && showDetails && (
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
          onClick={() => openCardModal(card.unique_card_id)}
        >
          {isLoaded ? (
            <Box
              component="img"
              src={card.image_uris.normal}
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

      {showDetails && (
        <Box sx={cardStyles.titleContainer}>
          {isLoaded ? (
            <Typography level="body-sm" sx={cardStyles.cardTitle}>
              {card.name}
            </Typography>
          ) : (
            <Skeleton variant="text" width="80%" />
          )}
        </Box>
      )}
    </Box>
  );
};

export default DeckCard;
