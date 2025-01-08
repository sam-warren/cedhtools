import { ReactNode, memo, useState, useEffect } from 'react';
import { Box, Theme } from '@mui/joy';
import { SxProps } from '@mui/material';
import { useFadeAnimation } from '../../hooks/useFadeAnimation';
import { ANIMATION_DURATIONS } from 'src/constants/animations';

export interface LoadingWrapperProps {
  /** Whether the component is in a loading state */
  loading: boolean;
  /** Optional skeleton component to show during loading */
  skeleton?: ReactNode;
  /** Children to render */
  children: ReactNode;
  /** Whether the content should be conditionally rendered */
  when?: boolean;
  /** Whether to keep content visible after first render */
  staticRender?: boolean;
  /** Custom animation duration in milliseconds */
  duration?: number;
  /** Optional MUI styling */
  sx?: SxProps<Theme>;
}

export const LoadingWrapper = memo(function LoadingWrapper({
  loading,
  skeleton,
  children,
  when = true,
  staticRender = false,
  duration = ANIMATION_DURATIONS.fadeTransition,
  sx = {},
}: LoadingWrapperProps) {
  const [hasShownContent, setHasShownContent] = useState(false);

  const shouldShow = when && (!loading || !skeleton);

  // Update hasShownContent when content should be shown
  useEffect(() => {
    if (shouldShow && !hasShownContent) {
      // Small delay to ensure we don't show content during initial load
      const timer = setTimeout(() => {
        setHasShownContent(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  // For static render, once content is shown, it stays visible
  const effectiveShow = staticRender
    ? shouldShow || hasShownContent
    : shouldShow;

  const { fadeStyle: contentFadeStyle, isDisplayed: showContent } =
    useFadeAnimation({
      isVisible: effectiveShow,
      duration,
    });

  const { fadeStyle: skeletonFadeStyle, isDisplayed: showSkeleton } =
    useFadeAnimation({
      isVisible: loading && !!skeleton && !hasShownContent,
      duration,
    });

  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: 'fit-content',
        minHeight: 'fit-content',
        ...sx,
      }}
    >
      {/* Content container with proper flow handling */}
      <Box
        sx={{
          position: 'relative',
          visibility: showContent ? 'visible' : 'hidden',
          opacity: showContent ? contentFadeStyle.opacity : 0,
          transition: contentFadeStyle.transition,
          height: showContent ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>

      {/* Skeleton overlay */}
      {skeleton && showSkeleton && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            ...skeletonFadeStyle,
          }}
        >
          {skeleton}
        </Box>
      )}
    </Box>
  );
});

export default LoadingWrapper;
