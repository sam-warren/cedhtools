import React, { ReactNode, useState, useEffect } from 'react';
import { Box, Theme } from '@mui/joy';
import { SxProps } from '@mui/material';
import { useFadeAnimation } from 'src/hooks/useFadeAnimation';
import { ANIMATION_DURATIONS } from 'src/constants/animations';

interface LoadingWrapperProps {
  loading: boolean;
  skeleton?: ReactNode;
  staticRender?: boolean;
  children: ReactNode;
  sx?: SxProps<Theme>;
}
const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  skeleton,
  staticRender = false,
  children,
  sx = {},
}) => {
  const [hasLoaded, setHasLoaded] = useState(!loading);

  useEffect(() => {
    if (!loading && staticRender) {
      setHasLoaded(true);
    }
  }, [loading, staticRender]);

  const shouldShowContent = !loading || (staticRender && hasLoaded);
  const shouldShowSkeleton = loading && (!staticRender || !hasLoaded);

  const { fadeStyle: contentFadeStyle, isDisplayed: isContentDisplayed } =
    useFadeAnimation({
      isVisible: shouldShowContent,
      duration: ANIMATION_DURATIONS.fadeTransition,
      isInitialTransition: staticRender,
    });

  const { fadeStyle: skeletonFadeStyle, isDisplayed: isSkeletonDisplayed } =
    useFadeAnimation({
      isVisible: shouldShowSkeleton,
      duration: ANIMATION_DURATIONS.fadeTransition,
      isInitialTransition: staticRender,
    });

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...sx,
      }}
    >
      {isContentDisplayed && (
        <Box
          sx={{
            ...contentFadeStyle,
            position: 'relative',
            zIndex: 0,
          }}
        >
          {children}
        </Box>
      )}
      {isSkeletonDisplayed && skeleton && (
        <Box
          sx={{
            ...skeletonFadeStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        >
          {skeleton}
        </Box>
      )}
    </Box>
  );
};

export default LoadingWrapper;
