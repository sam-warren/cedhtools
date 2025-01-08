// src/components/Feedback/LoadingWrapper.tsx
import React, { ReactNode } from 'react';
import { Box, Theme } from '@mui/joy';
import { SxProps } from '@mui/material';
import { useFadeAnimation } from 'src/hooks/useFadeAnimation';

interface LoadingWrapperProps {
  loading: boolean;
  skeleton?: ReactNode;
  staticRender?: boolean; // Renamed `static` to `staticRender` to avoid reserved keyword
  children: ReactNode;
  sx?: SxProps<Theme>; // Optional styling prop
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
  // Fade style for skeleton
  const { fadeStyle: skeletonFadeStyle, isDisplayed: isSkeletonDisplayed } =
    useFadeAnimation({
      isVisible: loading,
    });

  // Fade style for content
  const { fadeStyle: contentFadeStyle, isDisplayed: isContentDisplayed } =
    useFadeAnimation({
      isVisible: !loading,
    });

  return (
    <Box
      sx={{
        position: 'relative', // Establishes a new positioning context
        width: '100%',
        height: '100%',
        ...sx,
      }}
    >
      {/* Skeleton Overlay */}
      {loading && skeleton && isSkeletonDisplayed && (
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
      {(!loading || (staticRender && isContentDisplayed)) && (
        <Box
          sx={{
            ...contentFadeStyle,
            position: 'relative',
            zIndex: 0, // Below the skeleton
          }}
        >
          {children}
        </Box>
      )}

      {/* Content Rendered During Loading Without Skeleton */}
      {loading && !skeleton && (
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
