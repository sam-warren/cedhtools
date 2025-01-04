import React, { useState, useEffect, useCallback } from 'react';
import { Box, useTheme, Skeleton } from '@mui/joy';
import {  ICommanderDetail, } from 'src/types';
import { useInView } from 'react-intersection-observer';

interface CommanderCardProps {
  card: ICommanderDetail;
}

const CommanderCard: React.FC<CommanderCardProps> = ({ 
  card
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

  return (
    <Box 
      ref={ref} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        paddingTop: 0,
      }}
    >
      <Box sx={{ width: '100%', position: 'relative' }}>
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
    </Box>
  );
};

export default CommanderCard;