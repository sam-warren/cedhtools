import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme, Skeleton } from '@mui/joy';
import { ICardStatistics } from 'src/types';
import { useInView } from 'react-intersection-observer';

interface DeckCardProps {
  card: ICardStatistics;
  showDetails?: boolean;
}

const DeckCard: React.FC<DeckCardProps> = ({ card, showDetails = true }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({ 
    threshold: 0,  // Trigger as soon as even 1px is visible
    rootMargin: '200px 0px', // Start loading when within 200px of viewport
    triggerOnce: true // Only trigger once per card
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

  return (
    <Box 
      ref={ref} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center'
      }}
    >
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