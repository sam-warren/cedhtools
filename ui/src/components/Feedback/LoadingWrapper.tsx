import React, { ReactNode, useState, useEffect } from 'react';
import { Box, Theme } from '@mui/joy';
import { SxProps } from '@mui/material';
import { useFadeAnimation } from 'src/hooks/useFadeAnimation';

interface LoadingWrapperProps {
  loading: boolean;
  skeleton?: ReactNode;
  staticRender?: boolean;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * LoadingWrapper component manages the display of loading skeletons and content with fade transitions.
 *
 * @param {LoadingWrapperProps} props
 * @returns {JSX.Element}
 */
const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  skeleton = null,
  staticRender = false,
  children,
  sx = {},
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!loading && staticRender && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [loading, staticRender, hasLoaded]);

  // Fade style for skeleton
  const { fadeStyle: skeletonFadeStyle, isDisplayed: isSkeletonDisplayed } =
    useFadeAnimation({
      isVisible: loading,
    });

  // Fade style for content
  const { fadeStyle: contentFadeStyle, isDisplayed: isContentDisplayed } =
    useFadeAnimation({
      isVisible: !loading || (staticRender && hasLoaded),
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
      {/* Skeleton Overlay */}
      {loading &&
        skeleton &&
        isSkeletonDisplayed &&
        (!staticRender || !hasLoaded) && (
          <Box
            sx={{
              ...skeletonFadeStyle,
              zIndex: 1,
            }}
          >
            {skeleton}
          </Box>
        )}

      {/* Main Content */}
      {isContentDisplayed &&
        ((!loading && !staticRender) || (staticRender && hasLoaded)) && (
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

      {/* Content Rendered During Loading Without Skeleton */}
      {isContentDisplayed && loading && !skeleton && (
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
    </Box>
  );
};

export default LoadingWrapper;