import { Skeleton, Box } from '@mui/joy';
import React, { useState } from 'react';
import { useFadeAnimation } from 'src/hooks/useFadeAnimation';

const ImageWithLoading: React.FC<{
  src: string;
  alt: string;
  onLoad?: () => void;
  sx?: any;
}> = ({ src, alt, onLoad, sx }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const { fadeInStyle: skeletonFade } = useFadeAnimation({
    isLoading: isLoaded,
    data: src,
    error: null,
  });

  const { fadeInStyle: cardFade } = useFadeAnimation({
    isLoading: !isLoaded,
    data: src,
    error: null,
  });

  return (
    <Box
      sx={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          ...sx,
          position: 'absolute',
          top: 0,
          left: 0,
          ...cardFade,
        }}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
      />
      <Skeleton
        variant="rectangular"
        animation="pulse"
        width="100%"
        height="100%"
        sx={{
          ...sx,
          ...skeletonFade,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </Box>
  );
};

export default React.memo(ImageWithLoading);
