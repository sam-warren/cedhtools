import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme, Skeleton } from '@mui/joy';
import { ICardStat } from 'src/types';
import { useInView } from 'react-intersection-observer';

interface DeckCardProps {
  card: ICardStat;
  showDetails?: boolean;
}

const DeckCard: React.FC<DeckCardProps> = ({ card, showDetails = true }) => {
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
      return () => { img.onload = null; };
    }
  }, [card.image_uris.normal, handleImageLoad, inView, isLoaded]);

  const CORNER_RADIUS_RATIO = 2.5 / 63;
  const BANNER_HEIGHT = 24; // px
  const CORNER_HEIGHT = 200; // % of width to px estimation

  const winRateDiff = ((card.performance.card_win_rate - card.performance.deck_win_rate) * 100).toFixed(2);
  const sign = Number(winRateDiff) > 0 ? '+' : Number(winRateDiff) === 0 ? '' :  '';
  const color = Number(winRateDiff) > 0 ? 'success' : Number(winRateDiff) === 0 ? 'primary' : 'danger';


  return (
    <Box 
      ref={ref} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        mt: showDetails ? `${BANNER_HEIGHT}px` : 0,
      }}
    >
      <Box 
        sx={{ 
          width: '100%', 
          position: 'relative',
        }}
      >
        {/* Win rate difference banner */}
        {isLoaded && showDetails && (
          <Box
            sx={{
              position: 'absolute',
              top: `-${BANNER_HEIGHT}px`,
              left: 0,
              right: 0,
              height: `${BANNER_HEIGHT + CORNER_HEIGHT}px`,
              bgcolor: `${color}.softBg`,
              borderTopLeftRadius: `${CORNER_RADIUS_RATIO * 100}%`,
              borderTopRightRadius: `${CORNER_RADIUS_RATIO * 100}%`,
              display: 'flex',
              alignItems: 'flex-start', // Align to top
              justifyContent: 'center',
              paddingTop: '4px', // Adjust text position from top
              clipPath: `
                polygon(
                  0 0,
                  100% 0,
                  100% 100%,
                  0 100%
                )
              `,
            }}
          >
            <Typography
              level="body-xs"
              color={color}
              fontWeight="lg"
            >
              {sign}{winRateDiff}%
            </Typography>
          </Box>
        )}
        
        {/* Card image container */}
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