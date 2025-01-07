import { useEffect, useState, useRef } from 'react';

export interface UseFadeAnimationOptions {
  duration?: number;
  delay?: number;
  timingFunction?: string;
}

export const useFadeAnimation = (
  loadingState: {
    isLoading: boolean;
    data: any | null;
    error: string | null;
  },
  options: UseFadeAnimationOptions = {}
) => {
  const {
    duration = 0.3,
    delay = 0,
    timingFunction = 'ease-out',
  } = options;

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const previousDataRef = useRef<any | null>(null);

  useEffect(() => {
    // Only trigger animation if:
    // 1. Not loading
    // 2. Data exists
    // 3. No error
    // 4. Data has changed from previous render
    if (
      !loadingState.isLoading && 
      loadingState.data && 
      !loadingState.error && 
      loadingState.data !== previousDataRef.current
    ) {
      setShouldAnimate(true);
      previousDataRef.current = loadingState.data;
    }
  }, [loadingState.isLoading, loadingState.data, loadingState.error]);

  const fadeInStyle = shouldAnimate
    ? {
        animation: `fadeInContent ${duration}s ${timingFunction} ${delay}s forwards`,
        opacity: 0,
      }
    : {};

  return {
    fadeInStyle,
    isReady: shouldAnimate,
  };
};