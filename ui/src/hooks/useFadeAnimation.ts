// src/hooks/useFadeAnimation.ts
import { useState, useEffect, CSSProperties } from 'react';

interface FadeAnimationParams {
  isVisible: boolean;
}

interface FadeAnimationResult {
  fadeStyle: CSSProperties;
  isDisplayed: boolean;
}

export const useFadeAnimation = ({
  isVisible,
}: FadeAnimationParams): FadeAnimationResult => {
  const [display, setDisplay] = useState<boolean>(isVisible);
  const [fadeStyle, setFadeStyle] = useState<CSSProperties>({
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.5s',
  });

  useEffect(() => {
    if (isVisible) {
      setDisplay(true);
      setFadeStyle({ opacity: 1, transition: 'opacity 0.5s' });
    } else {
      setFadeStyle({ opacity: 0, transition: 'opacity 0.5s' });
      const timeout = setTimeout(() => setDisplay(false), 500); // Match transition duration
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  return { fadeStyle, isDisplayed: display };
};
