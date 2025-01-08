import { Skeleton, Box } from '@mui/joy';
import React, { useState } from 'react';
import { ANIMATION_DURATIONS } from 'src/constants/animations';
interface ImageWithLoadingProps {
  src: string;
  alt: string;
  onLoad?: () => void;
  sx?: any;
}

const ImageWithLoading: React.FC<ImageWithLoadingProps> = ({
  src,
  alt,
  onLoad,
  sx,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

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
          opacity: isLoaded ? 1 : 0,
          transition: `opacity ${ANIMATION_DURATIONS.imageLoad}ms cubic-bezier(0.4, 0, 0.2, 1)`,
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
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: isLoaded ? 0 : 1,
          transition: `opacity ${ANIMATION_DURATIONS.imageLoad}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      />
    </Box>
  );
};

export default React.memo(ImageWithLoading);
