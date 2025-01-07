import { useEffect, useState } from 'react';

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
  options: UseFadeAnimationOptions = {},
) => {
  const { duration = 0.3, delay = 0, timingFunction = 'ease-out' } = options;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!loadingState.isLoading && loadingState.data && !loadingState.error) {
      // Delay the visibility change slightly to ensure proper mounting
      timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, 50);
    } else {
      setIsVisible(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loadingState.isLoading, loadingState.data, loadingState.error]);

  const fadeInStyle = {
    opacity: isVisible ? 1 : 0,
    transition: `opacity ${duration}s ${timingFunction} ${delay}s`,
    visibility: isVisible ? 'visible' : 'hidden',
  };

  return {
    fadeInStyle,
    isReady: isVisible,
  };
};
