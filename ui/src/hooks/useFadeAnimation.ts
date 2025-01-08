import { useState, useEffect, CSSProperties } from 'react';
import { ANIMATION_DURATIONS } from 'src/constants/animations';

interface FadeAnimationParams {
  isVisible: boolean;
  duration?: number;
}

interface FadeAnimationResult {
  fadeStyle: CSSProperties;
  isDisplayed: boolean;
}

export const useFadeAnimation = ({
  isVisible,
  duration = ANIMATION_DURATIONS.fadeTransition,
}: FadeAnimationParams): FadeAnimationResult => {
  const [isDisplayed, setIsDisplayed] = useState(isVisible);
  const [fadeStyle, setFadeStyle] = useState<CSSProperties>({
    opacity: isVisible ? 1 : 0,
    transition: `opacity ${duration}ms ease-in-out`,
  });

  useEffect(() => {
    if (isVisible) {
      setIsDisplayed(true);
      // Using requestAnimationFrame to ensure the opacity transition occurs
      setFadeStyle({
        opacity: 1,
        transition: `opacity ${duration}ms ease-in-out`,
      });
    } else {
      setFadeStyle({
        opacity: 0,
        transition: `opacity ${duration}ms ease-in-out`,
      });
    }
  }, [isVisible, duration]);

  return { fadeStyle, isDisplayed };
};
