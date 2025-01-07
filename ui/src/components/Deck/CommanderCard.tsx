import React, { useState, useEffect, useCallback } from 'react';
import { Box, useTheme, Skeleton } from '@mui/joy';
import { ICommanderDetail } from 'src/types';
import { useInView } from 'react-intersection-observer';
import { cardStyles } from 'src/styles';

interface CommanderCardProps {
  card: ICommanderDetail;
}

const CommanderCard: React.FC<CommanderCardProps> = ({ card }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '250px 0px',
    triggerOnce: true,
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

  return (
    <Box ref={ref} sx={cardStyles.cardContainer('commander')}>
      <Box sx={cardStyles.wrapper}>
        <Box sx={cardStyles.imageContainer(theme, 'commander')}>
          {isLoaded ? (
            <Box
              component="img"
              src={card.image_uris.normal}
              alt={card.name}
              sx={cardStyles.image('commander')}
            />
          ) : (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              sx={cardStyles.image('commander')}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CommanderCard;
