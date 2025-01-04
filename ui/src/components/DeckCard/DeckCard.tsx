import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme, Skeleton } from '@mui/joy';
import { ICardStat, } from 'src/types';
import { useInView } from 'react-intersection-observer';

interface DeckCardProps {
  card: ICardStat;
  showDetails?: boolean;
}

const DeckCard: React.FC<DeckCardProps> = ({ 
  card, 
  showDetails = true, 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({ 
    threshold: 0,
    rootMargin: '200px 0px',
    triggerOnce: true
  });
  const theme = useTheme();

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

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

  const CORNER_RADIUS_RATIO = 2.5 / 63;

  const winRateDiff = ((card.performance.card_win_rate - card.performance.deck_win_rate) * 100).toFixed(1);
  const sign = Number(winRateDiff) >= 0 ? '+' : '';
  
  // Determine color based on positive/negative difference
  const color = Number(winRateDiff) >= 0 ? 'success' : 'danger';

  const BANNER_HEIGHT = '24px'; // Increased height for better text visibility
  const BANNER_OVERLAP = '3px';

  return (
    <Box 
      ref={ref} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        paddingTop: showDetails ? `calc(${BANNER_HEIGHT} - ${BANNER_OVERLAP})` : 0,
      }}
    >
      <Box sx={{ width: '100%', position: 'relative' }}>
        {/* Win rate difference banner */}
        {isLoaded && showDetails && (
          <Box
            sx={{
              position: 'absolute',
              top: `-${BANNER_HEIGHT}`,
              left: 0,
              right: 0,
              height: BANNER_HEIGHT,
              bgcolor: `${color}.softActiveBg`,
              borderTopLeftRadius: `${CORNER_RADIUS_RATIO * 100}%`,
              borderTopRightRadius: `${CORNER_RADIUS_RATIO * 100}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1, // Ensure banner stays above other cards
              '&::before': {
                // Extension block that connects with the card
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '6px', // Taller extension to ensure connection
                bgcolor: 'inherit',
              }
            }}
          >
            <Typography
              level="body-xs"
              color={color}
              fontWeight="lg"
              sx={{ transform: 'translateY(-1px)' }} // Slight adjustment for visual centering
            >
              {sign}{winRateDiff}%
            </Typography>
          </Box>
        )}
        
        {/* Card image */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '63/88',
            borderRadius: `${CORNER_RADIUS_RATIO * 100}%`,
            overflow: 'hidden',
            backgroundColor: theme.palette.background.level2,
          }}
        >
          {isLoaded ? (
            <img
              src={card.image_uris.normal}
              alt={card.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              sx={{ display: 'block' }}
            />
          )}
        </Box>
      </Box>

      {showDetails && (
        <Box 
          sx={{ 
            width: '100%',
            mt: 1,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {isLoaded ? (
            <Typography
              level="body-sm"
              sx={{
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                textAlign: 'center'
              }}
            >
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